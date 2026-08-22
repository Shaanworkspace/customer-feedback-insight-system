"""Dashboard stats: read the user's latest analysis stored in MySQL.

Each upload saves one analysis row; the dashboard always shows the
user's most recent upload (history keeps the last 3 per user).
"""

import re

from cfa.db.repo import get_latest_analysis

_EMPTY = {
    "total_reviews": 0,
    "sentiment_distribution": {"positive": 0, "negative": 0},
    "ranked_concerns": [],
    "representative_reviews": [],
    "proof_by_concern": {},
    "comments_by_concern": {},
}


def _countries(reviews):
    counts = {}
    for r in reviews:
        country = r.get("country", "unknown")
        counts[country] = counts.get(country, 0) + 1
    return dict(sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:10])


def _time_trend(reviews):
    counts = {}
    for r in reviews:
        date = r.get("date", "")
        if not date:
            continue
        match = re.search(r"\d{4}", date)
        if not match:
            continue
        year = match.group()
        counts[year] = counts.get(year, 0) + 1
    return [{"year": y, "count": c} for y, c in sorted(counts.items())]


def _ratings(reviews):
    counts = {}
    for r in reviews:
        rating = r.get("rating")
        if rating is None:
            continue
        counts[rating] = counts.get(rating, 0) + 1
    return {str(k): v for k, v in sorted(counts.items())}


def _representative(reviews, n=3):
    seen, picks = set(), []
    for r in reversed(reviews):
        if r["review_id"] in seen:
            continue
        seen.add(r["review_id"])
        picks.append({"review_id": r["review_id"], "text": r["text"], "sentiment": r["sentiment"]})
        if len(picks) >= n:
            break
    return picks


def get_stats(user_id):
    data = get_latest_analysis(user_id) or {}
    reviews = data.get("reviews", [])
    stats = {**_EMPTY, **data}
    stats["countries"] = _countries(reviews)
    stats["time_trend"] = _time_trend(reviews)
    stats["ratings"] = _ratings(reviews)
    if not stats.get("representative_reviews"):
        stats["representative_reviews"] = _representative(reviews, 3)
    return stats


def get_reviews(user_id):
    data = get_latest_analysis(user_id) or {}
    return data.get("reviews", [])


def get_concern_comments(concern, user_id):
    data = get_latest_analysis(user_id) or {}
    return data.get("comments_by_concern", {}).get(concern, [])
