"""
Build the ChromaDB RAG index from the project's review datasets.

Usage:
    python -m cfa.scripts.build_rag
"""

import logging
from pathlib import Path

import pandas as pd

from cfa.analysis.rag import build_rag_index
from cfa.core.config import RAG_DATA_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger(__name__)


REVIEW_FILES = [
    "laptop_reviews.csv",
    "speaker_reviews.csv",
    "watch_reviews.csv",
]


def load_rag_records():
    """Load all available product review CSVs."""

    records = []

    for filename in REVIEW_FILES:
        path = RAG_DATA_DIR / filename

        if not path.exists():
            logger.warning("File not found: %s", path)
            continue

        logger.info("Loading %s", path)

        df = pd.read_csv(path)

        required_columns = {
            "review_id",
            "review_text",
            "rating",
            "date",
        }

        missing = required_columns - set(df.columns)

        if missing:
            raise ValueError(
                f"{filename} is missing columns: {sorted(missing)}"
            )

        for _, row in df.iterrows():
            review_id = str(row["review_id"]).strip()
            text = str(row["review_text"]).strip()

            if not review_id or not text:
                continue

            records.append(
                {
                    "review_id": review_id,
                    "text": text,
                    "rating": row["rating"],
                    "date": row["date"],
                }
            )

    if not records:
        raise ValueError("No valid review records found.")

    return records


def main():
    logger.info("Starting RAG index build...")

    records = load_rag_records()

    logger.info(
        "Total reviews loaded for RAG: %d",
        len(records),
    )

    build_rag_index(records)

    logger.info("RAG index built successfully.")


if __name__ == "__main__":
    main()