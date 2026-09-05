"""
Explainable Security Findings Engine.
Generates evidence-backed structured security findings strictly from genuine extracted signals.
"""

from typing import List, Dict, Any


def generate_security_findings(
    url_score: float,
    html_prob: float,
    payment_prob: float,
    final_risk_score: float,
    url_telemetry: Dict[str, Any],
    html_telemetry: Dict[str, Any],
    payment_telemetry: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Synthesize structured findings from concrete model telemetry and security signals.
    """
    findings: List[Dict[str, Any]] = []

    # ------------------------------------------------------------------
    # 1. URL & HOSTNAME FINDINGS
    # ------------------------------------------------------------------
    if url_score > 1.0:
        findings.append({
            "severity": "high",
            "category": "url",
            "title": "High-Risk URL Signature",
            "description": f"URL character n-gram pattern exhibits strong phishing indicators (SVM decision score: {url_score:.2f}).",
        })
    elif url_score > 0.3:
        findings.append({
            "severity": "medium",
            "category": "url",
            "title": "Suspicious URL Structure",
            "description": f"URL syntax and lexical traits deviate from legitimate web properties (SVM score: {url_score:.2f}).",
        })

    if url_telemetry.get("has_ip_host"):
        findings.append({
            "severity": "high",
            "category": "url",
            "title": "Direct IP Hostname Access",
            "description": "Website is hosted on a raw IP address rather than a registered domain name.",
        })

    if not url_telemetry.get("is_https"):
        findings.append({
            "severity": "high" if payment_telemetry.get("payment_detected") else "medium",
            "category": "network",
            "title": "Unencrypted HTTP Connection",
            "description": "Page does not use HTTPS encryption, exposing transmitted credentials and data to interception.",
        })

    if url_telemetry.get("num_hyphens", 0) >= 3 or url_telemetry.get("subdomain_count", 0) >= 3:
        findings.append({
            "severity": "low",
            "category": "url",
            "title": "Complex Domain Substructure",
            "description": f"Excessive hyphens ({url_telemetry.get('num_hyphens')}) or deep subdomain hierarchy ({url_telemetry.get('subdomain_count')}) detected.",
        })

    # ------------------------------------------------------------------
    # 2. PAYMENT FLOW & CREDENTIAL EXFILTRATION FINDINGS
    # ------------------------------------------------------------------
    if payment_telemetry.get("external_form_action"):
        findings.append({
            "severity": "high",
            "category": "payment",
            "title": "External Form Exfiltration",
            "description": "Form action posts user input directly to a third-party domain outside the originating website.",
        })

    if payment_telemetry.get("sensitive_payment_combo"):
        findings.append({
            "severity": "high",
            "category": "payment",
            "title": "Direct Payment Card Capture",
            "description": "Page directly captures sensitive credit card credentials (card number, CVV, expiry) without PCI-DSS iframe sandboxing.",
        })

    if payment_telemetry.get("otp_payment_combo"):
        findings.append({
            "severity": "high",
            "category": "payment",
            "title": "Co-located OTP and Payment Credential Fields",
            "description": "Page prompts for One-Time Password (OTP) in conjunction with payment details, a pattern typical of session interception.",
        })

    if payment_telemetry.get("provider_mismatch"):
        providers = ", ".join(payment_telemetry.get("detected_providers", [])) or "Payment Brand"
        findings.append({
            "severity": "high",
            "category": "brand",
            "title": "Payment Provider Mismatch",
            "description": f"Page references official payment brand ({providers}) without verified gateway integration endpoints.",
        })

    if payment_telemetry.get("external_iframe_detected") and payment_telemetry.get("payment_detected"):
        findings.append({
            "severity": "medium",
            "category": "payment",
            "title": "External Checkout Iframe Embedded",
            "description": "Payment process relies on an external third-party iframe frame.",
        })

    # ------------------------------------------------------------------
    # 3. HTML / DOM & JAVASCRIPT OBFUSCATION FINDINGS
    # ------------------------------------------------------------------
    raw_html_feats = html_telemetry.get("raw_features", {})

    if raw_html_feats.get("eval_count", 0) > 0 or raw_html_feats.get("atob_count", 0) > 0:
        eval_c = raw_html_feats.get("eval_count", 0)
        atob_c = raw_html_feats.get("atob_count", 0)
        findings.append({
            "severity": "medium",
            "category": "code",
            "title": "Dynamic Code Execution (eval/atob)",
            "description": f"Detected dynamic evaluation scripts (eval: {eval_c}, atob: {atob_c}) commonly used to conceal payload logic.",
        })

    if raw_html_feats.get("base64_count", 0) >= 3:
        findings.append({
            "severity": "medium",
            "category": "code",
            "title": "High Density of Encoded Strings",
            "description": f"Found {raw_html_feats.get('base64_count')} Base64-encoded strings within client markup.",
        })

    if raw_html_feats.get("meta_refresh", 0) > 0:
        findings.append({
            "severity": "medium",
            "category": "html",
            "title": "Client-Side Meta Refresh Redirect",
            "description": "Page contains meta http-equiv refresh directives used in rapid redirect chains.",
        })

    if raw_html_feats.get("external_link_ratio", 0) > 0.8 and raw_html_feats.get("link_count", 0) >= 5:
        findings.append({
            "severity": "low",
            "category": "html",
            "title": "High External Asset Dependency",
            "description": f"{raw_html_feats.get('external_link_ratio') * 100:.0f}% of page hyperlinks point to external domains.",
        })

    # ------------------------------------------------------------------
    # 4. NOMINAL / BASELINE FINDING (For Clean Websites)
    # ------------------------------------------------------------------
    if not findings and final_risk_score < 0.30:
        findings.append({
            "severity": "low",
            "category": "security",
            "title": "Standard Security Baseline",
            "description": "Secure HTTPS communication verified with zero credential exfiltration or deceptive payment signatures detected.",
        })

    return findings
