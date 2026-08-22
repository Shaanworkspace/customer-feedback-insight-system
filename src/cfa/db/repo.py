"""Repository layer: users + per-user analyses (history).

Each user keeps at most HISTORY_KEEP analyses; older ones are pruned
so "previous history" is the last 3 uploads per user.
"""

from __future__ import annotations

from sqlalchemy import delete, desc, select
from sqlalchemy.exc import IntegrityError

from cfa.db.core import SessionLocal
from cfa.db.models import Analysis, User

HISTORY_KEEP = 3


def create_user(username: str, salt: str, hash_hex: str) -> int | None:
    try:
        with SessionLocal() as s:
            u = User(username=username, salt=salt, hash=hash_hex)
            s.add(u)
            s.commit()
            s.refresh(u)
            return u.id
    except IntegrityError:
        return None


def get_user_by_username(username: str) -> User | None:
    with SessionLocal() as s:
        return s.scalars(select(User).where(User.username == username)).first()


def save_analysis(user_id: int, filename: str | None, data: dict) -> int:
    with SessionLocal() as s:
        a = Analysis(user_id=user_id, filename=filename, data=data)
        s.add(a)
        s.commit()
        s.refresh(a)
        keep_ids = s.scalars(
            select(Analysis.id)
            .where(Analysis.user_id == user_id)
            .order_by(desc(Analysis.created_at))
            .limit(HISTORY_KEEP)
        ).all()
        if keep_ids:
            s.execute(
                delete(Analysis)
                .where(Analysis.user_id == user_id)
                .where(Analysis.id.not_in(keep_ids))
            )
            s.commit()
        return a.id


def get_latest_analysis(user_id: int) -> dict | None:
    with SessionLocal() as s:
        a = s.scalars(
            select(Analysis)
            .where(Analysis.user_id == user_id)
            .order_by(desc(Analysis.created_at))
            .limit(1)
        ).first()
        return a.data if a else None


def list_history(user_id: int, limit: int = HISTORY_KEEP) -> list[dict]:
    with SessionLocal() as s:
        rows = s.scalars(
            select(Analysis)
            .where(Analysis.user_id == user_id)
            .order_by(desc(Analysis.created_at))
            .limit(limit)
        ).all()
    out = []
    for a in rows:
        d = a.data or {}
        top = (d.get("ranked_concerns") or [])[:3]
        out.append(
            {
                "id": a.id,
                "filename": a.filename,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "total_reviews": d.get("total_reviews"),
                "top_concerns": [c.get("concern") for c in top],
            }
        )
    return out


def get_analysis_by_id(user_id: int, analysis_id: int) -> dict | None:
    with SessionLocal() as s:
        a = s.scalars(
            select(Analysis)
            .where(Analysis.user_id == user_id, Analysis.id == analysis_id)
        ).first()
        return a.data if a else None

