"""TF-IDF RAG backend: lightweight keyword/vector fallback using scikit-learn."""

import logging
from typing import Any, Dict, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from cfa.core.config import RAG_ANALYTICS_PATH, RAG_INDEX_PATH

logger = logging.getLogger(__name__)

NAME = "tfidf"


def _clean_records(records: List[Dict]) -> List[Dict]:
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

    return clean_records


def build_index(records: List[Dict]) -> Dict:
    if not records:
        raise ValueError("build_index: records list is empty.")

    clean_records = _clean_records(records)

    if not clean_records:
        raise ValueError("build_index: no records with non-empty text.")

    logger.info("Building TF-IDF RAG index for %d reviews.", len(clean_records))

    texts = [r["text"] for r in clean_records]
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    matrix = vectorizer.fit_transform(texts)

    logger.info("TF-IDF matrix shape: %s", matrix.shape)

    return {
        "vectorizer": vectorizer,
        "matrix": matrix,
        "records": clean_records,
    }


def load_index() -> Optional[Dict]:
    import joblib

    try:
        vectorizer = joblib.load(RAG_INDEX_PATH)
        payload = joblib.load(RAG_ANALYTICS_PATH)
        matrix = payload["matrix"]
        records = payload["records"]
        logger.info("TF-IDF index loaded: %s", matrix.shape)
        return {"vectorizer": vectorizer, "matrix": matrix, "records": records}
    except Exception as exc:
        logger.warning("TF-IDF index not available: %s", exc)
        return None


def save_index(index: Dict) -> None:
    import joblib

    vectorizer = index.get("vectorizer")
    matrix = index.get("matrix")
    records = index.get("records")

    if vectorizer is None or matrix is None or records is None:
        logger.warning("save_index: incomplete TF-IDF index.")
        return

    RAG_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, RAG_INDEX_PATH)
    joblib.dump({"matrix": matrix, "records": records}, RAG_ANALYTICS_PATH)
    logger.info("TF-IDF index saved.")


def retrieve(query: str, index: Optional[Dict], top_k: int = 5, min_similarity: float = 0.05) -> List[Dict]:
    if not query or not query.strip():
        return []

    if not index:
        return []

    vectorizer = index.get("vectorizer")
    matrix = index.get("matrix")

    if vectorizer is None or matrix is None:
        return []

    try:
        query_vector = vectorizer.transform([query.strip()])
        scores = cosine_similarity(query_vector, matrix)[0]
    except Exception as exc:
        logger.error("TF-IDF query failed: %s", exc)
        return []

    ranked = sorted(
        enumerate(scores),
        key=lambda item: item[1],
        reverse=True,
    )

    results = []

    for position, score in ranked[: top_k]:
        similarity = round(float(score), 4)

        if similarity < min_similarity:
            continue

        record = index["records"][position]

        results.append({
            "review_id": record["review_id"],
            "text": record["text"],
            "similarity": similarity,
        })

    logger.info("TF-IDF retrieve '%s': %d results (top_k=%d, min_sim=%.2f).",
                query, len(results), top_k, min_similarity)
    return results[:5]