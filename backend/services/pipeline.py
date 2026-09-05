"""
End-to-End Verdict Detection Pipeline Service.
Orchestrates URL SVM, HTML XGBoost, Payment XGBoost, and Fusion Risk Engine.
"""

import time
import pandas as pd
from typing import Dict, Any, Tuple

from ..core.constants import (
    compute_verdict,
    FUSION_FEATURE_NAMES,
)
from ..core.fetcher import fetcher
from ..core.ssrf import validate_url_safety
from ..models_manager.manager import model_manager
from ..analyzers.url_analyzer import analyze_url
from ..analyzers.html_analyzer import analyze_html
from ..analyzers.payment_analyzer import analyze_payment
from ..analyzers.findings_engine import generate_security_findings
from ..schemas.api import (
    AnalyzeResponse,
    ModelScores,
    SecurityFinding,
    PaymentAnalysis,
)


class DetectionPipelineService:
    """Production detection pipeline coordinating all models and feature analyzers."""

    def __init__(self):
        # Ensure models are loaded
        if not model_manager.is_loaded:
            model_manager.load_models()

    def analyze(self, target_url: str) -> AnalyzeResponse:
        """
        Execute full detection pipeline on a URL.
        """
        start_time = time.time()

        # Step 1: Pre-validate URL and check SSRF
        normalized_url, hostname = validate_url_safety(target_url)

        # Step 2: URL Model Analysis (Linear SVM + Char TF-IDF)
        url_score, url_telemetry = analyze_url(normalized_url)

        # Step 3: Fetch HTML Content safely
        try:
            html_content, final_url, status_code, fetch_duration = fetcher.fetch(normalized_url)
        except Exception:
            html_content = ""
            final_url = normalized_url
            status_code = 0
            fetch_duration = 0.0

        # Step 4: HTML Model Analysis (XGBoost V2)
        html_prob, html_telemetry = analyze_html(html_content, final_url)

        # Step 5: Payment Model Analysis (XGBoost)
        payment_prob, payment_telemetry = analyze_payment(final_url, html_content)

        # Step 6: Fusion Risk Engine (Logistic Regression)
        fusion_input = pd.DataFrame([{
            "url_score": url_score,
            "html_prob": html_prob,
            "payment_prob": payment_prob,
        }])[FUSION_FEATURE_NAMES]

        final_probs = model_manager.fusion_model.predict_proba(fusion_input)[0]
        final_risk_score = float(final_probs[1])

        # Step 7: Verdict Assignment (Centralized Threshold Policy)
        verdict = compute_verdict(final_risk_score)

        # Step 8: Explainable Security Findings Synthesis
        raw_findings = generate_security_findings(
            url_score=url_score,
            html_prob=html_prob,
            payment_prob=payment_prob,
            final_risk_score=final_risk_score,
            url_telemetry=url_telemetry,
            html_telemetry=html_telemetry,
            payment_telemetry=payment_telemetry,
        )

        findings = [SecurityFinding(**f) for f in raw_findings]

        # Step 9: Payment Analysis Structure
        payment_analysis = PaymentAnalysis(
            paymentDetected=payment_telemetry.get("payment_detected", False),
            cardInput=payment_telemetry.get("card_input_detected", False),
            cvvInput=payment_telemetry.get("cvv_input_detected", False),
            expiryInput=payment_telemetry.get("expiry_input_detected", False),
            upiInput=payment_telemetry.get("upi_input_detected", False),
            otpInput=payment_telemetry.get("otp_input_detected", False),
            externalForm=payment_telemetry.get("external_form_action", False),
            externalIframe=payment_telemetry.get("external_iframe_detected", False),
            providerDetected=payment_telemetry.get("provider_detected"),
            detectedProviders=payment_telemetry.get("detected_providers", []),
            providerMismatch=payment_telemetry.get("provider_mismatch", False),
            sensitivePaymentCombo=payment_telemetry.get("sensitive_payment_combo", False),
            otpPaymentCombo=payment_telemetry.get("otp_payment_combo", False),
        )

        total_duration = time.time() - start_time
        now_ms = int(time.time() * 1000)
        request_id = f"req-{now_ms}"

        # Extension compatible decision payload
        if verdict == "HIGH RISK":
            decision_status = "DANGER"
            decision_action = "GO_BACK"
            decision_title = "High Risk Threat Detected"
            decision_message = "Critical phishing or credential exfiltration signatures detected."
        elif verdict == "SUSPICIOUS":
            decision_status = "CAUTION"
            decision_action = "WARN"
            decision_title = "Suspicious Target Detected"
            decision_message = "Anomalous DOM or payment vectors detected. Caution advised."
        else:
            decision_status = "SAFE"
            decision_action = "NONE"
            decision_title = "Safe"
            decision_message = "No threat detected."

        decision_payload = {
            "status": decision_status,
            "title": decision_title,
            "message": decision_message,
            "action": decision_action,
            "explanationAvailable": True,
            "decisionId": f"dec-{now_ms}",
            "timestamp": now_ms,
            "reasons": [
                {
                    "signal": f.category,
                    "severity": f.severity.upper() if f.severity.upper() in ["HIGH", "MEDIUM", "LOW"] else "LOW",
                    "evidence": f.title,
                }
                for f in findings
            ],
            "pageType": "NORMAL_WEBSITE",
        }

        return AnalyzeResponse(
            success=True,
            url=normalized_url,
            finalUrl=final_url,
            verdict=verdict,
            riskScore=round(final_risk_score, 4),
            models=ModelScores(
                urlScore=round(url_score, 4),
                htmlProbability=round(html_prob, 4),
                paymentProbability=round(payment_prob, 4),
            ),
            findings=findings,
            analysis=payment_analysis,
            telemetry={
                "url": url_telemetry,
                "html": {
                    "length": html_telemetry.get("html_length"),
                    "formCount": html_telemetry.get("form_count"),
                    "inputCount": html_telemetry.get("input_count"),
                    "iframeCount": html_telemetry.get("iframe_count"),
                    "scriptCount": html_telemetry.get("script_count"),
                },
                "httpStatus": status_code,
                "fetchDurationSeconds": round(fetch_duration, 3),
            },
            scanDuration=round(total_duration, 3),
            decision=decision_payload,
            requestId=request_id,
        )


pipeline_service = DetectionPipelineService()
