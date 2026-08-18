"""Sentiment prediction contract.

Mock until Reekal's trained model lands. Swap _predict with the real model load.
"""

def predict_sentiment(text: str) -> dict:
    positive_words = ["good", "great", "excellent", "love", "best", "fast", "easy"]
    negative_words = ["bad", "terrible", "poor", "awful", "worst", "slow", "drains", "late"]
    text_lower = text.lower()
    score = sum(w in text_lower for w in positive_words) - sum(w in text_lower for w in negative_words)
    label = "positive" if score >= 0 else "negative"
    confidence = min(1.0, 0.5 + abs(score) * 0.15)
    return {"label": label, "confidence": round(confidence, 2)}
