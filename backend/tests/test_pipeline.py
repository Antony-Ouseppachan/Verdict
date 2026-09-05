"""
Unit and Integration tests for Verdict Detection Pipeline.
"""

import pytest
from backend.models_manager.manager import model_manager
from backend.core.ssrf import validate_url_safety, SSRFValidationError
from backend.core.constants import compute_verdict, VERDICT_SAFE, VERDICT_SUSPICIOUS, VERDICT_HIGH_RISK
from backend.analyzers.url_analyzer import analyze_url
from backend.analyzers.html_analyzer import analyze_html
from backend.analyzers.payment_analyzer import analyze_payment
from backend.services.pipeline import pipeline_service


def test_model_manager_loading():
    """Verify that all 4 models and vectorizer load cleanly."""
    model_manager.load_models()
    assert model_manager.is_loaded is True
    assert model_manager.url_model is not None
    assert model_manager.url_vectorizer is not None
    assert model_manager.html_model is not None
    assert len(model_manager.html_feature_names) == 56
    assert model_manager.payment_model is not None
    assert len(model_manager.payment_feature_names) == 35
    assert model_manager.fusion_model is not None


def test_ssrf_blocking_private_addresses():
    """Verify SSRF protection blocks private, loopback, and disallowed protocols."""
    blocked_cases = [
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0",
        "http://192.168.1.1",
        "http://10.0.0.1/admin",
        "http://172.16.0.1",
        "file:///etc/passwd",
        "javascript:alert(1)",
        "ftp://example.com",
    ]
    for url in blocked_cases:
        with pytest.raises(SSRFValidationError):
            validate_url_safety(url)


def test_ssrf_permitting_public_urls():
    """Verify SSRF validation accepts valid public URLs."""
    url, host = validate_url_safety("https://github.com/security")
    assert url == "https://github.com/security"
    assert host == "github.com"


def test_url_analyzer_decision_score():
    """Verify URL character TF-IDF vectorizer + Linear SVM inference."""
    score, telemetry = analyze_url("https://paypal-security-verification.com/login")
    assert isinstance(score, float)
    assert telemetry["hostname"] == "paypal-security-verification.com"
    assert telemetry["is_https"] is True


def test_html_analyzer_inference():
    """Verify HTML feature extraction and XGBoost V2 prediction."""
    mock_html = """
    <html>
      <head><title>Secure Checkout</title></head>
      <body>
        <form action="https://gateway.example.com/pay" method="POST">
          <input name="card" placeholder="Card Number">
          <input name="cvv" placeholder="CVV">
          <button type="submit">Pay Now</button>
        </form>
      </body>
    </html>
    """
    prob, telemetry = analyze_html(mock_html, "https://example.com/checkout")
    assert 0.0 <= prob <= 1.0
    assert telemetry["form_count"] == 1


def test_payment_analyzer_inference():
    """Verify Payment feature extraction and XGBoost prediction."""
    mock_html = """
    <html>
      <body>
        <form action="https://external-malicious.com/steal" method="POST">
          <input name="card_number" placeholder="Card Number">
          <input name="cvv" placeholder="CVV">
          <input name="expiry" placeholder="MM/YY">
          <button>Pay Now with Razorpay</button>
        </form>
      </body>
    </html>
    """
    prob, telemetry = analyze_payment("https://example.com/pay", mock_html)
    assert 0.0 <= prob <= 1.0
    assert telemetry["card_input_detected"] is True
    assert telemetry["cvv_input_detected"] is True
    assert telemetry["external_form_action"] is True


def test_verdict_threshold_policy():
    """Verify verdict assignment matches centralized policy."""
    assert compute_verdict(0.15) == VERDICT_SAFE
    assert compute_verdict(0.299) == VERDICT_SAFE
    assert compute_verdict(0.30) == VERDICT_SUSPICIOUS
    assert compute_verdict(0.55) == VERDICT_SUSPICIOUS
    assert compute_verdict(0.70) == VERDICT_HIGH_RISK
    assert compute_verdict(0.98) == VERDICT_HIGH_RISK
