"""Central configuration for the project."""

from pathlib import Path

# src/cfa/core/config.py -> src/cfa -> project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
ARTIFACTS_DIR = PROJECT_ROOT / "models" / "artifacts"

DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

# Dataset settings
RAW_DATA_PATH = DATA_DIR / "reviews.csv"
DATA_SEED = 42
TRAIN_SAMPLE = 40000
ANALYTICS_SAMPLE = 20000

# ML settings
SENTIMENT_MODEL_PATH = MODELS_DIR / "sentiment_model.joblib"
TFIDF_PATH = MODELS_DIR / "tfidf_vectorizer.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"

TEST_SPLIT = 0.2
TFIDF_NGRAM = (1, 2)
TFIDF_MIN_DF = 2
TFIDF_MAX_FEATURES = 50000

# Concern / RAG settings
CONCERN_LEXICON_PATH = (
    PROJECT_ROOT / "src" / "cfa" / "analysis" / "concern_lexicon.json"
)

CONCERN_STATS_PATH = ARTIFACTS_DIR / "concern_stats.json"

# ChromaDB persistent vector database
RAG_DB_PATH = MODELS_DIR / "rag_db"
RAG_DATA_DIR = PROJECT_ROOT / "IMP_FILES" / "data"

# ChromaDB collection name
RAG_COLLECTION_NAME = "reviews"

# RAG returns up to 3 proof reviews per concern
RAG_TOP_K = 5

RAG_USE_SAMPLE = 30000
