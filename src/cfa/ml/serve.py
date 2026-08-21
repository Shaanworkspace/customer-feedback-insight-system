"""Serve predictions using the trained sentiment model."""

from __future__ import annotations

import joblib
import numpy as np

from cfa.core.config import SENTIMENT_MODEL_PATH, TFIDF_PATH
from cfa.data.preprocess import clean_text


# Load trained model and TF-IDF vectorizer once when the module starts.
MODEL = joblib.load(SENTIMENT_MODEL_PATH)
VECTORIZER = joblib.load(TFIDF_PATH)


def predict_sentiment(text: str) -> dict:
    """
    Predict sentiment for a single review.

    Returns:
        {
            "label": "positive" | "negative",
            "confidence": 0.0 to 1.0
        }
    """

    if not isinstance(text, str):
        raise TypeError("text must be a string")

    cleaned_text = clean_text(text)

    if not cleaned_text:
        return {
            "label": "negative",
            "confidence": 0.5,
        }

    # Convert text into the same TF-IDF representation
    # used during model training.
    features = VECTORIZER.transform([cleaned_text])

    # LinearSVC prediction
    prediction = int(MODEL.predict(features)[0])

    # LinearSVC does not provide predict_proba().
    # decision_function gives the distance from the decision boundary.
    decision = float(MODEL.decision_function(features)[0])

    # Convert decision score into a 0-1 confidence-like value.
    confidence = 1.0 / (1.0 + np.exp(-abs(decision)))

    label = "positive" if prediction == 1 else "negative"

    return {
        "label": label,
        "confidence": round(float(confidence), 2),
    }