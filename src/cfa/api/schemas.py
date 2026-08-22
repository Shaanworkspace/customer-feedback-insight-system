"""FastAPI request/response schemas."""

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    review_text: str


class AuthRequest(BaseModel):
    username: str
    password: str
    first_name: str = ""
    email: str = ""


class EmailReportRequest(BaseModel):
    email: str
    analysis_id: int | None = None