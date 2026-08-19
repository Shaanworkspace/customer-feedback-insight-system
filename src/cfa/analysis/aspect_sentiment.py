import logging
import re
from typing import Any, Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


def get_context(text: str, keyword: str, window: int = 8) -> str:
   
    if not text or not keyword:
        return text or ""

    # Build case-insensitive pattern for the keyword/phrase
    escaped = r"\s+".join(re.escape(w) for w in keyword.lower().split())
    pattern = re.compile(r"\b" + escaped + r"\b", re.IGNORECASE)
    match   = pattern.search(text)

    if not match:
        # Keyword not found — return full text as fallback
        return text

    # Tokenise the text, preserving character positions
    tokens = list(re.finditer(r"\S+", text))
    if not tokens:
        return text

    # Identify which tokens the keyword match overlaps
    kw_start, kw_end = match.start(), match.end()
    first_idx: Optional[int] = None
    last_idx:  Optional[int] = None

    for i, tok in enumerate(tokens):
        if tok.end() > kw_start and first_idx is None:
            first_idx = i
        if tok.start() < kw_end:
            last_idx = i

    if first_idx is None:
        return text

    last_idx = last_idx or first_idx

    # Slice the window
    win_start = max(0, first_idx - window)
    win_end   = min(len(tokens) - 1, last_idx + window)

    return text[tokens[win_start].start(): tokens[win_end].end()].strip()


def predict_sentiment(
    text: str,
    sentiment_model: Any,
    vectorizer: Any,
) -> Dict[str, Any]:

    if not text or not text.strip():
        return {"label": "neutral", "confidence": None}

    try:
        vector     = vectorizer.transform([text])
        prediction = sentiment_model.predict(vector)[0]
        label      = str(prediction).lower().strip()

        confidence: Optional[float] = None
        if hasattr(sentiment_model, "predict_proba"):
            proba      = sentiment_model.predict_proba(vector)[0]
            confidence = float(round(float(np.max(proba)), 4))

        return {"label": label, "confidence": confidence}

    except Exception as exc:
        logger.warning(
            "Sentiment prediction failed for text='%s…': %s",
            text[:50], exc,
        )
        return {"label": "neutral", "confidence": None}


def analyze_aspect_sentiment(
    text: str,
    detected_concerns: List[Dict],
    sentiment_model: Any,
    vectorizer: Any,
    context_window: int = 8,
) -> Dict[str, Dict]:

    if not detected_concerns:
        return {}

    if sentiment_model is None or vectorizer is None:
        logger.error(
            "analyze_aspect_sentiment: model or vectorizer is None."
        )
        return {}

    results: Dict[str, Dict] = {}

    for concern in detected_concerns:
        aspect   = concern.get("aspect", "")
        keywords = concern.get("keywords", [])

        if not aspect or not keywords:
            continue

        try:
            # First keyword is longest/most specific (lexicon is sorted that way)
            anchor  = keywords[0]
            context = get_context(text, anchor, window=context_window)
            result  = predict_sentiment(context, sentiment_model, vectorizer)

            results[aspect] = {
                "sentiment":  result["label"],
                "confidence": result["confidence"],
                "context":    context,
            }

            logger.debug(
                "Aspect sentiment: %s → %s (context='%s…')",
                aspect, result["label"], context[:40],
            )

        except Exception as exc:
            logger.warning(
                "Aspect sentiment failed for aspect='%s': %s", aspect, exc
            )
            results[aspect] = {
                "sentiment":  "neutral",
                "confidence": None,
                "context":    "",
            }

    return results