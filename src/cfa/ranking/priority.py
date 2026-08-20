"""Priority ranking contract.

Impact = normalized(count x negative_pct), 0-100.
"""

import logging

logger = logging.getLogger(__name__)


def rank_concerns(concern_stats: dict) -> list:
    concerns = concern_stats.get("concerns", [])
    logger.info("rank_concerns: received %d concerns.", len(concerns))

    scores = [
        (c, c["count"] * c["negative_pct"])
        for c in concerns
    ]

    if not scores:
        logger.info("rank_concerns: no concerns to rank.")
        return []

    max_score = max(s for _, s in scores)
    ranked = []

    for concern, score in sorted(scores, key=lambda x: x[1], reverse=True):
        if max_score == 0:
            impact = 0
        else:
            impact = int(round(score / max_score * 100))

        ranked.append(
            {
                "concern": concern["name"],
                "count": concern["count"],
                "negative_pct": concern["negative_pct"],
                "impact": impact,
                "priority": len(ranked) + 1,
            }
        )

    logger.info("rank_concerns: ranked %d concerns, top='%s' impact=%d.",
                len(ranked), ranked[0]["concern"] if ranked else None,
                ranked[0]["impact"] if ranked else None)
    return ranked