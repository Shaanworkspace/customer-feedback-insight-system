"""Train and evaluate sentiment classification models."""

from __future__ import annotations

import json

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC

from cfa.core.config import (
    DATA_DIR,
    DATA_SEED,
    METRICS_PATH,
    SENTIMENT_MODEL_PATH,
    TEST_SPLIT,
    TFIDF_MAX_FEATURES,
    TFIDF_MIN_DF,
    TFIDF_NGRAM,
    TFIDF_PATH,
    TRAIN_SAMPLE,
)


CLEAN_DATA_PATH = DATA_DIR / "reviews_clean.csv"


def load_clean_data() -> pd.DataFrame:
    """Load the cleaned review dataset."""

    df = pd.read_csv(CLEAN_DATA_PATH)

    required_columns = {"review_id", "label", "full_text"}

    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    df = df.dropna(subset=["full_text", "label"])

    df["label"] = df["label"].astype(int)

    return df


def prepare_training_data(df: pd.DataFrame) -> pd.DataFrame:
    """Create a stratified training sample using the configured sample size."""

    if len(df) <= TRAIN_SAMPLE:
        return df.reset_index(drop=True)

    # Split the requested sample size proportionally by class.
    positive = df[df["label"] == 1]
    negative = df[df["label"] == 0]

    positive_n = round(
        TRAIN_SAMPLE * len(positive) / len(df)
    )
    negative_n = TRAIN_SAMPLE - positive_n

    positive_sample = positive.sample(
        n=positive_n,
        random_state=DATA_SEED,
    )

    negative_sample = negative.sample(
        n=negative_n,
        random_state=DATA_SEED,
    )

    sampled = pd.concat(
        [positive_sample, negative_sample]
    )

    return (
        sampled
        .sample(frac=1, random_state=DATA_SEED)
        .reset_index(drop=True)
    )


def build_vectorizer() -> TfidfVectorizer:
    """Create the project's configured TF-IDF vectorizer."""

    return TfidfVectorizer(
        ngram_range=TFIDF_NGRAM,
        min_df=TFIDF_MIN_DF,
        max_features=TFIDF_MAX_FEATURES,
    )


def evaluate_model(
    name: str,
    model,
    X_test,
    y_test,
) -> dict:
    """Evaluate one trained model."""

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )
    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )
    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    matrix = confusion_matrix(y_test, predictions)

    print(f"\n{name}")
    print("-" * 50)
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print("Confusion Matrix:")
    print(matrix)

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            target_names=["negative", "positive"],
            zero_division=0,
        )
    )

    return {
        "model": name,
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": matrix.tolist(),
    }


def main() -> None:
    """Train, evaluate and save the best sentiment model."""

    print("Loading cleaned dataset...")

    df = load_clean_data()

    print(f"Available reviews: {len(df)}")

    df = prepare_training_data(df)

    print(f"Training dataset size: {len(df)}")
    print(
        f"Positive: {(df['label'] == 1).sum()} | "
        f"Negative: {(df['label'] == 0).sum()}"
    )

    X = df["full_text"]
    y = df["label"]

    # 80/20 stratified train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SPLIT,
        random_state=DATA_SEED,
        stratify=y,
    )

    print(f"\nTraining samples: {len(X_train)}")
    print(f"Testing samples : {len(X_test)}")

    # TF-IDF
    print("\nCreating TF-IDF features...")

    vectorizer = build_vectorizer()

    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    print(f"TF-IDF train matrix: {X_train_tfidf.shape}")
    print(f"TF-IDF test matrix : {X_test_tfidf.shape}")

    # Three required models
    models = {
        "LogisticRegression": LogisticRegression(
            max_iter=1000,
            random_state=DATA_SEED,
        ),
        "LinearSVC": LinearSVC(
            random_state=DATA_SEED,
        ),
        "MultinomialNB": MultinomialNB(),
    }

    results = []

    for name, model in models.items():

        print(f"\nTraining {name}...")

        model.fit(X_train_tfidf, y_train)

        result = evaluate_model(
            name,
            model,
            X_test_tfidf,
            y_test,
        )

        results.append(result)

    # Select best model using F1 score
    best_result = max(
        results,
        key=lambda result: result["f1_score"],
    )

    best_model_name = best_result["model"]
    best_model = models[best_model_name]

    print("\n" + "=" * 60)
    print(f"BEST MODEL: {best_model_name}")
    print(f"Best F1 Score: {best_result['f1_score']:.4f}")
    print("=" * 60)

    # Save best model
    SENTIMENT_MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        best_model,
        SENTIMENT_MODEL_PATH,
    )

    # Save vectorizer
    joblib.dump(
        vectorizer,
        TFIDF_PATH,
    )

    # Save metrics
    metrics = {
        "dataset": {
            "total_clean_reviews": int(len(df)),
            "training_samples": int(len(X_train)),
            "testing_samples": int(len(X_test)),
            "positive": int((y == 1).sum()),
            "negative": int((y == 0).sum()),
        },
        "tfidf": {
            "ngram_range": list(TFIDF_NGRAM),
            "min_df": TFIDF_MIN_DF,
            "max_features": TFIDF_MAX_FEATURES,
            "actual_features": int(X_train_tfidf.shape[1]),
        },
        "models": results,
        "best_model": best_model_name,
        "best_f1_score": best_result["f1_score"],
    }

    METRICS_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        METRICS_PATH,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            metrics,
            file,
            indent=4,
        )

    print("\nFiles saved successfully:")
    print(f"Model      : {SENTIMENT_MODEL_PATH}")
    print(f"Vectorizer : {TFIDF_PATH}")
    print(f"Metrics    : {METRICS_PATH}")


if __name__ == "__main__":
    main()