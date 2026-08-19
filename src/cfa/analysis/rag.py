

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from scipy.sparse import issparse
from sklearn.metrics.pairwise import cosine_similarity

from cfa.core.config import (
    RAG_INDEX_PATH,
    RAG_ANALYTICS_PATH,
    RAG_TOP_K,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

def build_rag_index(
    records: List[Dict],
    vectorizer: Any,
) -> Dict:
   
    if not records:
        raise ValueError("build_rag_index: records list is empty.")
    if vectorizer is None:
        raise ValueError("build_rag_index: vectorizer is None.")

    # Filter empty texts
    clean = [r for r in records if r.get("text", "").strip()]
    if not clean:
        raise ValueError("build_rag_index: no records with non-empty text.")

    texts = [r["text"] for r in clean]
    logger.info("Building RAG index for %d records …", len(texts))

    # transform() — NOT fit_transform() — critical for vector space consistency
    vectors = vectorizer.transform(texts)
    logger.info(
        "RAG index built. Matrix: %s nnz=%d",
        vectors.shape, vectors.nnz,
    )

    return {
        "vectors":    vectors,
        "records":    clean,
        "vectorizer": vectorizer,
    }


def save_rag_index(index: Dict) -> None:
   
    RAG_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAG_ANALYTICS_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Save vectors + vectorizer together
    joblib.dump(
        {
            "vectors":    index["vectors"],
            "vectorizer": index["vectorizer"],
        },
        RAG_INDEX_PATH,
    )
    logger.info("RAG vectors saved to %s", RAG_INDEX_PATH)

    # Save records separately (human-inspectable)
    joblib.dump(index["records"], RAG_ANALYTICS_PATH)
    logger.info("RAG records saved to %s", RAG_ANALYTICS_PATH)


def load_rag_index() -> Optional[Dict]:
  
    if not RAG_INDEX_PATH.exists() or not RAG_ANALYTICS_PATH.exists():
        logger.warning(
            "RAG index not found. Run: python -m cfa.scripts.build_artifacts"
        )
        return None

    payload = joblib.load(RAG_INDEX_PATH)
    records = joblib.load(RAG_ANALYTICS_PATH)

    logger.info(
        "RAG index loaded: %d records, matrix %s",
        len(records), payload["vectors"].shape,
    )

    return {
        "vectors":    payload["vectors"],
        "records":    records,
        "vectorizer": payload["vectorizer"],
    }


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------

def retrieve_similar_reviews(
    query: str,
    rag_index: Dict,
    top_k: int = RAG_TOP_K,
    min_similarity: float = 0.05,
) -> List[Dict]:
    
    if not query or not query.strip():
        logger.debug("retrieve_similar_reviews: empty query.")
        return []

    vectors    = rag_index.get("vectors")
    records    = rag_index.get("records", [])
    vectorizer = rag_index.get("vectorizer")

    if vectors is None or not records or vectorizer is None:
        logger.warning("retrieve_similar_reviews: rag_index is incomplete.")
        return []

    # Vectorize query using THE SAME vectorizer (not a new fit)
    try:
        query_vec = vectorizer.transform([query])
    except Exception as exc:
        logger.error("Failed to vectorize query: %s", exc)
        return []

    # Guard against zero vector (all unknown vocabulary)
    if issparse(query_vec) and query_vec.nnz == 0:
        logger.debug("retrieve_similar_reviews: query produces zero vector.")
        return []

    # Compute cosine similarity: shape (1, N) → flatten to (N,)
    sims = cosine_similarity(query_vec, vectors).flatten()

    # Sort descending
    sorted_idx = np.argsort(sims)[::-1]

    results: List[Dict] = []
    for idx in sorted_idx:
        if len(results) >= top_k:
            break
        sim = float(round(float(sims[idx]), 4))
        if sim < min_similarity:
            break   # sorted — nothing better follows

        record = records[idx]
        results.append({
            "review":     record.get("text", ""),
            "similarity": sim,
            "sentiment":  record.get("sentiment", None),
            "concerns":   record.get("concerns", []),
            "rating":     record.get("rating", None),
        })

    logger.debug(
        "Retrieved %d similar reviews (top sim=%.3f)",
        len(results),
        results[0]["similarity"] if results else 0.0,
    )
    return results


# ---------------------------------------------------------------------------
# Evidence aggregation
# ---------------------------------------------------------------------------

def build_rag_evidence(similar_reviews: List[Dict]) -> List[Dict]:
  
    if not similar_reviews:
        return []

    # Accumulate per-aspect counts
    counts: Dict[str, Dict[str, int]] = {}
    total_retrieved = len(similar_reviews)

    for review in similar_reviews:
        for concern in review.get("concerns", []):
            aspect    = concern.get("aspect", "")
            sentiment = str(concern.get("sentiment", "neutral")).lower().strip()

            if not aspect:
                continue

            if aspect not in counts:
                counts[aspect] = {
                    "negative": 0,
                    "positive": 0,
                    "neutral":  0,
                    "total":    0,
                }

            counts[aspect]["total"] += 1
            if sentiment == "negative":
                counts[aspect]["negative"] += 1
            elif sentiment == "positive":
                counts[aspect]["positive"] += 1
            else:
                counts[aspect]["neutral"] += 1

    if not counts:
        return []

    evidence: List[Dict] = []
    for aspect, c in counts.items():
        total = c["total"]
        neg   = c["negative"]
        pos   = c["positive"]
        neu   = c["neutral"]

        negative_ratio = round(neg / total, 4) if total > 0 else 0.0
        evidence_text  = _make_evidence_sentence(
            aspect, neg, pos, neu, total, total_retrieved
        )

        evidence.append({
            "aspect":               aspect,
            "similar_review_count": total_retrieved,
            "negative_count":       neg,
            "positive_count":       pos,
            "neutral_count":        neu,
            "negative_ratio":       negative_ratio,
            "evidence_text":        evidence_text,
        })

    evidence.sort(key=lambda x: x["negative_count"], reverse=True)
    return evidence


def _make_evidence_sentence(
    aspect: str,
    neg: int,
    pos: int,
    neu: int,
    total: int,
    total_retrieved: int,
) -> str:
    """Build a factual, one-sentence evidence summary."""
    parts = []
    if neg > 0:
        parts.append(
            f"{neg} of {total_retrieved} similar reviews "
            f"report negative {aspect} experiences"
        )
    if pos > 0:
        parts.append(
            f"{pos} report positive {aspect} experiences"
        )
    if not parts:
        return (
            f"{total} similar reviews mention {aspect} "
            f"with no clear sentiment signal."
        )
    return "; ".join(parts) + "."