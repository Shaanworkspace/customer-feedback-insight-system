"""FastAPI app: auth, analyze, upload, stats, reviews, history, health."""

import time

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from cfa.analysis.concerns import analyze_review
from cfa.analysis.rag import find_similar
from cfa.analysis.stats import get_concern_comments, get_reviews, get_stats
from cfa.api.auth import add_user, authenticate, create_token, decode_token
from cfa.api.pipeline import process_csv
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
    if not add_user(req.username, req.password):
        raise HTTPException(status_code=400, detail="Username taken or invalid")
    return {"message": "Account created", "token": create_token(req.username)}


@app.post("/api/v1/auth/login")
def login(req: AuthRequest):
    if not authenticate(req.username, req.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": create_token(req.username)}


@app.get("/api/v1/auth/me")
def me(user=Depends(get_current_user)):
    return {"username": user.username, "id": user.id}


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
    content = await file.read()
    _counter["reviews_analyzed"] += content.decode("utf-8").count("\n")
    stats = process_csv(content)
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
