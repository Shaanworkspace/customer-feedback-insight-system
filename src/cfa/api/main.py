"""FastAPI app: upload, analyze, stats, reviews, status."""

import io
import json
from typing import List

import pandas as pd
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from cfa.api.config import ALLOWED_ORIGINS, CONCERN_STATS_PATH, REVIEWS_PATH
from cfa.api.pipeline import STATUS, analyze_review, clean_reviews, run_pipeline
from cfa.api.schemas import AnalyzeRequest

app = FastAPI(title="Customer Feedback Insight System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

_DEFAULT_STATS = {
    "total_reviews": 0,
    "sentiment_distribution": {"positive": 0, "negative": 0},
    "ranked_concerns": [],
    "representative_reviews": [],
}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/v1/upload")
def upload(file: UploadFile = File(...)):
    raw = file.file.read()
    if not raw.strip():
        return JSONResponse(status_code=400, content={"error": "File is empty. Upload again."})

    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception:
        return JSONResponse(status_code=400, content={"error": "File is empty. Upload again."})

    if df.empty:
        return JSONResponse(status_code=400, content={"error": "File is empty. Upload again."})

    reviews = clean_reviews(df)
    if not reviews:
        return JSONResponse(status_code=400, content={"error": "No valid reviews found."})

    return run_pipeline(reviews)


@app.post("/api/v1/analyze")
def analyze(payload: AnalyzeRequest):
    text = payload.review_text.strip()
    if not text:
        return JSONResponse(status_code=400, content={"error": "review_text is empty."})
    return analyze_review(text)


@app.get("/api/v1/stats")
def stats():
    if CONCERN_STATS_PATH.exists():
        return json.loads(CONCERN_STATS_PATH.read_text())
    return _DEFAULT_STATS


@app.get("/api/v1/reviews")
def reviews() -> List[dict]:
    if not REVIEWS_PATH.exists():
        return []
    rows = json.loads(REVIEWS_PATH.read_text())
    return [
        {"review_id": r["review_id"], "text": r["text"], "concern": r["entity"], "sentiment": r["sentiment"]}
        for r in rows
    ]


@app.get("/api/v1/status")
def status():
    return STATUS