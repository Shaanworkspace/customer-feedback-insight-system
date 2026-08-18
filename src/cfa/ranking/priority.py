"""Priority ranking contract.

Impact = normalized(count x negative_pct), 0-100.
"""


def rank_concerns(concern_stats: dict) -> list:
    concerns = concern_stats.get("concerns", [])
    scores = [(c["name"], c["count"] * c["negative_pct"]) for c in concerns]
    if not scores:
        return []
    max_score = max(s for _, s in scores)
    ranked = []
    for name, score in sorted(scores, key=lambda x: x[1], reverse=True):
        by_name = next(c for c in concerns if c["name"] == name)
        impact = int(round(score / max_score * 100))
        ranked.append(
            {
                "concern": name,
                "count": by_name["count"],
                "negative_pct": by_name["negative_pct"],
                "impact": impact,
                "priority": len(ranked) + 1,
            }
        )
    return ranked