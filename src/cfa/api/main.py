"""FastAPI app: auth, analyze, upload, stats, reviews, history, health."""

import time

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from cfa.analysis.concerns import analyze_review
from cfa.analysis.rag import find_similar
from cfa.analysis.stats import get_concern_comments, get_reviews, get_stats
from cfa.api.auth import add_user, authenticate, create_token, decode_token
from cfa.api.pipeline import process_csv
from cfa.api.ratelimit import RateLimiter
from cfa.api.schemas import AnalyzeRequest, AuthRequest, EmailReportRequest
from cfa.db import init_db
from cfa.db.repo import (
    get_analysis_by_id,
    get_latest_analysis,
    get_user_by_username,
    list_history,
    save_analysis,
)
from cfa.notify.email import build_report_html, send_email
from cfa.ranking.priority import rank_concerns

init_db()

app = FastAPI(title="Customer Feedback Insight System")

limiter = RateLimiter(max_requests=60, window_seconds=60)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in ("/health", "/api/v1/ping"):
        return await call_next(request)
    client = request.client.host if request.client else "unknown"
    if not limiter.is_allowed(client):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down and try again later."},
        )
    return await call_next(request)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )

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
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


@app.get("/health")
def health():
    avg = _counter["total_latency_ms"] / _counter["reviews_analyzed"] if _counter["reviews_analyzed"] else 0.0
    return {"status": "ok", "reviews_analyzed": _counter["reviews_analyzed"], "avg_latency_ms": round(avg, 2)}


@app.get("/api/v1/ping")
def ping():
    return {"message": "CFA backend is alive"}


@app.post("/api/v1/auth/signup")
def signup(req: AuthRequest):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if not add_user(req.email, req.password, req.first_name, req.email):
        raise HTTPException(status_code=400, detail="Email already registered or invalid")
    return {
        "message": "Account created",
        "token": create_token(req.email),
        "first_name": req.first_name,
        "email": req.email,
    }


@app.post("/api/v1/auth/login")
def login(req: AuthRequest):
    if not authenticate(req.username, req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = get_user_by_username(req.username)
    return {
        "token": create_token(req.username),
        "first_name": user.first_name or "",
        "email": user.email or req.username,
    }


@app.get("/api/v1/auth/me")
def me(user=Depends(get_current_user)):
    return {
        "username": user.username,
        "id": user.id,
        "first_name": user.first_name or "",
        "email": user.email or user.username,
    }


@app.post("/api/v1/analyze")
def analyze(req: AnalyzeRequest, user=Depends(get_current_user)):
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
    analysis = get_latest_analysis(user.id)
    reviews = (analysis or {}).get("reviews", [])
    if reviews:
        result["similar_reviews"] = find_similar(req.review_text, reviews=reviews, top_k=5)
    _counter["reviews_analyzed"] += 1
    _counter["total_latency_ms"] += (time.time() - start) * 1000
    return result


@app.post("/api/v1/upload")
async def upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        content = await file.read()
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be a UTF-8 CSV.")
    _counter["reviews_analyzed"] += text.count("\n")
    try:
        stats = process_csv(content)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not process the CSV. Make sure it has a 'review_text' column.",
        )
    save_analysis(user.id, file.filename, stats)
    return stats


@app.get("/api/v1/stats")
def stats(user=Depends(get_current_user)):
    return get_stats(user.id)


@app.get("/api/v1/reviews")
def reviews(user=Depends(get_current_user)):
    return get_reviews(user.id)


@app.get("/api/v1/history")
def history(user=Depends(get_current_user)):
    return list_history(user.id)


@app.get("/api/v1/history/{analysis_id}")
def history_report(analysis_id: int, user=Depends(get_current_user)):
    data = get_analysis_by_id(user.id, analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return data


@app.post("/api/v1/report/email")
def report_email(req: EmailReportRequest, user=Depends(get_current_user)):
    data = (
        get_analysis_by_id(user.id, req.analysis_id)
        if req.analysis_id
        else get_latest_analysis(user.id)
    )
    if not data:
        raise HTTPException(status_code=404, detail="No analysis found for this user")
    html = build_report_html(data)
    try:
        send_email(req.email, "Your Customer Feedback Insight Report", html)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not send email: {e}")
    return {"sent": True, "email": req.email}


@app.get("/api/v1/concern-comments")
def concern_comments(concern: str = "", user=Depends(get_current_user)):
    return get_concern_comments(concern, user.id)
