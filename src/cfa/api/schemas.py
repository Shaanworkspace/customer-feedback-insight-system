"""FastAPI response schemas."""

from typing import List

from pydantic import BaseModel


class Concern(BaseModel):
    concern: str
    count: int
    negative_pct: float
    impact: int
    priority: int


class RepresentativeReview(BaseModel):
    review_id: str
    text: str
    sentiment: str


class StatsResponse(BaseModel):
    total_reviews: int
    sentiment_distribution: dict
    ranked_concerns: List[Concern]
    representative_reviews: List[RepresentativeReview]


class ReviewItem(BaseModel):
    review_id: str
    text: str
    concern: str
    sentiment: str


class StatusResponse(BaseModel):
    status: str
    done: int
    total: int


class ErrorResponse(BaseModel):
    error: str