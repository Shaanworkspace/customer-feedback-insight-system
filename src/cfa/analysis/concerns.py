from cfa.analysis.extract import extract_aspects
from cfa.analysis.rag import find_similar
from cfa.analysis.sentiment import SentimentClassifier

_classifier = SentimentClassifier()


def _aspects_view(aspects):
    return [{"aspect": a["name"], "sentiment": a.get("sentiment")} for a in aspects]


def analyze_review(text, include_similar=True):
    aspects = extract_aspects([text])[0]
    label, conf = _classifier.classify(text, aspects)
    return {
        "review_text": text,
        "overall_sentiment": label,
        "sentiment": label,
        "overall_confidence": conf,
        "concerns": aspects,
        "aspects": _aspects_view(aspects),
        "similar_reviews": find_similar(text) if include_similar else [],
    }


def analyze_reviews(texts):
    all_aspects = extract_aspects(texts)
    out = []
    for text, aspects in zip(texts, all_aspects):
        try:
            label, conf = _classifier.classify(text, aspects)
        except Exception:
            label, conf = "neutral", 0.0
        out.append(
            {
                "overall_sentiment": label,
                "overall_confidence": conf,
                "concerns": aspects,
                "aspects": _aspects_view(aspects),
            }
        )
    return out
