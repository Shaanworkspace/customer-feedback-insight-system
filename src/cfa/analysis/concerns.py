"""Concern analysis: detect what a review is about and how it feels."""

from cfa.ml.serve import predict_sentiment
from cfa.analysis.extract import extract_aspects
from cfa.analysis.rag import find_similar


def _aggregate_overall(aspects, model_label):
    pos = sum(1 for a in aspects if a.get("sentiment") == "positive")
    neg = sum(1 for a in aspects if a.get("sentiment") == "negative")
    if not aspects:
        return model_label
    if neg >= pos and neg > 0:
        return "negative"
    if pos > neg:
        return "positive"
    return "neutral"


def analyze_review(text: str, include_similar: bool = True) -> dict:
    aspects = extract_aspects([text])[0]
    overall = predict_sentiment(text)
    for a in aspects:
        if not a.get("sentiment"):
            a["sentiment"] = overall["label"]
    label = _aggregate_overall(aspects, overall["label"])
    return {
        "review_text": text,
        "overall_sentiment": label,
        "overall_confidence": overall["confidence"],
        "concerns": aspects,
        "similar_reviews": find_similar(text) if include_similar else [],
    }


def analyze_reviews(texts: list) -> list:
    """Batch version for the upload pipeline (one LLM call for all rows)."""
    all_aspects = extract_aspects(texts)
    out = []
    for text, aspects in zip(texts, all_aspects):
        overall = predict_sentiment(text)
        for a in aspects:
            if not a.get("sentiment"):
                a["sentiment"] = overall["label"]
        label = _aggregate_overall(aspects, overall["label"])
        out.append(
            {
                "overall_sentiment": label,
                "overall_confidence": overall["confidence"],
                "concerns": aspects,
            }
        )
    return out
