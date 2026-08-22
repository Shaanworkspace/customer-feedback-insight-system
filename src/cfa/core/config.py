"""Central configuration for the project."""

import os
from pathlib import Path

# src/cfa/core/config.py -> src/cfa -> project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = Path(os.environ.get("DATA_DIR", PROJECT_ROOT / "data"))

DATA_DIR.mkdir(parents=True, exist_ok=True)

# Concern / RAG settings
CONCERN_LEXICON_PATH = PROJECT_ROOT / "src" / "cfa" / "analysis" / "concern_lexicon.json"
REVIEWS_PATH = DATA_DIR / "reviews.json"

# Model settings
MODEL_PATH = PROJECT_ROOT / "models" / "sentiment_model.joblib"
VECTORIZER_PATH = PROJECT_ROOT / "models" / "sentiment_vectorizer.joblib"

# Email (SMTP) settings — free SMTP works (e.g. Gmail app password)
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
MAIL_FROM = os.environ.get("MAIL_FROM", SMTP_USER)
