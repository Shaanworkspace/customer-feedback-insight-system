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


def _dynamic_fallback_batch(texts):
    """Fallback when BERT not yet trained and no LLM.

    We keep it empty — no TF-IDF, no word list. This keeps your main BERT model pure.
    Once you run trainer.train() in the notebook, this fallback will never be used.
    """
    return [[] for _ in texts]


def extract_aspects(texts):
    """Return a list (aligned to `texts`) of aspect dicts.

    Order: 1) BERT perfect model (no hard-code), 2) LLM if HF_TOKEN set, 3) dynamic per-CSV discovery.
    """
    # Try BERT one by one (needs is_trained check)
    bertResults = []
    needFallbackIndices = []
    needFallbackTexts = []
    for idx, text in enumerate(texts):
        bert = _bert_aspects(text)
        if bert is not None:
            bertResults.append((idx, bert))
        else:
            needFallbackIndices.append(idx)
            needFallbackTexts.append(text)

    # Try LLM for those not handled by BERT
    stillNeedIndices = []
    stillNeedTexts = []
    llmResultsMap = {}
    if needFallbackTexts:
        llmBatch = _llm_batch(needFallbackTexts)
        if llmBatch is not None:
            for localIdx, globalIdx in enumerate(needFallbackIndices):
                if llmBatch[localIdx]:
                    llmResultsMap[globalIdx] = llmBatch[localIdx]
                else:
                    stillNeedIndices.append(globalIdx)
                    stillNeedTexts.append(needFallbackTexts[localIdx])
        else:
            stillNeedIndices = needFallbackIndices
            stillNeedTexts = needFallbackTexts

    # Dynamic fallback for the rest (no hard-coded product list)
    dynamicBatch = _dynamic_fallback_batch(stillNeedTexts) if stillNeedTexts else []

    # Assemble final in order
    finalResults = [None] * len(texts)
    for idx, bertRes in bertResults:
        finalResults[idx] = bertRes
    for idx, llmRes in llmResultsMap.items():
        finalResults[idx] = llmRes
    for localIdx, globalIdx in enumerate(stillNeedIndices):
        finalResults[globalIdx] = dynamicBatch[localIdx]

    # Any still None -> empty
    for i in range(len(finalResults)):
        if finalResults[i] is None:
            finalResults[i] = []

    return finalResults
