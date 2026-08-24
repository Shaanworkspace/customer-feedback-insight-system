from fastapi import APIRouter, Depends, HTTPException

from cfa.api.auth import add_user, authenticate, create_token
from cfa.api.deps import get_current_user
from cfa.api.schemas import AuthRequest
from cfa.db.repo import get_user_by_username

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/signup")
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


@router.post("/login")
def login(req: AuthRequest):
    if not authenticate(req.username, req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = get_user_by_username(req.username)
    return {
        "token": create_token(req.username),
        "first_name": user.first_name or "",
        "email": user.email or req.username,
    }


@router.get("/me")
def me(user=Depends(get_current_user)):
    return {
        "username": user.username,
        "id": user.id,
        "first_name": user.first_name or "",
        "email": user.email or user.username,
    }
