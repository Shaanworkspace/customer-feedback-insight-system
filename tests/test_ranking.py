from cfa.ranking.priority import rank_concerns

stats = {
    "total_reviews": 20000,
    "total_mentions": 7900,
    "concerns": [
        {"name": "battery", "count": 3100, "positive": 682, "negative": 2418, "negative_pct": 78.0},
        {"name": "camera", "count": 2100, "positive": 1700, "negative": 400, "negative_pct": 19.0},
        {"name": "delivery", "count": 1500, "positive": 675, "negative": 825, "negative_pct": 55.0},
        {"name": "price", "count": 1200, "positive": 800, "negative": 400, "negative_pct": 33.3},
    ],
}


def test_rank_orders_by_impact():
    ranked = rank_concerns(stats)
    assert ranked[0]["concern"] == "battery"
    assert ranked[0]["priority"] == 1
    assert ranked[0]["impact"] == 100
    assert len(ranked) == 4


def test_rank_fields():
    ranked = rank_concerns(stats)
    fields = {"concern", "count", "negative_pct", "impact", "priority"}
    assert fields == set(ranked[0].keys())