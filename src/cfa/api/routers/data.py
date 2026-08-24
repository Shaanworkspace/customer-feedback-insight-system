from fastapi import APIRouter, Depends, HTTPException

from cfa.api.deps import get_current_user
from cfa.analysis.stats import get_concern_comments, get_reviews, get_stats
from cfa.db.repo import get_analysis_by_id, list_history

router = APIRouter(tags=["data"])


@router.get("/api/v1/stats")
def stats(user=Depends(get_current_user)):
    return get_stats(user.id)


@router.get("/api/v1/reviews")
def reviews(user=Depends(get_current_user)):
    return get_reviews(user.id)


@router.get("/api/v1/history")
def history(user=Depends(get_current_user)):
    return list_history(user.id)


@router.get("/api/v1/history/{analysis_id}")
def history_report(analysis_id: int, user=Depends(get_current_user)):
    data = get_analysis_by_id(user.id, analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return data


@router.get("/api/v1/concern-comments")
def concern_comments(concern: str = "", user=Depends(get_current_user)):
    return get_concern_comments(concern, user.id)
