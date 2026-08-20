"""Upload pipeline: clean -> LLM batches -> append to registry -> filter -> rank -> save.

No database. concern_registry.json and reviews.json in data/ are the
single source of truth, and every upload appends to them (does not
reset them) so the numbers grow across uploads.
"""

import json
import logging
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
from cfa.api.llm import call_llm_batch, rule_based_sentiment
from cfa.ranking.priority import rank_concerns
from cfa.analysis.rag import get_proof, tfidf_backend

logger = logging.getLogger("cfa.api.pipeline")

STATUS = {"status": "idle", "done": 0, "total": 0}


def clean_reviews(df: pd.DataFrame) -> List[str]:
    if "review_text" not in df.columns:
        logger.warning("clean_reviews: CSV has no 'review_text' column. Columns: %s", list(df.columns))
        return []
    cleaned, seen = [], set()
    for raw in df["review_text"].astype(str):
        text = raw.strip()
        if len(text) < MIN_REVIEW_CHARS:
            continue
        if text in seen:
            continue
        seen.add(text)
        cleaned.append(text)
    logger.info("clean_reviews: %d input rows -> %d valid reviews.", len(df), len(cleaned))
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
            logger.warning("_merge_batch: result index %s out of range (batch size %d).", idx, len(batch))
            continue
        text = batch[idx]
        review_id = f"r{id_offset + batch_offset + idx + 1}"
        for aspect in item.get("aspects", []):
            name = aspect.get("entity")
            sentiment = aspect.get("sentiment")
            if not name or sentiment not in ("positive", "negative"):
                logger.warning("_merge_batch: skipped aspect name=%r sentiment=%r.", name, sentiment)
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


def analyze_review(text: str) -> Dict:
    """One-off analysis for the live analyzer. Reads the registry for known
    entity names but does not write anything (upload is the only writer)."""
    registry: Dict[str, Dict] = _load_json(REGISTRY_PATH, {})
    known_entities = list(registry.keys())
    logger.info("analyze_review: known entities in registry: %d", len(known_entities))

    results = call_llm_batch([text], known_entities)
    aspects = results[0].get("aspects", []) if results else []
    logger.info("analyze_review: LLM returned %d aspects.", len(aspects))

    concerns = [
        {"name": a["entity"], "sentiment": a["sentiment"], "confidence": a.get("confidence", 0.5)}
        for a in aspects
        if a.get("entity") and a.get("sentiment") in ("positive", "negative")
    ]

    if concerns:
        negative = sum(1 for c in concerns if c["sentiment"] == "negative")
        overall_sentiment = "negative" if negative > len(concerns) / 2 else "positive"
        overall_confidence = round(sum(c["confidence"] for c in concerns) / len(concerns), 2)
    else:
        overall_sentiment, overall_confidence = rule_based_sentiment(text)
        logger.info("analyze_review: no concerns, used rule-based sentiment: %s", overall_sentiment)

    ranked = rank_concerns({
        "concerns": [
            {"name": c["name"], "count": 1, "negative_pct": 100.0 if c["sentiment"] == "negative" else 0.0}
            for c in concerns
        ]
    })

    return {
        "overall_sentiment": overall_sentiment,
        "overall_confidence": overall_confidence,
        "concerns": concerns,
        "ranked_concerns": ranked,
    }


def run_pipeline(new_reviews: List[str]) -> Dict:
    logger.info("run_pipeline: starting with %d new reviews.", len(new_reviews))
    registry: Dict[str, Dict] = _load_json(REGISTRY_PATH, {})
    reviews_log: List[Dict] = _load_json(REVIEWS_PATH, [])
    prev_stats = _load_json(CONCERN_STATS_PATH, {"total_reviews": 0})

    id_offset = _next_review_number(reviews_log)
    known_entities = list(registry.keys())
    logger.info("run_pipeline: loaded registry (%d concerns), %d past reviews, id_offset=%d.",
                len(registry), len(reviews_log), id_offset)

    total = len(new_reviews)
    STATUS.update(status="processing", done=0, total=total)

    for start in range(0, total, BATCH_MAX):
        batch = new_reviews[start:start + BATCH_MAX]
        logger.info("run_pipeline: processing batch [%d:%d] (%d reviews).", start, start + len(batch), len(batch))
        results = call_llm_batch(batch, known_entities)
        if not results:
            logger.warning("run_pipeline: batch [%d:%d] returned no LLM results — skipped.", start, start + len(batch))
        _merge_batch(registry, reviews_log, batch, id_offset, start, results)
        known_entities = list(registry.keys())
        STATUS["done"] = min(start + len(batch), total)

    for entry in registry.values():
        entry["negative_pct"] = _negative_pct(entry)

    positive = sum(1 for r in reviews_log if r["sentiment"] == "positive")
    negative = sum(1 for r in reviews_log if r["sentiment"] == "negative")
    overall_negative_pct = (negative / (positive + negative) * 100) if (positive + negative) else 0.0
    logger.info("run_pipeline: sentiment overall pos=%d neg=%d (overall negative %.1f%%).",
                positive, negative, overall_negative_pct)

    kept = {
        name: entry for name, entry in registry.items()
        if entry["count"] >= SUPPORT_THRESHOLD and entry["negative_pct"] > overall_negative_pct
    }
    logger.info("run_pipeline: filter kept %d of %d concerns (support>=%d, neg_pct>%.1f%%).",
                len(kept), len(registry), SUPPORT_THRESHOLD, overall_negative_pct)
    for name in kept:
        logger.info("run_pipeline: kept concern '%s' count=%d neg_pct=%.1f%%.",
                    name, kept[name]["count"], kept[name]["negative_pct"])

    proof_by_concern = {}

    if kept and reviews_log:
        rag_records = [
            {"review_id": r["review_id"], "text": r["text"]}
            for r in reviews_log
        ]
        try:
            rag_index = tfidf_backend.build_index(rag_records)
            rag_index["backend"] = tfidf_backend.NAME
        except Exception as exc:
            logger.error("run_pipeline: RAG index build failed: %s", exc)
            rag_index = None
        for concern in kept:
            try:
                proof_by_concern[concern] = get_proof(concern, rag_index, top_k=5)
                logger.info("run_pipeline: proof for '%s' -> %d quotes.",
                            concern, len(proof_by_concern[concern]))
            except Exception as exc:
                logger.warning("run_pipeline: proof for '%s' failed: %s", concern, exc)
                proof_by_concern[concern] = []

    ranked = rank_concerns({
        "concerns": [
            {"name": name, "count": e["count"], "negative_pct": e["negative_pct"]}
            for name, e in kept.items()
        ]
    })
    logger.info("run_pipeline: ranking produced %d priorities.", len(ranked))

    stats = {
        "total_reviews": prev_stats.get("total_reviews", 0) + total,
        "sentiment_distribution": {"positive": positive, "negative": negative},
        "ranked_concerns": ranked,
        "representative_reviews": _pick_representative(reviews_log, kept),
        "proof_by_concern": proof_by_concern,
    }

    try:
        REGISTRY_PATH.write_text(json.dumps(registry, indent=2))
        REVIEWS_PATH.write_text(json.dumps(reviews_log, indent=2))
        CONCERN_STATS_PATH.write_text(json.dumps(stats, indent=2))
        logger.info("run_pipeline: saved registry, reviews, and stats to disk.")
    except Exception as exc:
        logger.error("run_pipeline: failed to write output files: %s", exc)

    STATUS.update(status="done", done=total, total=total)
    logger.info("run_pipeline: finished. total_reviews=%d", stats["total_reviews"])
    return stats