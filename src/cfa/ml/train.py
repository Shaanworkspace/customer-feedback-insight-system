"""Train sentiment model on data/training_reviews.csv and save artifacts.

Source: our Amazon reviews merged with the amazon_polarity dataset.
Label: positive / negative (already prepared in the CSV).
Outputs: models/sentiment_model.joblib, models/sentiment_vectorizer.joblib, models/metrics.json
"""

import json
import sys

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer

RAW = "data/training_reviews.csv"
MODEL_PATH = "models/sentiment_model.joblib"
VEC_PATH = "models/sentiment_vectorizer.joblib"


def main():
    df = pd.read_csv(RAW, usecols=["Review Text", "label"], engine="python")
    df = df.dropna(subset=["Review Text", "label"])
    df["label"] = df["label"].astype(str).str.strip().str.lower()
    df = df[df["label"].isin(["positive", "negative"])]

    print(f"total rows: {len(df)}")
    print(df["label"].value_counts().to_dict())

    X_train, X_test, y_train, y_test = train_test_split(
        df["Review Text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
    )

    vectorizer = TfidfVectorizer(
        max_features=30000, stop_words="english", ngram_range=(1, 2), sublinear_tf=True, min_df=2
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    model = LogisticRegression(max_iter=2000, C=1.0, class_weight="balanced")
    model.fit(X_train_vec, y_train)

    pred = model.predict(X_test_vec)
    print(f"accuracy:  {accuracy_score(y_test, pred):.4f}")
    print(f"precision: {precision_score(y_test, pred, pos_label='positive'):.4f}")
    print(f"recall:    {recall_score(y_test, pred, pos_label='positive'):.4f}")
    print(f"f1:        {f1_score(y_test, pred, pos_label='positive'):.4f}")
    print(classification_report(y_test, pred, target_names=["negative", "positive"]))

    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VEC_PATH)
    print(f"saved {MODEL_PATH} and {VEC_PATH}")

    metrics = {
        "accuracy": float(accuracy_score(y_test, pred)),
        "precision": float(precision_score(y_test, pred, pos_label="positive")),
        "recall": float(recall_score(y_test, pred, pos_label="positive")),
        "f1": float(f1_score(y_test, pred, pos_label="positive")),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "label_counts": {k: int(v) for k, v in df["label"].value_counts().items()},
    }
    with open("models/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print("saved models/metrics.json")


if __name__ == "__main__":
    sys.exit(main())