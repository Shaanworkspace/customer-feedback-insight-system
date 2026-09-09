"""Aspect extraction: Perfect model (BERT) first, then LLM if HF_TOKEN set.

No hard-coded aspect list. The model learns patterns, not a fixed list.
This mirrors Final_Perfect_Model.ipynb — small helpers, no big function.
"""

import os
import re

import requests

_HF_URL = "https://api-inference.huggingface.co/models/{model}"
_MODEL = os.environ.get("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.1")
_TIMEOUT = 25


def _bert_aspects(text):
    # Try the perfect BERT model first
    try:
        from cfa.ml.bert_aste import predict_review, is_trained

        if not is_trained():
            return None
        result = predict_review(text)
        triplets = result.get("aspects", [])
        if not triplets:
            return None
        out = []
        for t in triplets:
            out.append(
                {
                    "name": t["aspect"].lower().strip(),
                    "sentiment": t["sentiment"].lower(),
                    "matched_terms": [t["aspect"]],
                    "confidence": 0.85,
                }
            )
        return out
    except Exception:
        return None


def _clause_for(text, term):
    parts = re.split(r"(?<=[.!?,;])\s+|\s+(?:but|and|although|however|yet|so|because)\s+", text, flags=re.I)
    for p in parts:
        if term in p.lower():
            return p
    return text


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


def _fallback_empty(text):
    # No hard-coded word list. Return empty so the caller can handle it.
    # This keeps the flow honest: if BERT not trained and no LLM, we do not guess.
    return []


def extract_aspects(texts):
    """Return a list (aligned to `texts`) of aspect dicts.

    Order: 1) BERT perfect model (no hard-code), 2) LLM if HF_TOKEN set, 3) empty.
    """
    out = []
    for t in texts:
        bert = _bert_aspects(t)
        if bert is not None:
            out.append(bert)
            continue
        llm = _llm_batch([t])
        if llm is not None and llm[0]:
            out.append(llm[0])
            continue
        out.append(_fallback_empty(t))
    return out
