"""
RAG facade: picks ChromaDB backend, falls back to TF-IDF.

Both backends expose the same interface:

    build_index(records) -> index
    load_index() -> index | None
    retrieve(query, index, top_k, min_similarity) -> List[Dict]

The index dict carries a "backend" key so retrieval dispatches
to the correct backend.
"""

import logging
from typing import Any, Dict, List, Optional

from cfa.core.config import RAG_BACKEND, RAG_TOP_K

from cfa.analysis.rag import chroma_backend, tfidf_backend

logger = logging.getLogger(__name__)

DEFAULT_BACKEND = RAG_BACKEND


def _resolve_backend(name: str):
    if name == "tfidf":
        return tfidf_backend
    return chroma_backend


def build_rag_index(records: List[Dict], vectorizer: Any = None) -> Dict:
    if DEFAULT_BACKEND == "tfidf":
        index = tfidf_backend.build_index(records)
        index["backend"] = tfidf_backend.NAME
        tfidf_backend.save_index(index)
        return index

    backend = chroma_backend

    try:
        index = backend.build_index(records)
        index["backend"] = backend.NAME
        return index
    except Exception as exc:
        logger.warning("ChromaDB build failed (%s), using TF-IDF.", exc)

    backend = tfidf_backend
    index = backend.build_index(records)
    index["backend"] = backend.NAME
    tfidf_backend.save_index(index)
    return index


def save_rag_index(index: Dict) -> None:
    if not index:
        logger.warning("save_rag_index: empty index.")
        return

    if index.get("backend") == "tfidf":
        tfidf_backend.save_index(index)
        return

    collection = index.get("collection")
    if collection is None:
        logger.warning("save_rag_index: ChromaDB collection unavailable.")
        return

    logger.info("ChromaDB index already persisted. Records: %d", collection.count())


def load_rag_index() -> Optional[Dict]:
    if DEFAULT_BACKEND == "tfidf":
        index = tfidf_backend.load_index()
        if index is None:
            return None
        index["backend"] = tfidf_backend.NAME
        return index

    backend = chroma_backend
    index = backend.load_index()

    if index is not None:
        index["backend"] = backend.NAME
        return index

    logger.warning("ChromaDB unavailable, falling back to TF-IDF.")
    backend = tfidf_backend
    index = backend.load_index()

    if index is None:
        return None

    index["backend"] = backend.NAME
    return index


def ensure_index() -> Dict:
    """Load an existing RAG index, or build the TF-IDF one from the
    bundled sample reviews so proofs always work on a fresh server."""
    index = load_rag_index()

    if index is not None:
        return index

    logger.info("No RAG index found, building TF-IDF from sample data.")
    index = tfidf_backend.build_index(_load_sample_records())
    index["backend"] = tfidf_backend.NAME
    tfidf_backend.save_index(index)
    return index


def _load_sample_records() -> List[Dict]:
    import pandas as pd

    from cfa.core.config import RAG_DATA_DIR

    records = []

    for filename in ("laptop_reviews.csv", "speaker_reviews.csv", "watch_reviews.csv"):
        path = RAG_DATA_DIR / filename

        if not path.exists():
            logger.warning("Sample file not found: %s", path)
            continue

        df = pd.read_csv(path)

        for _, row in df.iterrows():
            text = str(row.get("review_text", "")).strip()

            if not text:
                continue

            records.append({
                "review_id": str(row.get("review_id", "")).strip(),
                "text": text,
                "rating": row.get("rating"),
                "date": row.get("date"),
            })

    if not records:
        raise ValueError("No sample review records found.")

    logger.info("Loaded %d sample reviews for RAG.", len(records))
    return records


def retrieve_similar_reviews(
    query: str,
    rag_index: Optional[Dict],
    top_k: int = RAG_TOP_K,
    min_similarity: float = 0.05,
) -> List[Dict]:
    if not query or not query.strip():
        return []

    if not rag_index:
        logger.warning("retrieve_similar_reviews: RAG index unavailable.")
        return []

    backend = _resolve_backend(rag_index.get("backend", DEFAULT_BACKEND))
    return backend.retrieve(query, rag_index, top_k, min_similarity)


def get_proof(
    concern_name: str,
    rag_index: Optional[Dict] = None,
    top_k: int = 5,
) -> List[Dict]:
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
    if rag_index is None:
        rag_index = load_rag_index()

    if rag_index is None:
        return {concern: [] for concern in concerns}

    return {
        concern: get_proof(concern_name=concern, rag_index=rag_index, top_k=min(top_k, 5))
        for concern in concerns
    }


def build_rag_evidence(similar_reviews: List[Dict]) -> List[Dict]:
    if not similar_reviews:
        return []

    return [
        {
            "review_id": review.get("review_id"),
            "text": review.get("text", ""),
            "similarity": review.get("similarity", 0.0),
        }
        for review in similar_reviews
    ]