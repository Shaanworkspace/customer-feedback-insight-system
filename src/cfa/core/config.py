"""Central configuration for the Customer Feedback Insight System.

Keeps paths and settings in one place so the rest of the code stays clean.
"""

from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# src/cfa/core/config.py -> src/cfa -> project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"                                # data/
MODELS_DIR = PROJECT_ROOT / "models"                            # saved pipelines + artifacts
ARTIFACTS_DIR = PROJECT_ROOT / "models" / "artifacts"           # metrics, concern stats, index

DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Dataset settings
# ---------------------------------------------------------------------------
# Raw sampled dataset written after the download script runs.
RAW_DATA_PATH = DATA_DIR / "reviews.csv"
# Optional seed for reproducible sampling.
DATA_SEED = 42
# Sample sizes (balanced by sentiment) used to keep training fast on a laptop.
TRAIN_SAMPLE = 40000      # total reviews sampled for training + evaluation
ANALYTICS_SAMPLE = 20000  # extra reviews used only for aggregate dashboard stats

# ---------------------------------------------------------------------------
# ML settings
# ---------------------------------------------------------------------------
SENTIMENT_MODEL_PATH = MODELS_DIR / "sentiment_model.joblib"
TFIDF_PATH = MODELS_DIR / "tfidf_vectorizer.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"

TEST_SPLIT = 0.2          # held-out fraction for evaluation
TFIDF_NGRAM = (1, 2)      # unigrams + bigrams give more signal than unigrams alone
TFIDF_MIN_DF = 2
TFIDF_MAX_FEATURES = 50000

# ---------------------------------------------------------------------------
# Concern / RAG settings
# ---------------------------------------------------------------------------
CONCERN_LEXICON_PATH = PROJECT_ROOT / "src" / "cfa" / "analysis" / "concern_lexicon.json"
CONCERN_STATS_PATH = ARTIFACTS_DIR / "concern_stats.json"
RAG_INDEX_PATH = ARTIFACTS_DIR / "rag_vectors.joblib"   # (matrix, ids) tuple
RAG_ANALYTICS_PATH = ARTIFACTS_DIR / "rag_analytics.joblib"
RAG_TOP_K = 5                 # how many similar reviews to retrieve
RAG_USE_SAMPLE = 30000        # how many historical reviews go into the RAG index