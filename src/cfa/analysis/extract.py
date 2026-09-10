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
    """Discover aspects per CSV without a fixed list.

    We find frequent content words across the batch (not a hard-coded product list).
    For sentiment we use the trained TF-IDF model (not a word list) on the clause.
    """
    try:
        from cfa.ml.serve import predict_sentiment
        from collections import Counter
        import re

        stopwords = {
            "the","is","are","was","were","be","been","am","a","an","and","or","but","if","in","on","at","to","of","for","with","by","this","that","these","those","it","its","as","so","no","not","very","just","also","have","has","had","do","does","did","will","would","can","could","should","my","your","our","their","i","we","you","he","she","they","me","us","him","her","them","from","up","out","about","into","over","after","before","between","during","while","when","where","why","how","what","which","who","whom",
        }
        # Opinion words and generic time/verb words should not be treated as aspects
        opinion_stopwords = {
            "terrible","poor","low","quickly","drains","drains fast","overheats","slow","fast","good","great","excellent","amazing","stunning","sharp","vivid","beautiful","awesome","perfect","outstanding","superb","wonderful","fantastic","happy","satisfied","disappointed","rude","unhelpful","useless","expensive","overpriced","faulty","broken","cracked","blurry","grainy","dim","flickers","late","cheap","worth","sturdy","durable","comfortable","wobbly","flimsy","neat","safe","average","special","quick","quickly","poorly",
            "day","days","time","life","love","smooth","easy",
        }
        # Collect word counts across all reviews
        wordCounts = Counter()
        reviewWords = []
        for text in texts:
            words = re.findall(r"[a-z]{3,}", text.lower())
            filtered = [w for w in words if w not in stopwords]
            reviewWords.append(filtered)
            wordCounts.update(filtered)

        # Frequent words that appear at least 3 times are candidate aspects, but not opinion words
        # 3+ filters out noisy 2x words like "day", "time" while keeping real concerns like battery (8x)
        frequentAspects = {word for word, count in wordCounts.items() if count >= 3 and word not in opinion_stopwords}

        batchResults = []
        for text, words in zip(texts, reviewWords):
            foundAspects = []
            seenInReview = set()
            for word in words:
                if word not in frequentAspects or word in seenInReview:
                    continue
                # Must appear as a whole word in this review
                if not re.search(r"\b" + re.escape(word) + r"\b", text.lower()):
                    continue
                seenInReview.add(word)
                clauseText = _clause_for(text, word)
                try:
                    sentimentLabel = predict_sentiment(clauseText)["label"]
                except Exception:
                    sentimentLabel = "neutral"
                foundAspects.append({
                    "name": word,
                    "sentiment": sentimentLabel,
                    "matched_terms": [word],
                    "confidence": 0.65,
                })
            batchResults.append(foundAspects)
        return batchResults
    except Exception:
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
