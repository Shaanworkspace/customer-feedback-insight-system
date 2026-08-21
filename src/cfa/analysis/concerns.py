"""Concern analysis contracts.

Mock until Ram Ashish + Sharad build the real logic.
"""

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


def detect_concerns(text: str) -> list:
    text_lower = text.lower()
    return [name for name, terms in _load_lexicon().items() if any(t in text_lower for t in terms)]


def analyze_review(text: str) -> dict:
    concerns = detect_concerns(text)
    concern_sentiments = []
    for name in concerns:
        sentiment = predict_sentiment(text)
        concern_sentiments.append(
            {
                "name": name,
                "sentiment": sentiment["label"],
                "matched_terms": [_load_lexicon()[name][0]],
                "confidence": sentiment["confidence"],
            }
        )
    labels = {c["sentiment"] for c in concern_sentiments}
    overall = predict_sentiment(text)
    return {
        "review_text": text,
        "overall_sentiment": "mixed" if len(labels) > 1 else overall["label"],
        "overall_confidence": overall["confidence"],
        "concerns": concern_sentiments,
        "similar_reviews": find_similar(text),
    }
