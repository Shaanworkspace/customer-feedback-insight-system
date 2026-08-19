"""
src/cfa/scripts/build_artifacts.py
------------------------------------
One-time build script. Run this before starting the API.

Usage:
    python -m cfa.scripts.build_artifacts

What it does:
    1. Loads data/reviews.csv using config paths
    2. Trains sentiment model + TF-IDF vectorizer
    3. Saves models/sentiment_model.joblib
    4. Saves models/tfidf_vectorizer.joblib
    5. Builds RAG index → models/artifacts/rag_vectors.joblib
    6. Saves RAG records → models/artifacts/rag_analytics.joblib
    7. Computes real concern stats → models/artifacts/concern_stats.json
    8. Prints real evaluation metrics and priority ranking
"""

import json
import logging
import sys

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

from cfa.core.config import (
    RAW_DATA_PATH,
    MODELS_DIR,
    ARTIFACTS_DIR,
    SENTIMENT_MODEL_PATH,
    TFIDF_PATH,
    CONCERN_STATS_PATH,
    TFIDF_NGRAM,
    TFIDF_MIN_DF,
    TFIDF_MAX_FEATURES,
    TEST_SPLIT,
    DATA_SEED,
    RAG_USE_SAMPLE,
)
from cfa.analysis.concern import detect_concerns
from cfa.analysis.rag import build_rag_index, save_rag_index
from cfa.ranking.priority import calculate_priority, aggregate_concern_stats

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

import re

RATING_RE = re.compile(r"Rated\s+(\d+)\s+out\s+of\s+5", re.IGNORECASE)

SENTIMENT_MAP = {1: "negative", 2: "negative", 3: "neutral",
                 4: "positive",  5: "positive"}


def parse_rating(raw: str):
    if not isinstance(raw, str):
        return None
    m = RATING_RE.search(raw)
    if m:
        r = int(m.group(1))
        return r if 1 <= r <= 5 else None
    return None


def main():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. Load CSV
    # ------------------------------------------------------------------
    logger.info("Loading %s …", RAW_DATA_PATH)
    df = pd.read_csv(RAW_DATA_PATH, dtype=str)
    logger.info("Raw rows: %d", len(df))

    # ------------------------------------------------------------------
    # 2. Clean
    # ------------------------------------------------------------------
    df = df.dropna(subset=["Review Text", "Rating"])
    df["rating"]    = df["Rating"].apply(parse_rating)
    df              = df.dropna(subset=["rating"])
    df["rating"]    = df["rating"].astype(int)
    df["sentiment"] = df["rating"].map(SENTIMENT_MAP)

    df["title"] = df["Review Title"].fillna("").astype(str)
    df["text"]  = (
        df["title"].str.strip() + ". " + df["Review Text"].str.strip()
    ).str.strip(". ")

    df = df[df["text"].str.len() >= 10].reset_index(drop=True)
    logger.info("Clean rows: %d", len(df))

    # Sentiment distribution (real numbers)
    pos = (df["sentiment"] == "positive").sum()
    neg = (df["sentiment"] == "negative").sum()
    neu = (df["sentiment"] == "neutral").sum()
    print(f"\n{'='*60}")
    print("DATASET  (real numbers from your CSV)")
    print(f"{'='*60}")
    print(f"  Total    : {len(df)}")
    print(f"  Positive : {pos}  ({pos/len(df)*100:.1f}%)")
    print(f"  Negative : {neg}  ({neg/len(df)*100:.1f}%)")
    print(f"  Neutral  : {neu}  ({neu/len(df)*100:.1f}%)")

    # Rating distribution
    print("\n  Rating distribution:")
    for star, count in df["rating"].value_counts().sort_index().items():
        print(f"    {star}★ : {count}")

    # ------------------------------------------------------------------
    # 3. Train sentiment model
    # ------------------------------------------------------------------
    logger.info("Training sentiment model …")

    X = df["text"].tolist()
    y = df["sentiment"].tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SPLIT,
        random_state=DATA_SEED,
        stratify=y,
    )

    vectorizer = TfidfVectorizer(
        ngram_range=TFIDF_NGRAM,
        min_df=TFIDF_MIN_DF,
        max_features=TFIDF_MAX_FEATURES,
        sublinear_tf=True,
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec  = vectorizer.transform(X_test)

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=DATA_SEED,
        C=1.0,
    )
    model.fit(X_train_vec, y_train)

    # Real evaluation metrics
    y_pred = model.predict(X_test_vec)
    print(f"\n{'='*60}")
    print("SENTIMENT MODEL EVALUATION  (real metrics)")
    print(f"{'='*60}")
    print(classification_report(y_test, y_pred))

    # Save model + vectorizer
    joblib.dump(model,      SENTIMENT_MODEL_PATH)
    joblib.dump(vectorizer, TFIDF_PATH)
    logger.info("Model saved → %s", SENTIMENT_MODEL_PATH)
    logger.info("Vectorizer saved → %s", TFIDF_PATH)

    # ------------------------------------------------------------------
    # 4. Build RAG index
    # ------------------------------------------------------------------
    logger.info("Building RAG index (sample=%d) …", RAG_USE_SAMPLE)

    rag_df = df.sample(
        n=min(RAG_USE_SAMPLE, len(df)),
        random_state=DATA_SEED,
    ).reset_index(drop=True)

    records = []
    for i, row in rag_df.iterrows():
        text      = row["text"]
        sentiment = row["sentiment"]
        concerns  = []
        try:
            concerns = detect_concerns(text)
        except Exception:
            pass

        records.append({
            "text":      text,
            "sentiment": sentiment,
            "rating":    int(row["rating"]),
            "concerns":  concerns,
        })

        if (i + 1) % 2000 == 0:
            logger.info("  Enriched %d / %d records …", i + 1, len(rag_df))

    index = build_rag_index(records, vectorizer)
    save_rag_index(index)
    logger.info("RAG index saved.")

    # ------------------------------------------------------------------
    # 5. Concern stats + priority ranking (real numbers)
    # ------------------------------------------------------------------
    logger.info("Computing concern stats …")
    concern_stats = aggregate_concern_stats(records)

    with open(CONCERN_STATS_PATH, "w") as f:
        json.dump(concern_stats, f, indent=2)
    logger.info("Concern stats saved → %s", CONCERN_STATS_PATH)

    ranking = calculate_priority(concern_stats)

    print(f"\n{'='*60}")
    print("CONCERN PRIORITY RANKING  (real numbers from your data)")
    print(f"{'='*60}")
    print(f"  {'Rank':<5} {'Concern':<18} {'Mentions':<10} "
          f"{'Neg%':<8} {'Score':<8}")
    print("  " + "-" * 52)
    for row in ranking:
        print(
            f"  {row['priority']:<5} "
            f"{row['concern']:<18} "
            f"{row['mentions']:<10} "
            f"{row['negative_ratio']*100:>5.1f}%   "
            f"{row['impact_score']:>6.1f}"
        )

    print(f"\n{'='*60}")
    print("All artifacts saved to:")
    print(f"  {SENTIMENT_MODEL_PATH}")
    print(f"  {TFIDF_PATH}")
    print(f"  {RAG_INDEX_PATH}")
    print(f"  {RAG_ANALYTICS_PATH}")
    print(f"  {CONCERN_STATS_PATH}")
    print(f"\nNext: uvicorn cfa.api.main:app --reload")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()