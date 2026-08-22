"""Concern analysis: detect what a review is about and how it feels."""

import json

from cfa.core.config import CONCERN_LEXICON_PATH
from cfa.ml.serve import predict_sentiment
from cfa.analysis.rag import find_similar

_lexicon = None


def _load_lexicon() -> dict:
    global _lexicon
    if _lexicon is None:
        with open(CONCERN_LEXICON_PATH) as f:
            _lexicon = json.load(f)
    return _lexicon


def detect_concerns(text: str, lexicon: dict = None) -> list:
    lexicon = lexicon or _load_lexicon()
    text_lower = text.lower()
    return [name for name, terms in lexicon.items() if any(t in text_lower for t in terms)]


def analyze_review(text: str, include_similar: bool = True) -> dict:
    lexicon = _load_lexicon()
    concerns = detect_concerns(text, lexicon)
    overall = predict_sentiment(text)
    concern_sentiments = [
        {
            "name": name,
            "sentiment": overall["label"],
            "matched_terms": [lexicon[name][0]],
            "confidence": overall["confidence"],
        }
        for name in concerns
    ]
    return {
        "review_text": text,
        "overall_sentiment": overall["label"],
        "overall_confidence": overall["confidence"],
        "concerns": concern_sentiments,
        "similar_reviews": find_similar(text) if include_similar else [],
    }
