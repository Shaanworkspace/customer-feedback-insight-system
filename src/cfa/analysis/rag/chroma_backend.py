"""ChromaDB RAG backend: sentence-transformers embeddings + vector store."""

import logging
from typing import Any, Dict, List, Optional

from cfa.core.config import (
    RAG_DB_PATH,
    RAG_COLLECTION_NAME,
)

logger = logging.getLogger(__name__)

NAME = "chroma"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

_model = None
_client = None
_collection = None


def _get_model():
    global _model

    if _model is None:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model: %s", EMBEDDING_MODEL_NAME)
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    return _model


def _get_collection():
    global _client, _collection

    if _collection is None:
        import chromadb

        RAG_DB_PATH.mkdir(parents=True, exist_ok=True)

        _client = chromadb.PersistentClient(path=str(RAG_DB_PATH))
        _collection = _client.get_or_create_collection(
            name=RAG_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

        logger.info("ChromaDB collection ready: %s", RAG_COLLECTION_NAME)

    return _collection


def build_index(records: List[Dict]) -> Dict:
    if not records:
        raise ValueError("build_index: records list is empty.")

    clean_records = []

    for index, record in enumerate(records):
        if not isinstance(record, dict):
            continue

        review_id = str(record.get("review_id", f"review_{index}")).strip()
        text = str(record.get("text") or record.get("review_text") or "").strip()

        if not text:
            continue

        clean_records.append({
            "review_id": review_id,
            "text": text,
            "rating": record.get("rating"),
            "date": record.get("date"),
        })

    if not clean_records:
        raise ValueError("build_index: no records with non-empty text.")

    logger.info("Building ChromaDB RAG index for %d reviews.", len(clean_records))

    model = _get_model()
    collection = _get_collection()

    texts = [r["text"] for r in clean_records]
    ids = [r["review_id"] for r in clean_records]
    embeddings = model.encode(texts, show_progress_bar=False).tolist()

    metadatas = [
        {"rating": str(r.get("rating", "")), "date": str(r.get("date", ""))}
        for r in clean_records
    ]

    collection.upsert(ids=ids, documents=texts, metadatas=metadatas, embeddings=embeddings)

    logger.info("ChromaDB contains %d records.", collection.count())

    return {"collection": collection, "records": clean_records, "model": model}


def load_index() -> Optional[Dict]:
    try:
        collection = _get_collection()

        if collection.count() == 0:
            logger.warning("ChromaDB collection contains no reviews.")
            return None

        return {"collection": collection, "model": _get_model()}

    except Exception as exc:
        logger.error("Failed to load ChromaDB index: %s", exc)
        return None


def retrieve(query: str, index: Optional[Dict], top_k: int = 5, min_similarity: float = 0.05) -> List[Dict]:
    if not query or not query.strip():
        return []

    if not index:
        return []

    collection = index.get("collection")
    model = index.get("model")

    if collection is None or model is None:
        return []

    try:
        query_embedding = model.encode([query.strip()]).tolist()
        result = collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, 5),
            include=["documents", "metadatas", "distances"],
        )
    except Exception as exc:
        logger.error("ChromaDB query failed: %s", exc)
        return []

    ids = result.get("ids", [[]])[0]
    documents = result.get("documents", [[]])[0]
    distances = result.get("distances", [[]])[0]

    results = []

    for review_id, text, distance in zip(ids, documents, distances):
        similarity = round(max(0.0, min(1.0, 1.0 - float(distance))), 4)

        if similarity < min_similarity:
            continue

        results.append({
            "review_id": str(review_id),
            "text": str(text),
            "similarity": similarity,
        })

    return results[:5]