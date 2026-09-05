"""
FastAPI HTTP Endpoint Tests.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["modelsLoaded"] is True
    assert "url_model" in data["benchmarkMetrics"]
    assert "html_model" in data["benchmarkMetrics"]
    assert "payment_model" in data["benchmarkMetrics"]
    assert "risk_engine" in data["benchmarkMetrics"]


def test_analyze_empty_url():
    response = client.post("/api/analyze", json={"url": ""})
    assert response.status_code == 400


def test_analyze_ssrf_blocked():
    response = client.post("/api/analyze", json={"url": "http://127.0.0.1:8000"})
    assert response.status_code == 422
    assert "SSRF Protection Blocked" in response.json()["detail"]


def test_analyze_public_safe_domain():
    # Test on a real known public domain
    response = client.post("/api/analyze", json={"url": "https://example.com"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["verdict"] in ("SAFE", "SUSPICIOUS", "HIGH RISK")
    assert "models" in data
    assert "urlScore" in data["models"]
    assert "htmlProbability" in data["models"]
    assert "paymentProbability" in data["models"]
    assert isinstance(data["riskScore"], float)
    assert isinstance(data["findings"], list)
