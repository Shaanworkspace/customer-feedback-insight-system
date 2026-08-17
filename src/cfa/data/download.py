"""Download and sample the Amazon reviews dataset."""

from __future__ import annotations

import pandas as pd
from datasets import load_dataset

from cfa.core.config import RAW_DATA_PATH, DATA_SEED

DATASET_NAME = "fancyzhx/amazon_polarity"
SPLIT = "train"
N_ROWS = 60000


def load_reviews(n_rows: int = N_ROWS, seed: int = DATA_SEED) -> pd.DataFrame:
    ds = load_dataset(DATASET_NAME, split=SPLIT, streaming=True)
    rows = []
    for i, ex in enumerate(ds):
        if i >= n_rows:
            break
        rows.append(
            {
                "review_id": ex.get("review_id", i),
                "label": int(ex["label"]),
                "title": ex.get("title", ""),
                "text": ex.get("content", ex.get("text", "")),
            }
        )
    df = pd.DataFrame(rows)
    df["review_id"] = df["review_id"].astype(str)
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
