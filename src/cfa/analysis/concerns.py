"""Concern analysis: detect what a review is about and how it feels."""

import re

from cfa.ml.serve import predict_sentiment
from cfa.analysis.extract import extract_aspects
from cfa.analysis.rag import find_similar

_CLAUSE_SPLIT = re.compile(
    r"(?<=[.!?,;])\s+|\s+(?:but|and|although|however|yet|so|because|while|whereas)\s+",
    re.I,
)


def _clause_polarities(text):
    """Run the trained model on each clause; return (has_positive, has_negative).

    Conjunctions/punctuation are only used to segment the text; the polarity
    of each clause comes from the actual ML model, not from keywords.
    """
    clauses = [c.strip() for c in _CLAUSE_SPLIT.split(text) if c.strip()]
    if len(clauses) < 2:
        return False, False
    has_pos = has_neg = False
    for c in clauses:
        r = predict_sentiment(c)
        if r["label"] == "positive" and r["confidence"] >= 0.5:
            has_pos = True
        elif r["label"] == "negative" and r["confidence"] >= 0.5:
            has_neg = True
    return has_pos, has_neg


def _classify_overall(text, aspects):
    """4-class overall sentiment from aspect-level + clause-level signals.

    - Mixed: positive AND negative present (from aspects or from opposite
      polarities across clauses, each judged by the trained model).
    - Positive / Negative: only that polarity present.
    - Neutral: no clear polarity and the text-level model is uncertain
      (low confidence) — i.e. factual / no clear opinion.
    - otherwise fall back to the text-level model label.
    """
    model_res = predict_sentiment(text)
    label = model_res["label"]
    conf = model_res["confidence"]
    pos = sum(1 for a in aspects if a.get("sentiment") == "positive")
    neg = sum(1 for a in aspects if a.get("sentiment") == "negative")
    if pos > 0 and neg > 0:
        return "mixed", conf
    cp_pos, cp_neg = _clause_polarities(text)
    if (pos > 0 and cp_neg) or (neg > 0 and cp_pos) or (cp_pos and cp_neg and not (pos or neg)):
        return "mixed", conf
    if pos > 0:
        return "positive", conf
    if neg > 0:
        return "negative", conf
    if any(a.get("sentiment") == "neutral" for a in aspects):
        return "neutral", conf
    if conf < 0.6:
        return "neutral", conf
    return label, conf


def _aspects_view(aspects):
    return [{"aspect": a["name"], "sentiment": a.get("sentiment")} for a in aspects]


def analyze_review(text: str, include_similar: bool = True) -> dict:
    aspects = extract_aspects([text])[0]
    label, conf = _classify_overall(text, aspects)
    return {
        "review_text": text,
        "overall_sentiment": label,
        "sentiment": label,
        "overall_confidence": conf,
        "concerns": aspects,
        "aspects": _aspects_view(aspects),
        "similar_reviews": find_similar(text) if include_similar else [],
    }


def analyze_reviews(texts: list) -> list:
    """Batch version for the upload pipeline (one LLM call for all rows)."""
    all_aspects = extract_aspects(texts)
    out = []
    for text, aspects in zip(texts, all_aspects):
        label, conf = _classify_overall(text, aspects)
        out.append(
            {
                "overall_sentiment": label,
                "overall_confidence": conf,
                "concerns": aspects,
                "aspects": _aspects_view(aspects),
            }
        )
    return out
