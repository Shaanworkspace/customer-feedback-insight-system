import re

from cfa.ml.serve import predict_sentiment

_CLAUSE_SPLIT = re.compile(
    r"(?<=[.!?,;])\s+|\s+(?:but|and|although|however|yet|so|because|while|whereas)\s+",
    re.I,
)


class SentimentClassifier:
    def clause_polarities(self, text):
        clauses = [c.strip() for c in _CLAUSE_SPLIT.split(text) if c.strip()]
        if len(clauses) < 2:
            return False, False
        pos = neg = False
        for c in clauses:
            r = predict_sentiment(c)
            if r["label"] == "positive" and r["confidence"] >= 0.5:
                pos = True
            elif r["label"] == "negative" and r["confidence"] >= 0.5:
                neg = True
        return pos, neg

    def classify(self, text, aspects):
        res = predict_sentiment(text)
        label = res["label"]
        conf = res["confidence"]
        pos = sum(1 for a in aspects if a.get("sentiment") == "positive")
        neg = sum(1 for a in aspects if a.get("sentiment") == "negative")
        if pos > 0 and neg > 0:
            return "mixed", conf
        cp_pos, cp_neg = self.clause_polarities(text)
        if (pos > 0 and cp_neg) or (neg > 0 and cp_pos) or (cp_pos and cp_neg and not (pos or neg)):
            return "mixed", conf
        if pos > 0:
            return "positive", conf
        if neg > 0:
            return "negative", conf
        if any(a.get("sentiment") == "neutral" for a in aspects):
            return "neutral", conf
        if not aspects and conf < 0.8:
            return "neutral", conf
        if conf < 0.7:
            return "neutral", conf
        return label, conf
