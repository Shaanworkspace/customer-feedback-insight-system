"""FastAPI app: upload, analyze, stats, reviews, status."""

import io
import json
import logging
from typing import List

import pandas as pd
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from cfa.api.config import ALLOWED_ORIGINS, CONCERN_STATS_PATH, REVIEWS_PATH
from cfa.api.pipeline import STATUS, analyze_review, clean_reviews, run_pipeline
from cfa.api.schemas import AnalyzeRequest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("cfa.api")

app = FastAPI(title="Customer Feedback Insight System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CFA API starting. Allowed origins: %s", ALLOWED_ORIGINS)

_DEFAULT_STATS = {
    "total_reviews": 0,
    "sentiment_distribution": {"positive": 0, "negative": 0},
    "ranked_concerns": [],
    "representative_reviews": [],
}


@app.get("/health")
def health():
    logger.info("GET /health -> ok")
    return {"status": "ok"}


@app.get("/api/v1/ping")
def ping():
    logger.info("GET /api/v1/ping -> alive")
    return {"message": "CFA backend is alive"}


@app.post("/api/v1/upload")
def upload(file: UploadFile = File(...)):
    raw = file.file.read()
    if not raw.strip():
        logger.warning("POST /api/v1/upload rejected: empty file body (%s).", file.filename)
        return JSONResponse(status_code=400, content={"error": "File is empty. Upload again."})

    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        logger.warning("POST /api/v1/upload CSV parse failed (%s): %s", file.filename, exc)
        return JSONResponse(status_code=400, content={"error": "File is empty. Upload again."})

    if df.empty:
        logger.warning("POST /api/v1/upload rejected: CSV has no rows (%s).", file.filename)
        return JSONResponse(status_code=400, content={"error": "File is empty. Upload again."})

    logger.info("POST /api/v1/upload received %s: %d rows from CSV.", file.filename, len(df))

    reviews = clean_reviews(df)
    if not reviews:
        logger.warning("POST /api/v1/upload rejected: no valid reviews after cleaning (%s).", file.filename)
        return JSONResponse(status_code=400, content={"error": "No valid reviews found."})

    logger.info("POST /api/v1/upload cleaning passed: %d reviews ready for pipeline.", len(reviews))
    result = run_pipeline(reviews)
    logger.info("POST /api/v1/upload finished: total_reviews=%s", result.get("total_reviews"))
    return result


@app.post("/api/v1/analyze")
def analyze(payload: AnalyzeRequest):
    text = payload.review_text.strip()
    if not text:
        logger.warning("POST /api/v1/analyze rejected: empty review_text.")
        return JSONResponse(status_code=400, content={"error": "review_text is empty."})
    logger.info("POST /api/v1/analyze received text (%d chars).", len(text))
    result = analyze_review(text)
    logger.info("POST /api/v1/analyze done: sentiment=%s concerns=%d",
                result.get("overall_sentiment"), len(result.get("concerns", [])))
    return result


@app.get("/api/v1/stats")
def stats():
    if CONCERN_STATS_PATH.exists():
        data = json.loads(CONCERN_STATS_PATH.read_text())
        logger.info("GET /api/v1/stats served from file: total_reviews=%s", data.get("total_reviews"))
        return data
    logger.warning("GET /api/v1/stats: %s missing, serving defaults.", CONCERN_STATS_PATH)
    return _DEFAULT_STATS


@app.get("/api/v1/reviews")
def reviews() -> List[dict]:
    if not REVIEWS_PATH.exists():
        logger.warning("GET /api/v1/reviews: %s missing, serving empty list.", REVIEWS_PATH)
        return []
    rows = json.loads(REVIEWS_PATH.read_text())
    logger.info("GET /api/v1/reviews served: %d rows.", len(rows))
    return [
        {"review_id": r["review_id"], "text": r["text"], "concern": r["entity"], "sentiment": r["sentiment"]}
        for r in rows
    ]


@app.get("/api/v1/status")
def status():
    logger.info("GET /api/v1/status -> %s", STATUS.get("status"))
    return STATUS