"""Upload pipeline: CSV -> analyze -> aggregate -> save stats."""

import csv
import io
import json
import re
import uuid

from cfa.analysis.concerns import analyze_review
from cfa.analysis.rag import find_similar
from cfa.core.config import CONCERN_STATS_PATH, REVIEWS_PATH
from cfa.ranking.priority import rank_concerns


def process_csv(content: bytes) -> dict:
    reviews = []
    concern_counts = {}
    reader = csv.DictReader(io.StringIO(content.decode("utf-8"), newline=""))
    text_col = next(
        (name for name in (reader.fieldnames or []) if name.strip().lower() in ("review_text", "review text", "reviewtext", "text", "review")),
        None,
    )
    rating_col = next(
        (name for name in (reader.fieldnames or []) if name.strip().lower() in ("rating", "stars", "review rating")),
        None,
    )
    country_col = next(
        (name for name in (reader.fieldnames or []) if name.strip().lower() == "country"),
        None,
    )
    date_col = next(
        (name for name in (reader.fieldnames or []) if name.strip().lower() in ("date", "review date", "date of experience")),
        None,
    )
    reviewer_col = next(
        (name for name in (reader.fieldnames or []) if name.strip().lower() in ("reviewer name", "reviewer", "author", "user")),
        None,
    )
    for row in reader:
        if not text_col:
            break
        text = (row.get(text_col) or "").strip()
        if not text:
            continue
        result = analyze_review(text, include_similar=False)
        sentiment = "positive" if result["overall_sentiment"] == "positive" else "negative"
        raw_rating = row.get(rating_col) if rating_col else None
        match = re.search(r"\d+", str(raw_rating)) if raw_rating else None
        rating = int(match.group()) if match else None
        reviews.append(
            {
                "review_id": str(uuid.uuid4())[:8],
                "text": text,
                "entity": result["concerns"][0]["name"] if result["concerns"] else "general",
                "sentiment": sentiment,
                "rating": rating,
                "country": (row.get(country_col) or "").strip() if country_col else "",
                "date": (row.get(date_col) or "").strip() if date_col else "",
                "reviewer": (row.get(reviewer_col) or "").strip() if reviewer_col else "",
            }
        )
        for c in result["concerns"]:
            entry = concern_counts.setdefault(c["name"], {"count": 0, "negative": 0, "texts": []})
            entry["count"] += 1
            if c["sentiment"] == "negative":
                entry["negative"] += 1
            entry["texts"].append(text)

    REVIEWS_PATH.write_text(json.dumps(reviews, indent=2))

    total = len(reviews)
    positive = sum(1 for r in reviews if r["sentiment"] == "positive")
    negative = total - positive

    ranked = rank_concerns(
        {
            "concerns": [
                {
                    "name": name,
                    "count": entry["count"],
                    "negative_pct": round(entry["negative"] / entry["count"] * 100, 1),
                }
                for name, entry in concern_counts.items()
            ]
        }
    )

    proof_by_concern = {
        name: [{"text": t, "similarity": 1.0} for t in entry["texts"][:3]]
        for name, entry in concern_counts.items()
    }

    reviews_by_id = {r["review_id"]: r for r in reviews}
    comments_by_concern = {}
    for name in concern_counts:
        items = []
        for s in find_similar(name.replace("_", " "), top_k=5):
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
                }
            )
        comments_by_concern[name] = items

    stats = {
        "total_reviews": total,
        "sentiment_distribution": {"positive": positive, "negative": negative},
        "ranked_concerns": ranked,
        "representative_reviews": [
            {"review_id": r["review_id"], "text": r["text"], "sentiment": r["sentiment"]}
            for r in reviews[:3]
        ],
        "proof_by_concern": proof_by_concern,
        "comments_by_concern": comments_by_concern,
    }

    CONCERN_STATS_PATH.write_text(json.dumps(stats, indent=2))
    return stats