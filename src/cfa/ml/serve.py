"""
Loads the trained TF-IDF + LogisticRegression models.

The existing sentiment model is used for overall sentiment prediction.

The MAMS-ATSA model is used for aspect-level sentiment prediction:
    review text + aspect -> negative / neutral / positive

Falls back to a keyword heuristic only if the overall sentiment
model files are missing.
"""

from pathlib import Path
import re

import joblib

from cfa.core.config import MODEL_PATH, VECTORIZER_PATH


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[3]


# ============================================================
# EXISTING OVERALL SENTIMENT MODEL
# ============================================================

_loaded = {
    "model": None,
    "vectorizer": None,
}


# ============================================================
# MAMS ABSA MODEL
# ============================================================

ABSA_MODEL_PATH = (
    BASE_DIR
    / "models"
    / "mams_absa"
    / "model.joblib"
)

ABSA_VECTORIZER_PATH = (
    BASE_DIR
    / "models"
    / "mams_absa"
    / "vectorizer.joblib"
)


_absa_loaded = {
    "model": None,
    "vectorizer": None,
}


# ============================================================
# LOAD EXISTING OVERALL SENTIMENT MODEL
# ============================================================

def _load():
    if (
        _loaded["model"] is None
        and MODEL_PATH.exists()
        and VECTORIZER_PATH.exists()
    ):
        _loaded["model"] = joblib.load(MODEL_PATH)
        _loaded["vectorizer"] = joblib.load(VECTORIZER_PATH)

    return (
        _loaded["model"],
        _loaded["vectorizer"],
    )


# ============================================================
# EXISTING KEYWORD FALLBACK
# ============================================================

def _keyword_fallback(text: str) -> dict:

    positive_words = [
        "good",
        "great",
        "excellent",
        "love",
        "loved",
        "best",
        "easy",
        "amazing",
        "happy",
        "worth",
        "stunning",
        "sharp",
        "beautiful",
        "awesome",
        "perfect",
        "recommend",
        "recommended",
        "satisfied",
        "impressed",
        "nice",
        "works",
        "work",
        "helpful",
        "smooth",
        "quick",
        "fast",
        "wonderful",
        "fantastic",
        "superb",
        "reliable",
        "comfortable",
        "bright",
        "vivid",
        "clear",
        "crisp",
        "breakthrough",
        "exceptional",
        "outstanding",
        "value",
        "durable",
        "okay",
        "fine",
        "decent",
        "accurate",
        "accurately",
        "solid",
        "satisfactory",
        "acceptable",
        "job",
        "fair",
        "like",
        "adequate",
        "recommendable",
        "pleased",
        "happy with",
        "good value",
        "works well",
        "does the job",
    ]

    negative_words = [
        "bad",
        "terrible",
        "poor",
        "awful",
        "worst",
        "slow",
        "drains",
        "late",
        "died",
        "die",
        "dead",
        "overheat",
        "overheats",
        "drops",
        "drop",
        "broken",
        "break",
        "crack",
        "cracked",
        "blurry",
        "grainy",
        "dim",
        "flicker",
        "flickers",
        "rude",
        "unhelpful",
        "useless",
        "expensive",
        "overpriced",
        "swells",
        "swell",
        "hate",
        "waste",
        "wasted",
        "disappoint",
        "disappointing",
        "regret",
        "avoid",
        "faulty",
        "defective",
        "fails",
        "failed",
        "worthless",
        "dies",
        "dying",
        "dropped",
        "breaking",
        "cracking",
        "swelling",
        "wasting",
        "failing",
        "flickering",
        "overheating",
        "draining",
    ]

    text_lower = text.lower()

    NEG = (
        "not ",
        "no ",
        "never",
        "n't",
        "without",
        "barely",
        "hardly",
    )

    def has(word):
        return (
            re.search(
                r"\b" + re.escape(word) + r"\b",
                text_lower,
            )
            is not None
        )

    def negated(word):
        m = re.search(
            r"\b" + re.escape(word) + r"\b",
            text_lower,
        )

        if not m:
            return False

        return any(
            n in text_lower[
                max(0, m.start() - 6):m.start()
            ]
            for n in NEG
        )

    pos_hits = 0
    neg_hits = 0

    for word in positive_words:
        if has(word) and not negated(word):
            pos_hits += 1

    for word in negative_words:
        if has(word):
            if negated(word):
                pos_hits += 1
            else:
                neg_hits += 1

    score = pos_hits - neg_hits

    label = (
        "positive"
        if score > 0
        else "negative"
    )

    confidence = min(
        1.0,
        0.5 + abs(score) * 0.15,
    )

    return {
        "label": label,
        "confidence": round(confidence, 2),
    }


# ============================================================
# OVERALL SENTIMENT PREDICTION
# ============================================================

def predict_sentiment(text: str) -> dict:

    model, vectorizer = _load()

    if model is None:
        return _keyword_fallback(text)

    proba = model.predict_proba(
        vectorizer.transform([text])
    )[0]

    label = model.classes_[proba.argmax()]
    conf = float(proba.max())

    if conf < 0.6 or len(text.split()) <= 8:
        return _keyword_fallback(text)

    return {
        "label": label,
        "confidence": round(conf, 2),
    }


# ============================================================
# LOAD MAMS ABSA MODEL
# ============================================================

def _load_absa():

    if (
        _absa_loaded["model"] is None
        and ABSA_MODEL_PATH.exists()
        and ABSA_VECTORIZER_PATH.exists()
    ):
        _absa_loaded["model"] = joblib.load(
            ABSA_MODEL_PATH
        )

        _absa_loaded["vectorizer"] = joblib.load(
            ABSA_VECTORIZER_PATH
        )

    return (
        _absa_loaded["model"],
        _absa_loaded["vectorizer"],
    )


# ============================================================
# ASPECT-LEVEL SENTIMENT PREDICTION
# ============================================================

def predict_aspect_sentiment(
    text: str,
    aspect: str,
) -> dict:

    model, vectorizer = _load_absa()

    if model is None or vectorizer is None:
        return {
            "aspect": aspect,
            "label": "unknown",
            "confidence": 0.0,
        }

    # IMPORTANT:
    # This must match the exact input format
    # used during MAMS training.

    model_input = (
        text
        + " [ASPECT] "
        + aspect
    )

    vector = vectorizer.transform(
        [model_input]
    )

    probabilities = model.predict_proba(
        vector
    )[0]

    label = model.classes_[
        probabilities.argmax()
    ]

    confidence = float(
        probabilities.max()
    )

    return {
        "aspect": aspect,
        "label": label,
        "confidence": round(
            confidence,
            2,
        ),
    }