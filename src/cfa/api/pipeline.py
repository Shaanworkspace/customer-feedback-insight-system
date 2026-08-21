"""Upload pipeline: CSV -> analyze -> aggregate -> save stats."""

import csv
import io
import json
import uuid

from cfa.analysis.concerns import analyze_review
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
    for row in reader:
        if not text_col:
            break
        text = (row.get(text_col) or "").strip()
        if not text:
            continue
        result = analyze_review(text, include_similar=False)
        sentiment = "positive" if result["overall_sentiment"] == "positive" else "negative"
        reviews.append(
            {
                "review_id": str(uuid.uuid4())[:8],
                "text": text,
                "entity": result["concerns"][0]["name"] if result["concerns"] else "general",
                "sentiment": sentiment,
            }
        )
        for c in result["concerns"]:
            entry = concern_counts.setdefault(c["name"], {"count": 0, "negative": 0, "texts": []})
            entry["count"] += 1
            if c["sentiment"] == "negative":
                entry["negative"] += 1
            entry["texts"].append(text)

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

    stats = {
        "total_reviews": total,
        "sentiment_distribution": {"positive": positive, "negative": negative},
        "ranked_concerns": ranked,
        "representative_reviews": [
            {"review_id": r["review_id"], "text": r["text"], "sentiment": r["sentiment"]}
            for r in reviews[:3]
        ],
        "proof_by_concern": proof_by_concern,
    }

    CONCERN_STATS_PATH.write_text(json.dumps(stats, indent=2))
    REVIEWS_PATH.write_text(json.dumps(reviews, indent=2))
    return stats