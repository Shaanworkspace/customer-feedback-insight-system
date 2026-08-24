class ConcernAggregator:
    def __init__(self):
        self.counts = {}

    def add(self, name, sentiment, text):
        entry = self.counts.setdefault(name, {"count": 0, "negative": 0, "texts": []})
        entry["count"] += 1
        if sentiment == "negative":
            entry["negative"] += 1
        entry["texts"].append(text)

    def stats(self):
        return [
            {
                "name": name,
                "count": entry["count"],
                "negative_pct": round(entry["negative"] / entry["count"] * 100, 1),
            }
            for name, entry in self.counts.items()
        ]

    def proof(self):
        return {
            name: [{"text": t, "similarity": 1.0} for t in entry["texts"][:3]]
            for name, entry in self.counts.items()
        }

    def texts(self, name):
        return self.counts.get(name, {}).get("texts", [])
