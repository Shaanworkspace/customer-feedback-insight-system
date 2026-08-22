"""FastAPI request/response schemas."""

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    review_text: str


class AuthRequest(BaseModel):
    username: str
    password: str