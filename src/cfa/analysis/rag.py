"""
RAG module using Sentence Transformers + ChromaDB.

Flow:
    Reviews
       ↓
    all-MiniLM-L6-v2
       ↓
    ChromaDB
       ↓
    Concern query
       ↓
    Top 5 real review proofs

The RAG module uses real review text as evidence.
It never generates or invents review quotes.
"""

import logging
from typing import Any, Dict, List, Optional

import chromadb
from sentence_transformers import SentenceTransformer

from cfa.core.config import (
    RAG_DB_PATH,
    RAG_COLLECTION_NAME,
    RAG_TOP_K,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


# ---------------------------------------------------------------------------
# ChromaDB / Embedding model
# ---------------------------------------------------------------------------

_model: Optional[SentenceTransformer] = None
_client = None
_collection = None


def _get_model() -> SentenceTransformer:
    """Load the embedding model once and reuse it."""

    global _model

    if _model is None:
        logger.info(
            "Loading embedding model: %s",
            EMBEDDING_MODEL_NAME,
        )

        _model = SentenceTransformer(
            EMBEDDING_MODEL_NAME
        )

    return _model


def _get_collection():
    """Create or open the persistent ChromaDB collection."""

    global _client, _collection

    if _collection is None:

        RAG_DB_PATH.mkdir(
            parents=True,
            exist_ok=True,
        )

        _client = chromadb.PersistentClient(
            path=str(RAG_DB_PATH)
        )

        _collection = _client.get_or_create_collection(
            name=RAG_COLLECTION_NAME,
            metadata={
                "hnsw:space": "cosine"
            },
        )

        logger.info(
            "ChromaDB collection ready: %s",
            RAG_COLLECTION_NAME,
        )

    return _collection


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

def build_rag_index(
    records: List[Dict],
    vectorizer: Any = None,
) -> Dict:
    """
    Build the persistent ChromaDB RAG index.

    Parameters
    ----------
    records:
        List of review dictionaries.

        Expected fields:
            review_id
            text OR review_text
            rating
            date

    vectorizer:
        Kept for compatibility with the existing project.
        It is NOT used by the new RAG implementation.

    Returns
    -------
    Dict
        ChromaDB collection, records and embedding model.
    """

    if not records:
        raise ValueError(
            "build_rag_index: records list is empty."
        )

    clean_records = []

    for index, record in enumerate(records):

        if not isinstance(record, dict):
            continue

        review_id = str(
            record.get(
                "review_id",
                f"review_{index}",
            )
        ).strip()

        text = str(
            record.get("text")
            or record.get("review_text")
            or ""
        ).strip()

        if not text:
            continue

        clean_records.append(
            {
                "review_id": review_id,
                "text": text,
                "rating": record.get("rating"),
                "date": record.get("date"),
            }
        )

    if not clean_records:
        raise ValueError(
            "build_rag_index: no records with non-empty text."
        )

    logger.info(
        "Building ChromaDB RAG index for %d reviews.",
        len(clean_records),
    )

    model = _get_model()
    collection = _get_collection()

    texts = [
        record["text"]
        for record in clean_records
    ]

    ids = [
        record["review_id"]
        for record in clean_records
    ]

    # Generate embeddings once for every review.
    embeddings = model.encode(
        texts,
        show_progress_bar=False,
    ).tolist()

    metadatas = []

    for record in clean_records:

        metadata = {
            "rating": str(
                record.get("rating", "")
            ),
            "date": str(
                record.get("date", "")
            ),
        }

        metadatas.append(metadata)

    # upsert makes rebuilding the index safe.
    collection.upsert(
        ids=ids,
        documents=texts,
        metadatas=metadatas,
        embeddings=embeddings,
    )

    logger.info(
        "RAG index built successfully. "
        "ChromaDB contains %d records.",
        collection.count(),
    )

    return {
        "collection": collection,
        "records": clean_records,
        "model": model,
    }


# ---------------------------------------------------------------------------
# Backward compatibility
# ---------------------------------------------------------------------------

def save_rag_index(index: Dict) -> None:
    """
    Backward-compatible save function.

    The old RAG implementation saved vectors using joblib.

    ChromaDB is persistent, so the vectors are already saved on disk
    when build_rag_index() finishes. This function is retained because
    existing project modules import save_rag_index().
    """

    if not index:
        logger.warning(
            "save_rag_index: empty index."
        )
        return

    collection = index.get("collection")

    if collection is None:
        logger.warning(
            "save_rag_index: ChromaDB collection unavailable."
        )
        return

    logger.info(
        "RAG index already persisted in ChromaDB. "
        "Records: %d",
        collection.count(),
    )


# ---------------------------------------------------------------------------
# Load
# ---------------------------------------------------------------------------

def load_rag_index() -> Optional[Dict]:
    """
    Load the existing persistent ChromaDB RAG index.

    ChromaDB persists the vectors automatically, so no joblib file
    needs to be loaded.
    """

    try:

        collection = _get_collection()

        if collection.count() == 0:

            logger.warning(
                "RAG collection exists but contains no reviews."
            )

            return None

        model = _get_model()

        logger.info(
            "RAG index loaded: %d records.",
            collection.count(),
        )

        return {
            "collection": collection,
            "model": model,
        }

    except Exception as exc:

        logger.error(
            "Failed to load RAG index: %s",
            exc,
        )

        return None


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------

def retrieve_similar_reviews(
    query: str,
    rag_index: Optional[Dict],
    top_k: int = RAG_TOP_K,
    min_similarity: float = 0.05,
) -> List[Dict]:
    """
    Retrieve the closest real reviews for a concern.

    Output contract:

        review_id
        text
        similarity

    Maximum number of results: 5.
    """

    if not query or not query.strip():
        return []

    if not rag_index:

        logger.warning(
            "retrieve_similar_reviews: RAG index unavailable."
        )

        return []

    collection = rag_index.get("collection")
    model = rag_index.get("model")

    if collection is None or model is None:

        logger.warning(
            "retrieve_similar_reviews: incomplete RAG index."
        )

        return []

    try:

        query_embedding = model.encode(
            [query.strip()]
        ).tolist()

        result = collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, 5),
            include=[
                "documents",
                "metadatas",
                "distances",
            ],
        )

    except Exception as exc:

        logger.error(
            "RAG query failed: %s",
            exc,
        )

        return []

    ids = result.get(
        "ids",
        [[]],
    )[0]

    documents = result.get(
        "documents",
        [[]],
    )[0]

    distances = result.get(
        "distances",
        [[]],
    )[0]

    results = []

    for review_id, text, distance in zip(
        ids,
        documents,
        distances,
    ):

        # ChromaDB cosine distance:
        #
        # distance = 1 - cosine_similarity
        #
        # Therefore:
        #
        # similarity = 1 - distance

        similarity = 1.0 - float(distance)

        similarity = max(
            0.0,
            min(1.0, similarity),
        )

        similarity = round(
            similarity,
            4,
        )

        if similarity < min_similarity:
            continue

        results.append(
            {
                "review_id": str(review_id),
                "text": str(text),
                "similarity": similarity,
            }
        )

    return results[:5]


# ---------------------------------------------------------------------------
# Concern proof
# ---------------------------------------------------------------------------

def get_proof(
    concern_name: str,
    rag_index: Optional[Dict] = None,
    top_k: int = 5,
) -> List[Dict]:
    """
    Return up to 5 real reviews proving a concern.
    """

    if rag_index is None:
        rag_index = load_rag_index()

    if rag_index is None:
        return []

    return retrieve_similar_reviews(
        query=concern_name,
        rag_index=rag_index,
        top_k=min(top_k, 5),
        min_similarity=0.0,
    )


def get_all_proof(
    concerns: List[str],
    rag_index: Optional[Dict] = None,
    top_k: int = 5,
) -> Dict[str, List[Dict]]:
    """
    Get proof reviews for every concern.

    Example:

    {
        "battery": [
            {
                "review_id": "speaker_0001",
                "text": "Battery drains too fast, dies quickly",
                "similarity": 0.91
            }
        ]
    }
    """

    if rag_index is None:
        rag_index = load_rag_index()

    if rag_index is None:

        return {
            concern: []
            for concern in concerns
        }

    proof = {}

    for concern in concerns:

        proof[concern] = get_proof(
            concern_name=concern,
            rag_index=rag_index,
            top_k=min(top_k, 5),
        )

    return proof


# ---------------------------------------------------------------------------
# Backward-compatible evidence helper
# ---------------------------------------------------------------------------

def build_rag_evidence(
    similar_reviews: List[Dict],
) -> List[Dict]:
    """
    Keep the existing pipeline function available.

    Converts retrieved real reviews into the project's evidence
    structure without generating any new review text.
    """

    if not similar_reviews:
        return []

    evidence = []

    for review in similar_reviews:

        evidence.append(
            {
                "review_id": review.get("review_id"),
                "text": review.get("text", ""),
                "similarity": review.get(
                    "similarity",
                    0.0,
                ),
            }
        )

    return evidence