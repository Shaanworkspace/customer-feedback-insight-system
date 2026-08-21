"""FastAPI app: /analyze, /upload, /stats, /reviews, /health."""

import time

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from cfa.analysis.concerns import analyze_review
from cfa.analysis.stats import get_countries, get_ratings, get_reviews, get_stats, get_time_trend
from cfa.api.pipeline import process_csv
from cfa.api.schemas import AnalyzeRequest
from cfa.ranking.priority import rank_concerns

app = FastAPI(title="Customer Feedback Insight System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://customer-feedback-insight-system.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

_counter = {"reviews_analyzed": 0, "total_latency_ms": 0.0}


@app.get("/health")
def health():
    avg = _counter["total_latency_ms"] / _counter["reviews_analyzed"] if _counter["reviews_analyzed"] else 0.0
    return {"status": "ok", "reviews_analyzed": _counter["reviews_analyzed"], "avg_latency_ms": round(avg, 2)}


@app.get("/api/v1/ping")
def ping():
    return {"message": "CFA backend is alive"}


@app.post("/api/v1/analyze")
def analyze(req: AnalyzeRequest):
    start = time.time()
    result = analyze_review(req.review_text)
    result["ranked_concerns"] = rank_concerns(
        {
            "concerns": [
                {
                    "name": c["name"],
                    "count": 1,
                    "negative_pct": 100.0 if c["sentiment"] == "negative" else 0.0,
                }
                for c in result["concerns"]
            ]
        }
    )
    _counter["reviews_analyzed"] += 1
    _counter["total_latency_ms"] += (time.time() - start) * 1000
    return result


@app.post("/api/v1/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    _counter["reviews_analyzed"] += content.decode("utf-8").count("\n")
    return process_csv(content)


@app.get("/api/v1/stats")
def stats():
    data = get_stats()
    data["countries"] = get_countries()
    data["time_trend"] = get_time_trend()
    data["ratings"] = get_ratings()
    return data


@app.get("/api/v1/reviews")
def reviews():
    return get_reviews()