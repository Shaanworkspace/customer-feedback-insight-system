from fastapi.testclient import TestClient

from cfa.api.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_analyze_shape():
    res = client.post("/api/v1/analyze", json={"review_text": "camera is excellent but battery drains fast"})
    assert res.status_code == 200
    data = res.json()
    assert "overall_sentiment" in data
    assert "concerns" in data
    assert "ranked_concerns" in data


def test_stats_shape():
    res = client.get("/api/v1/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_reviews" in data
    assert "sentiment_distribution" in data
    assert "ranked_concerns" in data