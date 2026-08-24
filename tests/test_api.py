from fastapi.testclient import TestClient

from cfa.api.main import app

client = TestClient(app)


def auth_headers():
    client.post("/api/v1/auth/signup", json={"username": "tester@example.com", "email": "tester@example.com", "password": "secret123"})
    token = client.post("/api/v1/auth/login", json={"username": "tester@example.com", "password": "secret123"}).json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_auth_required():
    assert client.post("/api/v1/analyze", json={"review_text": "good"}).status_code == 401


def test_signup_login_flow():
    client.post("/api/v1/auth/signup", json={"username": "alice@example.com", "email": "alice@example.com", "password": "pw123"})
    res = client.post("/api/v1/auth/login", json={"username": "alice@example.com", "password": "pw123"})
    assert res.status_code == 200
    assert "token" in res.json()


def test_analyze_shape():
    res = client.post(
        "/api/v1/analyze",
        json={"review_text": "camera is excellent but battery drains fast"},
        headers=auth_headers(),
    )
    assert res.status_code == 200
    data = res.json()
    assert "overall_sentiment" in data
    assert "concerns" in data
    assert "ranked_concerns" in data


def test_stats_shape():
    res = client.get("/api/v1/stats", headers=auth_headers())
    assert res.status_code == 200
    data = res.json()
    assert "total_reviews" in data
    assert "sentiment_distribution" in data
    assert "ranked_concerns" in data