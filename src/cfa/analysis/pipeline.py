"""
src/cfa/analysis/pipeline.py
Orchestration layer for the concern analysis pipeline.
"""

import logging
from typing import Any, Dict, List, Optional

from cfa.analysis.concern import detect_concerns
from cfa.analysis.aspect_sentiment import analyze_aspect_sentiment, predict_sentiment
from cfa.analysis.rag import retrieve_similar_reviews, build_rag_evidence
from cfa.core.config import RAG_TOP_K

logger = logging.getLogger(__name__)


def analyze_review(
    review_text: str,
    sentiment_model: Any,
    vectorizer: Any,
    rag_index: Optional[Dict],
    top_k: int = RAG_TOP_K,
    min_similarity: float = 0.05,
    context_window: int = 8,
) -> Dict:
    """
    Full analysis pipeline for a single customer review.
    Never raises. All failures are caught and logged individually.
    """
    review_text = (review_text or "").strip()

    if not review_text:
        logger.info("analyze_review: received empty text.")
        return _empty_result()

    # 1. Overall sentiment
    overall = {"label": "neutral", "confidence": None}
    if sentiment_model and vectorizer:
        try:
            overall = predict_sentiment(review_text, sentiment_model, vectorizer)
        except Exception as exc:
            logger.warning("Overall sentiment failed: %s", exc)

    # 2. Concern detection
    raw_concerns: List[Dict] = []
    try:
        raw_concerns = detect_concerns(review_text)
    except Exception as exc:
        logger.error("Concern detection failed: %s", exc)

    # 3. Aspect-level sentiment
    aspect_sentiments: Dict[str, Dict] = {}
    if raw_concerns and sentiment_model and vectorizer:
        try:
            aspect_sentiments = analyze_aspect_sentiment(
                text=review_text,
                detected_concerns=raw_concerns,
                sentiment_model=sentiment_model,
                vectorizer=vectorizer,
                context_window=context_window,
            )
        except Exception as exc:
            logger.error("Aspect sentiment failed: %s", exc)

    # 4. Build structured concerns list
    concerns = _build_concerns(raw_concerns, aspect_sentiments)

    # 5. RAG retrieval + evidence
    rag_result = _run_rag(review_text, rag_index, top_k, min_similarity)

    return {
        "review":             review_text,
        "overall_sentiment":  overall,
        "concerns":           concerns,
        "rag":                rag_result,
    }


def build_concern_stats(records: List[Dict]) -> Dict:
    """
    Convert analysed review records into the structure
    expected by the ranking teammate's rank_concerns() function.

    Returns
    -------
    {
        "concerns": [
            {"name": "battery", "count": 100, "negative_pct": 0.78},
            ...
        ]
    }
    """
    counts: Dict[str, Dict] = {}

    for record in records:
        for concern in record.get("concerns", []):
            aspect    = concern.get("aspect", "")
            sentiment = concern.get("sentiment", "neutral")

            if not aspect:
                continue

            if aspect not in counts:
                counts[aspect] = {"total": 0, "negative": 0}

            counts[aspect]["total"] += 1
            if str(sentiment).lower() == "negative":
                counts[aspect]["negative"] += 1

    concerns = []
    for aspect, data in counts.items():
        total = data["total"]
        neg   = data["negative"]
        concerns.append({
            "name":         aspect,
            "count":        total,
            "negative_pct": round(neg / total, 4) if total > 0 else 0.0,
        })

    return {"concerns": concerns}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _build_concerns(
    raw_concerns: List[Dict],
    aspect_sentiments: Dict[str, Dict],
) -> List[Dict]:
    """Merge detect_concerns() output with aspect sentiment results."""
    result = []
    for concern in raw_concerns:
        aspect = concern.get("aspect", "")
        asp    = aspect_sentiments.get(aspect, {})
        result.append({
            "aspect":     aspect,
            "keywords":   concern.get("keywords", []),
            "sentiment":  asp.get("sentiment", "neutral"),
            "confidence": asp.get("confidence", None),
            "context":    asp.get("context", ""),
        })
    return result


def _run_rag(
    review_text: str,
    rag_index: Optional[Dict],
    top_k: int,
    min_similarity: float,
) -> Dict:
    """Run RAG retrieval and evidence. Returns empty structure if unavailable."""
    empty = {"top_k": top_k, "similar_reviews": [], "evidence": []}

    if rag_index is None:
        logger.info("RAG index not available — skipping RAG.")
        return empty

    try:
        similar  = retrieve_similar_reviews(
            query=review_text,
            rag_index=rag_index,
            top_k=top_k,
            min_similarity=min_similarity,
        )
        evidence = build_rag_evidence(similar)
        return {
            "top_k":           top_k,
            "similar_reviews": similar,
            "evidence":        evidence,
        }
    except Exception as exc:
        logger.error("RAG failed: %s", exc)
        return empty


def _empty_result() -> Dict:
    return {
        "review":            "",
        "overall_sentiment": {"label": "neutral", "confidence": None},
        "concerns":          [],
        "rag":               {"top_k": RAG_TOP_K, "similar_reviews": [], "evidence": []},
    }