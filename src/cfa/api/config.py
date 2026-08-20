"""Backend-specific settings: Groq LLM, batching, storage paths."""

import os

from cfa.core.config import DATA_DIR

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

_default_origins = "http://localhost:5173,https://customer-feedback-insight-system.vercel.app"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

BATCH_MAX = 30
MIN_REVIEW_CHARS = 10
SUPPORT_THRESHOLD = 3

REGISTRY_PATH = DATA_DIR / "concern_registry.json"
REVIEWS_PATH = DATA_DIR / "reviews.json"
CONCERN_STATS_PATH = DATA_DIR / "concern_stats.json"