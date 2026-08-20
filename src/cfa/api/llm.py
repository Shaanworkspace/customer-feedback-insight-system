"""Groq LLM calls for entity + sentiment extraction, with rule-based fallback.

Backend owns this module: the team has no separate LLM teammate
(see README.md team list), and backend.md PART 2.5 assigns the
Groq integration to the backend.
"""

import json
import logging
import string
from typing import Dict, List

from cfa.analysis.concern import detect_concerns
from cfa.api.config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a review analysis system. "
    "You read customer reviews and find the problems. "
    "For every review you return the entities (the things "
    "the review talks about), the sentiment (positive or "
    "negative), and a confidence from 0.0 to 1.0. "
    "You only output JSON. No other text."
)

GOOD_WORDS = {
    "good", "great", "excellent", "love", "best", "amazing", "perfect",
    "fast", "easy", "nice", "awesome", "smooth", "reliable",
}
BAD_WORDS = {
    "bad", "terrible", "worst", "hate", "poor", "slow", "broken", "awful",
    "disappointing", "late", "expensive", "dim", "drains", "fails", "fail",
    "issue", "problem", "defective", "dead",
}


def _build_batch_prompt(reviews: List[str], known_entities: List[str]) -> str:
    known = ", ".join(known_entities) if known_entities else "(none)"
    lines = "\n".join(f"{i}: {text}" for i, text in enumerate(reviews))
    return (
        f"These are {len(reviews)} reviews. For each review return the entities, "
        "the sentiment, and the confidence. Use the index number "
        "to identify each review.\n\n"
        "Entities already known (use these EXACT names if the "
        f"review talks about one of them):\n{known}\n\n"
        "Only give a NEW name for something not in this list.\n\n"
        f"Reviews:\n{lines}\n\n"
        "Return only JSON in this shape:\n"
        '{"results": [{"index": 0, "aspects": [{"entity": "...", '
        '"sentiment": "positive or negative", "confidence": 0.0}]}]}'
    )


def _groq_call(reviews: List[str], known_entities: List[str]) -> List[Dict]:
    from groq import Groq

    client = Groq(api_key=GROQ_API_KEY)
    logger.info("Groq call: batch of %d reviews, model=%s, known_entities=%d.",
                len(reviews), GROQ_MODEL, len(known_entities))
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_batch_prompt(reviews, known_entities)},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    payload = json.loads(response.choices[0].message.content)
    results = payload["results"]
    logger.info("Groq call: returned %d results.", len(results))
    return results


def rule_based_sentiment(text: str) -> tuple:
    words = [w.strip(string.punctuation).lower() for w in text.split()]
    good = sum(1 for w in words if w in GOOD_WORDS)
    bad = sum(1 for w in words if w in BAD_WORDS)
    if good == 0 and bad == 0:
        return "positive", 0.5
    if good > bad:
        return "positive", 0.8
    return "negative", 0.8


def rule_based_batch(reviews: List[str]) -> List[Dict]:
    """Same output shape as the Groq call. Works fully offline."""
    results = []
    for i, text in enumerate(reviews):
        sentiment, confidence = rule_based_sentiment(text)
        aspects = [
            {"entity": c["aspect"], "sentiment": sentiment, "confidence": confidence}
            for c in detect_concerns(text)
        ]
        results.append({"index": i, "aspects": aspects})
    logger.info("rule_based_batch: processed %d reviews -> %d results.",
                len(reviews), len(results))
    return results


def call_llm_batch(reviews: List[str], known_entities: List[str]) -> List[Dict]:
    """Send one batch (25-30 reviews) to Groq. Tries once, retries twice,
    then falls back to rule-based so no batch is ever dropped."""
    if not GROQ_API_KEY:
        logger.info("No GROQ_API_KEY set — using rule-based fallback for %d reviews.", len(reviews))
        return rule_based_batch(reviews)

    for attempt in range(3):
        try:
            return _groq_call(reviews, known_entities)
        except Exception as exc:
            logger.warning("Groq call failed (attempt %d): %s", attempt + 1, exc)

    logger.error("Groq call failed 3 times — falling back to rule-based for %d reviews.", len(reviews))
    return rule_based_batch(reviews)