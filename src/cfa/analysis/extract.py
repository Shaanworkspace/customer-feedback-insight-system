"""Dynamic aspect extraction.

Primary path: an LLM via the Hugging Face Inference API (free) when HF_TOKEN
is set. The LLM does open aspect-based sentiment — it returns whatever aspects
a customer mentions with their own sentiment, so there is no fixed entity list.

Fallback: the keyword lexicon (offline) when no token is set or the API fails.
"""

import os
import re

import requests

from cfa.core.config import CONCERN_LEXICON_PATH

_HF_URL = "https://api-inference.huggingface.co/models/{model}"
_MODEL = os.environ.get("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.1")
_TIMEOUT = 25

_lexicon = None


def _load_lexicon():
    global _lexicon
    if _lexicon is None:
        import json
        with open(CONCERN_LEXICON_PATH) as f:
            _lexicon = json.load(f)
    return _lexicon


def _clause_for(text, term):
    parts = re.split(r"(?<=[.!?,;])\s+|\s+(?:but|and|although|however|yet|so|because)\s+", text, flags=re.I)
    for p in parts:
        if term in p.lower():
            return p
    return text


def _lexicon_aspects(text):
    from cfa.ml.serve import predict_sentiment

    lexicon = _load_lexicon()
    text_lower = text.lower()
    out = []
    seen = set()
    for name, terms in lexicon.items():
        hit = next((t for t in terms if t in text_lower), None)
        if not hit or name in seen:
            continue
        seen.add(name)
        clause = _clause_for(text, hit)
        sentiment = predict_sentiment(clause)["label"]
        out.append({"name": name, "sentiment": sentiment, "matched_terms": [hit], "confidence": 0.6})
    return out


def _parse_batch(raw, n):
    blocks = re.split(r"Review\s+\d+\s*:", raw)
    picked = blocks[1 : n + 1] if len(blocks) > 1 else [raw]
    results = []
    for block in picked:
        pairs = []
        for m in re.finditer(r"([a-z][a-z0-9 _\-]{1,30}?)\s*[:\-]\s*(positive|negative|neutral)", block, re.I):
            aspect = m.group(1).strip().lower().strip(" -")
            sentiment = m.group(2).lower()
            if aspect:
                pairs.append({"name": aspect, "sentiment": sentiment, "matched_terms": [aspect], "confidence": 0.85})
        seen = {}
        for p in pairs:
            seen.setdefault(p["name"], p)
        results.append(list(seen.values()))
    while len(results) < n:
        results.append([])
    return results[:n]


def _llm_batch(texts):
    token = os.environ.get("HF_TOKEN")
    if not token:
        return None
    prompt = (
        "You are a review analyzer. For each review, list every aspect (a short noun like "
        "battery, delivery, screen, price, support) and its sentiment as 'aspect: sentiment' "
        "where sentiment is positive, negative, or neutral. Put each on its own line. If a review "
        "mentions both good and bad things, list each aspect separately with its own sentiment.\n\n"
    )
    for i, t in enumerate(texts):
        prompt += f"Review {i + 1}: {t}\n"
    prompt += "\nOutput exactly in this format:\nReview 1:\nbattery: negative\ndelivery: positive\nReview 2:\n...\n"
    try:
        resp = requests.post(
            _HF_URL.format(model=_MODEL),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"inputs": prompt, "parameters": {"max_new_tokens": 500, "temperature": 0}},
            timeout=_TIMEOUT,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        if isinstance(data, list) and data and "generated_text" in data[0]:
            raw = data[0]["generated_text"]
        elif isinstance(data, dict) and "generated_text" in data:
            raw = data["generated_text"]
        else:
            raw = str(data)
        parsed = _parse_batch(raw, len(texts))
        if sum(len(r) for r in parsed) == 0:
            return None
        return parsed
    except Exception:
        return None


def extract_aspects(texts):
    """Return a list (aligned to `texts`) of aspect dicts."""
    llm = _llm_batch(texts)
    if llm is not None:
        return llm
    return [_lexicon_aspects(t) for t in texts]
