"""Deterministic aggregation — no second ML classifier.

Aim: pos>0 and neg>0 -> Mixed, pos only -> Positive, neg only -> Negative.
No hard-coded word list, no second model.
"""

class SentimentClassifier:
    def classify(self, text, aspects):
        pos = sum(1 for a in aspects if a.get("sentiment") == "positive")
        neg = sum(1 for a in aspects if a.get("sentiment") == "negative")
        neu = sum(1 for a in aspects if a.get("sentiment") == "neutral")
        conf = 0.85 if aspects else 0.60
        if pos > 0 and neg > 0:
            return "mixed", conf
        if pos > 0:
            return "positive", conf
        if neg > 0:
            return "negative", conf
        if neu > 0:
            return "neutral", conf
        return "neutral", conf
