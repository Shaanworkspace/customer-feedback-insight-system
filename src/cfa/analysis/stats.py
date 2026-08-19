"""Dashboard stats contracts.

"""

from cfa.analysis.concern import ASPECTS


def get_sentiment_distribution() -> dict:
    return {"positive": 12400, "negative": 7600}


def get_representative_reviews(n: int = 3) -> list:
    return [
        {"review_id": "r1",
         "text": f"battery {ASPECTS['battery'][0]} dies quickly",
         "sentiment": "negative"},
        {"review_id": "r2",
         "text": f"great {ASPECTS['camera'][0]} quality",
         "sentiment": "positive"},
    ][:n]