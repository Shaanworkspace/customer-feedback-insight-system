"""Dashboard stats: read real concern_stats.json and reviews.json.

The backend writes concern_stats.json after every upload.
This module only reads that saved data, so the dashboard
never shows fake numbers.
"""

import json
import re

from cfa.core.config import CONCERN_STATS_PATH, REVIEWS_PATH

_EMPTY = {
    "total_reviews": 0,
    "sentiment_distribution": {"positive": 0, "negative": 0},
    "ranked_concerns": [],
    "representative_reviews": [],
    "proof_by_concern": {},
    "comments_by_concern": {},
}


def _load(path, default):
    if path.exists():
        return json.loads(path.read_text())
    return default


def get_stats() -> dict:
    stats = {**_EMPTY, **_load(CONCERN_STATS_PATH, {})}
    if not stats.get("representative_reviews"):
        stats["representative_reviews"] = get_representative_reviews(3)
    return stats


def get_representative_reviews(n: int = 3) -> list:
    reviews = _load(REVIEWS_PATH, [])
    seen, picks = set(), []
    for r in reversed(reviews):
        if r["review_id"] in seen:
            continue
        seen.add(r["review_id"])
        picks.append({"review_id": r["review_id"], "text": r["text"], "sentiment": r["sentiment"]})
        if len(picks) >= n:
            break
    return picks


def get_reviews() -> list:
    return _load(REVIEWS_PATH, [])


def get_countries() -> dict:
    counts = {}
    for r in get_reviews():
        country = r.get("country", "unknown")
        counts[country] = counts.get(country, 0) + 1
    return dict(sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:10])


def get_time_trend() -> list:
    counts = {}
    for r in get_reviews():
        date = r.get("date", "")
        if not date:
            continue
        match = re.search(r"\d{4}", date)
        if not match:
            continue
        year = match.group()
        counts[year] = counts.get(year, 0) + 1
    return [{"year": y, "count": c} for y, c in sorted(counts.items())]


def get_ratings() -> dict:
    counts = {}
    for r in get_reviews():
        rating = r.get("rating")
        if rating is None:
            continue
        counts[rating] = counts.get(rating, 0) + 1
    return {str(k): v for k, v in sorted(counts.items())}