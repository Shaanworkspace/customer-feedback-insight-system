"""Backend-specific settings: Groq LLM, batching, storage paths."""

import logging
import os

from cfa.core.config import DATA_DIR

logger = logging.getLogger(__name__)

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

logger.info(
    "API config: groq_api_key=%s, model=%s, batch_max=%d, support_threshold=%d, data_dir=%s",
    "set" if GROQ_API_KEY else "MISSING", GROQ_MODEL, BATCH_MAX, SUPPORT_THRESHOLD, DATA_DIR,
)