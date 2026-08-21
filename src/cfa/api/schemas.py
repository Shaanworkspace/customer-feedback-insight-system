"""FastAPI request/response schemas."""

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    review_text: str