"""FastAPI app: /analyze, /stats, /health."""

import json
import time
from pathlib import Path

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cfa.analysis import analyze_review
from cfa.analysis.rag import load_rag_index
from cfa.analysis.stats import get_representative_reviews, get_sentiment_distribution
from cfa.core.config import CONCERN_STATS_PATH, SENTIMENT_MODEL_PATH, TFIDF_PATH
from cfa.ranking.priority import rank_concerns
from cfa.api.schemas import AnalyzeRequest

app = FastAPI(title="Customer Feedback Insight System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Load ML artifacts once at startup — safely
# ---------------------------------------------------------------------------

try:
    _model = joblib.load(SENTIMENT_MODEL_PATH)
except FileNotFoundError:
    _model = None

try:
    _vectorizer = joblib.load(TFIDF_PATH)
except FileNotFoundError:
    _vectorizer = None

try:
    _rag_index = load_rag_index()
except Exception:
    _rag_index = None


_counter = {"reviews_analyzed": 0, "total_latency_ms": 0.0}

_DEFAULT_STATS = {
    "total_reviews": 20000,
    "total_mentions": 7900,
    "concerns": [
        {"name": "battery",  "count": 3100, "positive": 682,  "negative": 2418, "negative_pct": 78.0},
        {"name": "camera",   "count": 2100, "positive": 1700, "negative": 400,  "negative_pct": 19.0},
        {"name": "delivery", "count": 1500, "positive": 675,  "negative": 825,  "negative_pct": 55.0},
        {"name": "price",    "count": 1200, "positive": 800,  "negative": 400,  "negative_pct": 33.3},
    ],
}


def _concern_stats() -> dict:
    if Path(CONCERN_STATS_PATH).exists():
        with open(CONCERN_STATS_PATH) as f:
            return json.load(f)
    return _DEFAULT_STATS


@app.get("/health")
def health():
    avg = (
        _counter["total_latency_ms"] / _counter["reviews_analyzed"]
        if _counter["reviews_analyzed"] else 0.0
    )
    return {
        "status":            "ok",
        "reviews_analyzed":  _counter["reviews_analyzed"],
        "avg_latency_ms":    round(avg, 2),
        "model_loaded":      _model is not None,
        "vectorizer_loaded": _vectorizer is not None,
        "rag_index_loaded":  _rag_index is not None,
    }


@app.post("/api/v1/analyze")
def analyze(req: AnalyzeRequest):
    start  = time.time()
    result = analyze_review(
        req.review_text,
        _model,
        _vectorizer,
        _rag_index,
    )
    result["ranked_concerns"] = rank_concerns(_concern_stats())
    _counter["reviews_analyzed"] += 1
    _counter["total_latency_ms"] += (time.time() - start) * 1000
    return result


@app.get("/api/v1/stats")
def stats():
    concern_stats = _concern_stats()
    return {
        "total_reviews":          concern_stats.get("total_reviews", 0),
        "sentiment_distribution": get_sentiment_distribution(),
        "ranked_concerns":        rank_concerns(concern_stats),
        "representative_reviews": get_representative_reviews(3),
    }