import time

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from cfa.analysis.concerns import analyze_review
from cfa.analysis.rag import find_similar
from cfa.api.deps import get_current_user, metrics
from cfa.api.pipeline import process_csv
from cfa.api.schemas import AnalyzeRequest, EmailReportRequest
from cfa.db.repo import get_analysis_by_id, get_latest_analysis, save_analysis
from cfa.notify.email import build_report_html, send_email
from cfa.ranking.priority import rank_concerns
from cfa.reporting.store import ReportStore

router = APIRouter(tags=["analyze"])

_store = ReportStore()


@router.post("/api/v1/analyze")
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
    metrics["reviews_analyzed"] += 1
    metrics["total_latency_ms"] += (time.time() - start) * 1000
    return result


@router.post("/api/v1/upload")
async def upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        content = await file.read()
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be a UTF-8 CSV.")
    metrics["reviews_analyzed"] += text.count("\n")
    try:
        stats = process_csv(content)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not process the CSV. Make sure it has a 'review_text' column.",
        )
    save_analysis(user.id, file.filename, stats)
    _store.save_json(user.id, file.filename or "upload", stats)
    return stats


@router.post("/api/v1/report/email")
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
