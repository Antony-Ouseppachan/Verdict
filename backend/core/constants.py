"""
Centralized constants, model feature lists, thresholds, and performance metrics for the Verdict Detection Pipeline.
"""

from typing import Dict, List, Pattern
import re

# ==============================================================================
# VERDICT THRESHOLD POLICY
# ==============================================================================
# 0.00–0.30 -> SAFE
# 0.30–0.70 -> SUSPICIOUS
# 0.70–1.00 -> HIGH RISK
VERDICT_SAFE_MAX = 0.30
VERDICT_SUSPICIOUS_MAX = 0.70

VERDICT_SAFE = "SAFE"
VERDICT_SUSPICIOUS = "SUSPICIOUS"
VERDICT_HIGH_RISK = "HIGH RISK"

def compute_verdict(risk_score: float) -> str:
    """Return normalized verdict string based on centralized risk score thresholds."""
    if risk_score < VERDICT_SAFE_MAX:
        return VERDICT_SAFE
    elif risk_score < VERDICT_SUSPICIOUS_MAX:
        return VERDICT_SUSPICIOUS
    else:
        return VERDICT_HIGH_RISK


# ==============================================================================
# BENCHMARK PERFORMANCE METRICS (Validated Test-Set Metrics)
# ==============================================================================
BENCHMARK_METRICS = {
    "url_model": {
        "name": "URL Intelligence (Linear SVM + Character TF-IDF)",
        "roc_auc": 0.9923,
        "features": 300000,
        "type": "LinearSVC",
    },
    "html_model": {
        "name": "Page Intelligence (XGBoost + HTML/DOM Security Features)",
        "roc_auc": 0.9910,
        "features": 56,
        "type": "XGBClassifier",
    },
    "payment_model": {
        "name": "Payment Intelligence (XGBoost + Payment-Specific Signals)",
        "roc_auc": 0.9376,
        "features": 35,
        "type": "XGBClassifier",
    },
    "risk_engine": {
        "name": "Risk Fusion Engine (Logistic Regression)",
        "accuracy": 0.9700,
        "precision": 0.9900,
        "recall": 0.9500,
        "f1_score": 0.9700,
        "roc_auc": 0.9964,
        "features": 3,
        "type": "LogisticRegression",
    }
}


# ==============================================================================
# FUSION MODEL FEATURE CONTRACT
# ==============================================================================
FUSION_FEATURE_NAMES = [
    "url_score",
    "html_prob",
    "payment_prob",
]


# ==============================================================================
# HTML MODEL 56 FEATURE CONTRACT (Exact training order)
# ==============================================================================
HTML_FEATURE_NAMES = [
    "html_length",
    "link_count",
    "script_count",
    "form_count",
    "input_count",
    "iframe_count",
    "image_count",
    "button_count",

    "external_links",
    "external_domains",
    "external_link_ratio",
    "external_scripts",
    "external_script_ratio",
    "external_iframes",
    "external_iframe_ratio",
    "external_forms",

    "password_inputs",
    "hidden_inputs",
    "card_inputs",
    "cvv_inputs",
    "otp_inputs",

    "payment_keywords",
    "login_keywords",
    "suspicious_keywords",

    "eval_count",
    "atob_count",
    "fetch_count",
    "xhr_count",
    "document_write_count",
    "base64_count",

    "meta_refresh",
    "fixed_elements",
    "zindex_elements",

    "provider_mentions",

    "object_count",
    "embed_count",
    "video_count",
    "canvas_count",
    "svg_count",

    "url_length",
    "hostname_length",
    "url_dots",
    "url_hyphens",
    "url_underscores",
    "url_slashes",
    "url_questions",
    "url_equals",
    "url_at",
    "url_percent",
    "url_digits",
    "url_special_chars",
    "https",
    "ip_hostname",
    "subdomain_count",
    "path_length",
    "query_length",
]


# ==============================================================================
# PAYMENT MODEL 35 FEATURE CONTRACT (Exact training order)
# ==============================================================================
PAYMENT_FEATURE_NAMES = [
    "https",
    "hostname_length",
    "payment_form_present",
    "card_input",
    "cvv_input",
    "expiry_input",
    "upi_input",
    "otp_input",
    "payment_word_count",
    "card_word_count",
    "cvv_word_count",
    "expiry_word_count",
    "upi_word_count",
    "otp_word_count",
    "form_count",
    "input_count",
    "button_count",
    "form_domain_count",
    "external_form",
    "iframe_count",
    "iframe_domain_count",
    "external_iframe",
    "provider_count",
    "provider_page_count",
    "provider_domain_match",
    "provider_mismatch",
    "card_cvv_combo",
    "card_expiry_combo",
    "sensitive_payment_combo",
    "otp_payment_combo",
    "script_count",
    "redirect_count",
    "eval_count",
    "base64_count",
    "html_length",
]


# ==============================================================================
# PAYMENT PATTERNS & PROVIDER DICTIONARIES
# ==============================================================================
PAYMENT_WORDS: List[str] = [
    "checkout",
    "pay now",
    "paynow",
    "billing address",
    "billing",
    "card payment",
    "credit card",
    "debit card",
    "card number",
    "payment method",
]

CARD_PATTERNS: List[str] = [
    r"card[\s_-]*number",
    r"credit[\s_-]*card",
    r"debit[\s_-]*card",
    r"cc[\s_-]*number",
]

CVV_PATTERNS: List[str] = [
    r"\bcvv\b",
    r"\bcvc\b",
    r"security[\s_-]*code",
]

EXPIRY_PATTERNS: List[str] = [
    r"expir",
    r"exp[\s_-]*date",
    r"expiration",
]

UPI_PATTERNS: List[str] = [
    r"\bupi\b",
    r"upi[\s_-]*id",
    r"\bvpa\b",
]

OTP_PATTERNS: List[str] = [
    r"\botp\b",
    r"one[\s_-]*time[\s_-]*password",
    r"verification[\s_-]*code",
]

PAYMENT_PROVIDERS: Dict[str, List[str]] = {
    "razorpay": ["razorpay.com", "razorpay"],
    "stripe": ["stripe.com", "stripe"],
    "paypal": ["paypal.com", "paypal"],
    "payu": ["payu.in", "payu.com"],
    "cashfree": ["cashfree.com", "cashfree"],
    "phonepe": ["phonepe.com", "phonepe"],
    "googlepay": ["pay.google.com", "google pay", "gpay"],
    "amazonpay": ["amazonpay.com", "amazon pay"],
}

HTML_PAYMENT_WORDS: List[str] = [
    "payment", "pay now", "checkout", "upi",
    "credit card", "debit card", "card number",
    "cvv", "cvc", "expiry", "expiration",
    "bank account", "net banking", "transaction"
]

HTML_LOGIN_WORDS: List[str] = [
    "login", "log in", "sign in", "password",
    "username", "account", "verify", "verification",
    "otp", "one time password"
]

HTML_SUSPICIOUS_WORDS: List[str] = [
    "urgent", "suspended", "locked", "security alert",
    "confirm identity", "update payment", "unauthorized",
    "action required", "billing issue", "restore account"
]

HTML_PROVIDERS_LIST: List[str] = [
    "razorpay", "stripe", "paypal",
    "cashfree", "payu", "square",
    "adyen", "authorize.net"
]
