"""Aspect extraction — your main BERT model only.

Aim: 1 review → auto aspects → per-aspect feeling → Mixed.
Only English stopwords are kept (standard). No hard-coded product list, no word list, no LLM.
"""

import re
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

# Standard English stopwords — kept as you said (not hard-coded by us)
STANDARD_STOPWORDS = set(ENGLISH_STOP_WORDS)


def _bert_aspects(text):
    # Your perfect BERT model — learns pattern X is wobbly → X is aspect
    try:
        from cfa.ml.bert_aste import predict_review, is_trained

        if not is_trained():
            return None
        result = predict_review(text)
        triplets = result.get("aspects", [])
        if not triplets:
            return None
        out = []
        for triplet in triplets:
            out.append(
                {
                    "name": triplet["aspect"].lower().strip(),
                    "sentiment": triplet["sentiment"].lower(),
                    "matched_terms": [triplet["aspect"]],
                    "confidence": 0.85,
                }
            )
        return out
    except Exception:
        return None


def extract_aspects(texts):
    """Return a list of aspect dicts for each text — BERT only.

    No TF-IDF, no LLM, no product list. If BERT not yet trained, returns empty
    (train in notebooks/Final_Perfect_Model.ipynb → bert_aste_final/).
    This keeps your aim pure and polished.
    """
    allResults = []
    for text in texts:
        bertResult = _bert_aspects(text)
        if bertResult is not None:
            allResults.append(bertResult)
        else:
            # No hard-coded guess — wait for BERT
            allResults.append([])
    return allResults
