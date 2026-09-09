"""Deterministic aggregation — no second ML classifier."""

import re

from cfa.ml.serve import (
    predict_sentiment,
    predict_aspect_sentiment,
)


_CLAUSE_SPLIT = re.compile(
    r"(?<=[.!?,;])\s+|\s+(?:but|and|although|however|yet|so|because|while|whereas)\s+",
    re.I,
)


class SentimentClassifier:

    def clause_polarities(self, text):
        clauses = [
            c.strip()
            for c in _CLAUSE_SPLIT.split(text)
            if c.strip()
        ]

        if len(clauses) < 2:
            return False, False

        pos = False
        neg = False

        for c in clauses:
            r = predict_sentiment(c)

            if (
                r["label"] == "positive"
                and r["confidence"] >= 0.5
            ):
                pos = True

            elif (
                r["label"] == "negative"
                and r["confidence"] >= 0.5
            ):
                neg = True

        return pos, neg

    def classify(self, text, aspects):
        # ----------------------------------------------------
        # Aspect-level sentiment using MAMS ABSA model
        # ----------------------------------------------------

        updated_aspects = []

        for aspect in aspects:
            aspect_name = aspect.get("name")

            if not aspect_name:
                updated_aspects.append(aspect)
                continue

            result = predict_aspect_sentiment(
                text,
                aspect_name,
            )

            updated_aspect = dict(aspect)

            if result["label"] != "unknown":
                updated_aspect["sentiment"] = result["label"]
                updated_aspect["confidence"] = result["confidence"]

            updated_aspects.append(updated_aspect)

        # ----------------------------------------------------
        # Count aspect-level sentiments
        # ----------------------------------------------------

        pos = sum(
            1
            for a in updated_aspects
            if a.get("sentiment") == "positive"
        )

        neg = sum(
            1
            for a in updated_aspects
            if a.get("sentiment") == "negative"
        )

        neutral = sum(
            1
            for a in updated_aspects
            if a.get("sentiment") == "neutral"
        )

        # ----------------------------------------------------
        # Overall sentiment
        # ----------------------------------------------------

        overall_result = predict_sentiment(text)
        label = overall_result["label"]
        conf = overall_result["confidence"]

        # Different aspect sentiments -> mixed review
        if pos > 0 and neg > 0:
            return "mixed", conf

        if pos > 0:
            return "positive", conf

        if neg > 0:
            return "negative", conf

        if neutral > 0:
            return "neutral", conf

        # ----------------------------------------------------
        # Existing clause-based fallback
        # ----------------------------------------------------

        cp_pos, cp_neg = self.clause_polarities(text)

        if cp_pos and cp_neg:
            return "mixed", conf

        if cp_pos:
            return "positive", conf

        if cp_neg:
            return "negative", conf

        # No aspects found: fall back to neutral
        if not aspects:
            return "neutral", conf

        if conf < 0.7:
            return "neutral", conf

        return label, conf