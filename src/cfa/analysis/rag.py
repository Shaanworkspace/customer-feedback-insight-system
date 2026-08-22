"""RAG retrieval contract.

Finds real reviews from the saved reviews.json that talk about
the same concern. Simple word-overlap similarity, no model needed.
"""

import json
from typing import List

from cfa.core.config import REVIEWS_PATH

_EXAMPLE = [{"review_id": "abc123", "text_preview": "battery dies in 2 hours, camera is fine", "similarity": 0.83}]


def _load_reviews() -> list:
    if not REVIEWS_PATH.exists():
        return []
    return json.loads(REVIEWS_PATH.read_text())


def _overlap(query: str, text: str) -> float:
    q = set(query.lower().split())
    t = set(text.lower().split())
    if not q:
        return 0.0
    return round(len(q & t) / len(q), 2)


def find_similar(text: str, top_k: int = 5, reviews: list | None = None) -> List[dict]:
    if reviews is None:
        reviews = _load_reviews()
    if not reviews:
        return _EXAMPLE[:top_k]
    scored = [
        (score, r) for r in reviews
        if (score := _overlap(text, r["text"])) > 0
    ]
    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {"review_id": r["review_id"], "text_preview": r["text"], "similarity": score}
        for score, r in scored[:top_k]
    ]