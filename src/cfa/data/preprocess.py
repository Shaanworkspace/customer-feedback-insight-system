"""Preprocess Amazon reviews for sentiment classification."""

from __future__ import annotations

import re
import string
from pathlib import Path

import pandas as pd
from nltk.corpus import stopwords

from cfa.core.config import RAW_DATA_PATH, DATA_DIR


# English stopwords
STOP_WORDS = set(stopwords.words("english"))


def clean_text(text: str) -> str:
    """
    Clean a review for sentiment model training.

    Steps:
    1. Convert to lowercase
    2. Remove HTML tags
    3. Remove URLs
    4. Remove punctuation
    5. Remove stopwords
    6. Normalize extra whitespace
    """
    if not isinstance(text, str):
        return ""

    # Lowercase
    text = text.lower()

    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)

    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # Remove punctuation
    text = text.translate(str.maketrans("", "", string.punctuation))

    # Keep only words
    words = text.split()

    # Remove stopwords
    words = [word for word in words if word not in STOP_WORDS]

    # Normalize whitespace
    return " ".join(words)


def load_reviews(path: Path = RAW_DATA_PATH) -> pd.DataFrame:
    """Load the raw reviews CSV."""
    df = pd.read_csv(path)

    required_columns = {"review_id", "label", "full_text"}

    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    return df[["review_id", "label", "full_text"]].copy()


def preprocess_reviews(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """Clean review text and prepare the final dataset."""

    df = df.copy()

    # Remove rows with missing review text
    df = df.dropna(subset=["full_text"])

    # Clean text
    df["full_text"] = df["full_text"].apply(clean_text)

    # Remove reviews that became empty after cleaning
    df = df[df["full_text"].str.strip() != ""]

    # Ensure labels are integers
    df["label"] = df["label"].astype(int)

    # Keep only the required columns
    df = df[["review_id", "label", "full_text"]]

    return df.reset_index(drop=True)


def save_clean_reviews(
    df: pd.DataFrame,
    path: Path | None = None,
) -> None:
    """Save the cleaned reviews dataset."""

    if path is None:
        path = DATA_DIR / "reviews_clean.csv"

    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)

    print(f"Saved {len(df)} cleaned reviews -> {path}")


def main() -> None:
    """Run the complete preprocessing pipeline."""

    print(f"Loading reviews from: {RAW_DATA_PATH}")

    df = load_reviews()

    print(f"Raw dataset shape: {df.shape}")
    print(
        f"Raw labels: positive={(df['label'] == 1).sum()}, "
        f"negative={(df['label'] == 0).sum()}"
    )

    clean_df = preprocess_reviews(df)

    print(f"Clean dataset shape: {clean_df.shape}")
    print(
        f"Clean labels: positive={(clean_df['label'] == 1).sum()}, "
        f"negative={(clean_df['label'] == 0).sum()}"
    )

    save_clean_reviews(clean_df)


if __name__ == "__main__":
    main()