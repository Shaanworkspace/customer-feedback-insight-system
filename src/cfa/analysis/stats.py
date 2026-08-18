"""Dashboard stats contracts.

Mock until Ram Ashish + Sharad wire the real dataset.
"""

from cfa.analysis.concerns import _load_lexicon


def get_sentiment_distribution() -> dict:
    return {"positive": 12400, "negative": 7600}


def get_representative_reviews(n: int = 3) -> list:
    lexicon = _load_lexicon()
    return [
        {"review_id": "r1", "text": f"battery {lexicon['battery'][0]} dies quickly", "sentiment": "negative"},
        {"review_id": "r2", "text": f"great {lexicon['camera'][0]} quality", "sentiment": "positive"},
    ][:n]
