"""Download and sample the Amazon Reviews dataset.

Uses the HuggingFace `amazon_polarity` dataset, which is built from real
Amazon customer reviews (the McAuley 2013 Amazon review corpus). Each review
has a star-derived label (1 = positive, 0 = negative) plus free text.

We stream only the rows we need so the download stays small and fast.
"""

from __future__ import annotations

import pandas as pd
from datasets import load_dataset

from app.core.config import RAW_DATA_PATH, DATA_SEED

DATASET_NAME = "fancyzhx/amazon_polarity"
SPLIT = "train"
N_ROWS = 60000  # enough for training sample + analytics sample


def load_reviews(n_rows: int = N_ROWS, seed: int = DATA_SEED) -> pd.DataFrame:
    """Stream `n_rows` Amazon reviews and return a tidy DataFrame.

    Label semantics in amazon_polarity: 1 = positive (4-5 star), 0 = negative.
    """
    ds = load_dataset(DATASET_NAME, split=SPLIT, streaming=True)
    rows = []
    for i, ex in enumerate(ds):
        if i >= n_rows:
            break
        rows.append(
            {
                "review_id": ex.get("review_id", i),
                "label": int(ex["label"]),          # 1 positive / 0 negative
                "title": ex.get("title", ""),
                "text": ex.get("content", ex.get("text", "")),
            }
        )
    df = pd.DataFrame(rows)
    df["review_id"] = df["review_id"].astype(str)
    # amazon_polarity content already includes the title; keep it simple.
    df["full_text"] = (df["title"].fillna("") + " " + df["text"].fillna("")).str.strip()
    df = df[["review_id", "label", "full_text"]]
    return df.sample(frac=1, random_state=seed).reset_index(drop=True)


def save_reviews(df: pd.DataFrame, path=RAW_DATA_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    print(f"Saved {len(df)} reviews -> {path}")


if __name__ == "__main__":
    print("Downloading Amazon reviews (streaming)...")
    df = load_reviews()
    print(f"Downloaded {len(df)} reviews | positive={int((df['label'] == 1).sum())} "
          f"negative={int((df['label'] == 0).sum())}")
    save_reviews(df)
