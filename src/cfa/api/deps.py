from fastapi import Header, HTTPException

from cfa.api.auth import decode_token
from cfa.db.repo import get_user_by_username

metrics = {"reviews_analyzed": 0, "total_latency_ms": 0.0}


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
