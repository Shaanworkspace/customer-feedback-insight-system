from pathlib import Path

import joblib


BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_DIR = BASE_DIR / "models" / "mams_absa"

MODEL_PATH = MODEL_DIR / "model.joblib"
VECTORIZER_PATH = MODEL_DIR / "vectorizer.joblib"


import pytest

if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
    pytest.skip(f"MAMS model not found at {MODEL_PATH}", allow_module_level=True)

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)


def predict_sentiment(review, aspect):
    text = review + " [ASPECT] " + aspect

    vector = vectorizer.transform([text])

    prediction = model.predict(vector)[0]

    probabilities = model.predict_proba(vector)[0]

    confidence = max(probabilities)

    return prediction, confidence


test_cases = [
    (
        "The camera quality is excellent but the battery drains quickly.",
        "camera",
    ),
    (
        "The camera quality is excellent but the battery drains quickly.",
        "battery",
    ),
    (
        "The food was delicious but the service was terrible.",
        "food",
    ),
    (
        "The food was delicious but the service was terrible.",
        "service",
    ),
    (
        "The restaurant has reasonable prices and average service.",
        "prices",
    ),
    (
        "The restaurant has reasonable prices and average service.",
        "service",
    ),
]


for review, aspect in test_cases:
    prediction, confidence = predict_sentiment(review, aspect)

    print("\nReview :", review)
    print("Aspect :", aspect)
    print("Prediction :", prediction)
    print("Confidence :", round(confidence, 4))