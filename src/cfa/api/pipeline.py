"""Upload pipeline: clean -> LLM batches -> append to registry -> filter -> rank -> save.

No database. concern_registry.json and reviews.json in data/ are the
single source of truth, and every upload appends to them (does not
reset them) so the numbers grow across uploads.
"""

import json
from typing import Dict, List

import pandas as pd

from cfa.api.config import (
    BATCH_MAX,
    CONCERN_STATS_PATH,
    MIN_REVIEW_CHARS,
    REGISTRY_PATH,
    REVIEWS_PATH,
    SUPPORT_THRESHOLD,
)
from cfa.api.llm import call_llm_batch
from cfa.ranking.priority import rank_concerns

STATUS = {"status": "idle", "done": 0, "total": 0}


def clean_reviews(df: pd.DataFrame) -> List[str]:
    if "review_text" not in df.columns:
        return []
    cleaned, seen = [], set()
    for raw in df["review_text"].astype(str):
        text = raw.strip()
        if len(text) < MIN_REVIEW_CHARS or text in seen:
            continue
        seen.add(text)
        cleaned.append(text)
    return cleaned


def _load_json(path, default):
    if path.exists():
        return json.loads(path.read_text())
    return default


def _next_review_number(reviews_log: List[Dict]) -> int:
    max_n = 0
    for row in reviews_log:
        try:
            max_n = max(max_n, int(row["review_id"].lstrip("r")))
        except ValueError:
            continue
    return max_n


def _merge_batch(
    registry: Dict[str, Dict],
    reviews_log: List[Dict],
    batch: List[str],
    id_offset: int,
    batch_offset: int,
    results: List[Dict],
) -> None:
    for item in results:
        idx = item.get("index")
        if idx is None or idx >= len(batch):
            continue
        text = batch[idx]
        review_id = f"r{id_offset + batch_offset + idx + 1}"
        for aspect in item.get("aspects", []):
            name = aspect.get("entity")
            sentiment = aspect.get("sentiment")
            if not name or sentiment not in ("positive", "negative"):
                continue
            entry = registry.setdefault(name, {"count": 0, "positive": 0, "negative": 0})
            entry["count"] += 1
            entry[sentiment] += 1
            reviews_log.append({
                "review_id": review_id,
                "text": text,
                "entity": name,
                "sentiment": sentiment,
            })


def _negative_pct(entry: Dict) -> float:
    return round(entry["negative"] / entry["count"] * 100, 1) if entry["count"] else 0.0


def _pick_representative(reviews_log: List[Dict], kept: Dict[str, Dict], n: int = 2) -> List[Dict]:
    picks = []
    for row in reversed(reviews_log):
        if row["entity"] in kept and row["sentiment"] == "negative":
            picks.append({"review_id": row["review_id"], "text": row["text"], "sentiment": "negative"})
            break
    for row in reversed(reviews_log):
        if row["sentiment"] == "positive":
            picks.append({"review_id": row["review_id"], "text": row["text"], "sentiment": "positive"})
            break
    return picks[:n]


def run_pipeline(new_reviews: List[str]) -> Dict:
    registry: Dict[str, Dict] = _load_json(REGISTRY_PATH, {})
    reviews_log: List[Dict] = _load_json(REVIEWS_PATH, [])
    prev_stats = _load_json(CONCERN_STATS_PATH, {"total_reviews": 0})

    id_offset = _next_review_number(reviews_log)
    known_entities = list(registry.keys())

    total = len(new_reviews)
    STATUS.update(status="processing", done=0, total=total)

    for start in range(0, total, BATCH_MAX):
        batch = new_reviews[start:start + BATCH_MAX]
        results = call_llm_batch(batch, known_entities)
        _merge_batch(registry, reviews_log, batch, id_offset, start, results)
        known_entities = list(registry.keys())
        STATUS["done"] = min(start + len(batch), total)

    for entry in registry.values():
        entry["negative_pct"] = _negative_pct(entry)

    positive = sum(1 for r in reviews_log if r["sentiment"] == "positive")
    negative = sum(1 for r in reviews_log if r["sentiment"] == "negative")
    overall_negative_pct = (negative / (positive + negative) * 100) if (positive + negative) else 0.0

    kept = {
        name: entry for name, entry in registry.items()
        if entry["count"] >= SUPPORT_THRESHOLD and entry["negative_pct"] > overall_negative_pct
    }

    ranked = rank_concerns({
        "concerns": [
            {"name": name, "count": e["count"], "negative_pct": e["negative_pct"]}
            for name, e in kept.items()
        ]
    })

    stats = {
        "total_reviews": prev_stats.get("total_reviews", 0) + total,
        "sentiment_distribution": {"positive": positive, "negative": negative},
        "ranked_concerns": ranked,
        "representative_reviews": _pick_representative(reviews_log, kept),
    }

    REGISTRY_PATH.write_text(json.dumps(registry, indent=2))
    REVIEWS_PATH.write_text(json.dumps(reviews_log, indent=2))
    CONCERN_STATS_PATH.write_text(json.dumps(stats, indent=2))

    STATUS.update(status="done", done=total, total=total)
    return stats