"""Deterministic aggregation — no second ML classifier.

This mirrors Final_Perfect_Model.ipynb section 9.3:
- Perfect model gives aspects + sentiment
- Overall is decided by counting (Positive+Negative -> Mixed)
- No hard-coded word list.
"""


class SentimentClassifier:
    def classify(self, text, aspects):
        # aspects = [{"name": "battery", "sentiment": "negative"}, ...]
        pos = sum(1 for a in aspects if a.get("sentiment") == "positive")
        neg = sum(1 for a in aspects if a.get("sentiment") == "negative")
        neu = sum(1 for a in aspects if a.get("sentiment") == "neutral")

        # Confidence is fixed when BERT gives aspects
        conf = 0.85 if aspects else 0.60

        if pos > 0 and neg > 0:
            return "mixed", conf
        if pos > 0:
            return "positive", conf
        if neg > 0:
            return "negative", conf
        if neu > 0:
            return "neutral", conf
        # No aspects found: fall back to neutral (no hard-coded keyword check)
        return "neutral", conf
