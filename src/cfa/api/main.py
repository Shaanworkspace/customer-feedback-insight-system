"""FastAPI app: auth, analyze, upload, stats, reviews, health."""

import time

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from cfa.analysis.concerns import analyze_review
from cfa.analysis.stats import get_countries, get_ratings, get_reviews, get_stats, get_time_trend
from cfa.api.auth import add_user, authenticate, create_token, decode_token
from cfa.api.pipeline import process_csv
from cfa.api.schemas import AnalyzeRequest, AuthRequest
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


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    username = decode_token(authorization.split(" ", 1)[1])
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return username


@app.get("/health")
def health():
    avg = _counter["total_latency_ms"] / _counter["reviews_analyzed"] if _counter["reviews_analyzed"] else 0.0
    return {"status": "ok", "reviews_analyzed": _counter["reviews_analyzed"], "avg_latency_ms": round(avg, 2)}


@app.get("/api/v1/ping")
def ping():
    return {"message": "CFA backend is alive"}


@app.post("/api/v1/auth/signup")
def signup(req: AuthRequest):
    if not add_user(req.username, req.password):
        raise HTTPException(status_code=400, detail="Username taken or invalid")
    return {"message": "Account created", "token": create_token(req.username)}


@app.post("/api/v1/auth/login")
def login(req: AuthRequest):
    if not authenticate(req.username, req.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": create_token(req.username)}


@app.get("/api/v1/auth/me")
def me(user: str = Depends(get_current_user)):
    return {"username": user}


@app.post("/api/v1/analyze")
def analyze(req: AnalyzeRequest, user: str = Depends(get_current_user)):
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
async def upload(file: UploadFile = File(...), user: str = Depends(get_current_user)):
    content = await file.read()
    _counter["reviews_analyzed"] += content.decode("utf-8").count("\n")
    return process_csv(content)


@app.get("/api/v1/stats")
def stats(user: str = Depends(get_current_user)):
    data = get_stats()
    data["countries"] = get_countries()
    data["time_trend"] = get_time_trend()
    data["ratings"] = get_ratings()
    return data


@app.get("/api/v1/reviews")
def reviews(user: str = Depends(get_current_user)):
    return get_reviews()


@app.get("/api/v1/concern-comments")
def concern_comments(concern: str = "", user: str = Depends(get_current_user)):
    data = get_stats()
    return data.get("comments_by_concern", {}).get(concern, [])
