"""Upload pipeline: CSV -> preprocess -> analyze -> aggregate -> save stats."""

import re
import uuid

from cfa.analysis.aggregation import ConcernAggregator
from cfa.analysis.concerns import analyze_reviews
from cfa.analysis.preprocessing import preprocess_csv
from cfa.analysis.rag import find_similar
from cfa.analysis.stats import _countries, _ratings
from cfa.ranking.priority import rank_concerns


def _month_trend(reviews):
    counts = {}
    for r in reviews:
        date = r.get("date", "")
        if not date:
            continue
        m = re.search(r"\d{4}-\d{2}", date)
        if not m:
            continue
        counts[m.group()] = counts.get(m.group(), 0) + 1
    return [{"month": k, "count": v} for k, v in sorted(counts.items())]


def process_csv(content: bytes) -> dict:
    rows, _columns = preprocess_csv(content)
    results = analyze_reviews([r["text"] for r in rows])

    reviews = []
    agg = ConcernAggregator()
    for r, result in zip(rows, results):
        sentiment = result["overall_sentiment"]
        attributes = r["attributes"]
        reviews.append(
            {
                "review_id": str(uuid.uuid4())[:8],
                "text": r["text"],
                "entity": result["concerns"][0]["name"] if result["concerns"] else "general",
                "sentiment": sentiment,
                "rating": r["rating"],
                "country": r["country"],
                "date": r["date"],
                "reviewer": r["reviewer"],
                "attributes": attributes,
                "concerns": result["concerns"],
                "aspects": result["aspects"],
            }
        )
        for c in result["concerns"]:
            agg.add(c["name"], c["sentiment"], r["text"])

    total = len(reviews)
    sentiment_distribution = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0}
    for r in reviews:
        sentiment_distribution[r["sentiment"]] = sentiment_distribution.get(r["sentiment"], 0) + 1

    ranked = rank_concerns({"concerns": agg.stats()})
    proof_by_concern = agg.proof()

    reviews_by_id = {r["review_id"]: r for r in reviews}
    comments_by_concern = {}
    for name in agg.counts:
        items = []
        for s in find_similar(name.replace("_", " "), top_k=5, reviews=reviews):
            r = reviews_by_id.get(s["review_id"])
            if not r:
                continue
            items.append(
                {
                    "review_id": r["review_id"],
                    "reviewer": r.get("reviewer") or "Verified Reviewer",
                    "text": r["text"],
                    "rating": r.get("rating"),
                    "country": r.get("country", ""),
                    "date": r.get("date", ""),
                    "sentiment": r["sentiment"],
                    "similarity": s["similarity"],
                    "attributes": r.get("attributes", {}),
                }
            )
        comments_by_concern[name] = items

    return {
        "total_reviews": total,
        "sentiment_distribution": sentiment_distribution,
        "ranked_concerns": ranked,
        "representative_reviews": [
            {"review_id": r["review_id"], "text": r["text"], "sentiment": r["sentiment"]}
            for r in reviews[:3]
        ],
        "proof_by_concern": proof_by_concern,
        "comments_by_concern": comments_by_concern,
        "ratings": _ratings(reviews),
        "countries": _countries(reviews),
        "time_trend": _month_trend(reviews),
        "reviews": reviews,
    }
