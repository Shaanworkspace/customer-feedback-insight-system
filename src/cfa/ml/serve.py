"""Sentiment prediction contract.

Loads the trained TF-IDF + LogisticRegression model. Falls back to a
keyword heuristic only if the model files are missing (fresh checkout).
"""

import joblib

from cfa.core.config import MODEL_PATH, VECTORIZER_PATH

_loaded = {"model": None, "vectorizer": None}


def _load():
    if _loaded["model"] is None and MODEL_PATH.exists() and VECTORIZER_PATH.exists():
        _loaded["model"] = joblib.load(MODEL_PATH)
        _loaded["vectorizer"] = joblib.load(VECTORIZER_PATH)
    return _loaded["model"], _loaded["vectorizer"]


def predict_sentiment(text: str) -> dict:
    model, vectorizer = _load()
    if model is None:
        positive_words = [
            "good", "great", "excellent", "love", "loved", "best", "easy", "amazing",
            "happy", "worth", "stunning", "sharp", "beautiful", "awesome", "perfect",
            "recommend", "recommended", "satisfied", "impressed", "nice", "works",
            "work", "helpful", "smooth", "quick", "fast", "wonderful", "fantastic",
            "superb",             "reliable", "comfortable", "bright", "vivid", "clear", "crisp",
        ]
        negative_words = [
            "bad", "terrible", "poor", "awful", "worst", "slow", "drains", "late",
            "died", "die", "dead", "overheat", "overheats", "drops", "drop",
            "broken", "break", "crack", "cracked", "blurry", "grainy", "dim",
            "flicker", "flickers", "rude", "unhelpful", "useless", "expensive",
            "overpriced", "swells", "swell", "hate", "waste", "wasted", "disappoint",
            "disappointing", "regret", "avoid", "faulty", "defective", "fails", "failed",
        ]
        text_lower = text.lower()
        score = sum(w in text_lower for w in positive_words) - sum(w in text_lower for w in negative_words)
        label = "positive" if score > 0 else "negative"
        confidence = min(1.0, 0.5 + abs(score) * 0.15)
        return {"label": label, "confidence": round(confidence, 2)}

    proba = model.predict_proba(vectorizer.transform([text]))[0]
    label = model.classes_[proba.argmax()]
    return {"label": label, "confidence": round(float(proba.max()), 2)}