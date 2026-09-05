"""
Payment Feature Extraction and XGBoost Inference.
"""

import re
import pandas as pd
from urllib.parse import urlparse
from typing import Dict, Any, Tuple, List, Set

from ..core.constants import (
    PAYMENT_FEATURE_NAMES,
    PAYMENT_WORDS,
    CARD_PATTERNS,
    CVV_PATTERNS,
    EXPIRY_PATTERNS,
    UPI_PATTERNS,
    OTP_PATTERNS,
    PAYMENT_PROVIDERS,
)
from ..models_manager.manager import model_manager


def _regex_count(text: str, patterns: List[str]) -> int:
    return sum(len(re.findall(p, text, re.I)) for p in patterns)


def _regex_exists(text: str, patterns: List[str]) -> int:
    return int(any(re.search(p, text, re.I) for p in patterns))


def _extract_domains(html: str) -> Set[str]:
    urls = re.findall(r'https?://[^\s"\'<>]+', html, re.I)
    domains = set()
    for u in urls:
        try:
            domain = urlparse(u).netloc.lower()
            domain = domain.split("@")[-1].split(":")[0]
            if domain:
                domains.add(domain)
        except Exception:
            pass
    return domains


def _extract_payment_components(html: str) -> str:
    """Extract HTML components likely related to payment input."""
    components = []
    forms = re.findall(r"<form\b.*?</form>", html, re.I | re.S)
    components.extend(forms)
    inputs = re.findall(r"<input\b[^>]*>", html, re.I)
    components.extend(inputs)
    buttons = re.findall(r"<button\b.*?</button>", html, re.I | re.S)
    components.extend(buttons)
    labels = re.findall(r"<label\b.*?</label>", html, re.I | re.S)
    components.extend(labels)
    return " ".join(components)


def _extract_form_actions(html: str) -> List[str]:
    return re.findall(r'<form[^>]+action\s*=\s*["\']([^"\']+)["\']', html, re.I)


def _extract_iframe_sources(html: str) -> List[str]:
    return re.findall(r'<iframe[^>]+src\s*=\s*["\']([^"\']+)["\']', html, re.I)


def _detect_providers(text: str) -> List[str]:
    detected = []
    text_lower = text.lower()
    for provider, identifiers in PAYMENT_PROVIDERS.items():
        for identifier in identifiers:
            if identifier.lower() in text_lower:
                detected.append(provider)
                break
    return sorted(set(detected))


def extract_payment_features_dict(url: str, html: str) -> Dict[str, Any]:
    """
    Extract 35 payment features matching payment XGBoost training contract.
    """
    html_raw = str(html or "")
    html_low = html_raw.lower()[:2_000_000]

    parsed = urlparse(url or "")
    hostname = (parsed.hostname or "").lower()

    # Components
    payment_components = _extract_payment_components(html_low)

    forms = re.findall(r"<form\b.*?</form>", html_low, re.I | re.S)
    inputs = re.findall(r"<input\b[^>]*>", html_low, re.I)
    buttons = re.findall(r"<button\b.*?</button>", html_low, re.I | re.S)

    # Inputs
    card_input = _regex_exists(payment_components, CARD_PATTERNS)
    cvv_input = _regex_exists(payment_components, CVV_PATTERNS)
    expiry_input = _regex_exists(payment_components, EXPIRY_PATTERNS)
    upi_input = _regex_exists(payment_components, UPI_PATTERNS)
    otp_input = _regex_exists(payment_components, OTP_PATTERNS)

    # Word counts
    payment_word_count = _regex_count(payment_components, PAYMENT_WORDS)
    card_word_count = _regex_count(payment_components, CARD_PATTERNS)
    cvv_word_count = _regex_count(payment_components, CVV_PATTERNS)
    expiry_word_count = _regex_count(payment_components, EXPIRY_PATTERNS)
    upi_word_count = _regex_count(payment_components, UPI_PATTERNS)
    otp_word_count = _regex_count(payment_components, OTP_PATTERNS)

    # Strong definition of payment form presence
    payment_form_present = int(
        card_input or cvv_input or expiry_input or upi_input or (payment_word_count >= 2 and len(forms) > 0)
    )

    # Form actions
    form_actions = _extract_form_actions(html_low)
    form_domains = set()
    for action in form_actions:
        try:
            if action.startswith("http"):
                dom = urlparse(action).netloc.lower()
                if dom:
                    form_domains.add(dom)
        except Exception:
            pass

    external_form = int(any(hostname not in dom for dom in form_domains))

    # Iframes
    iframe_sources = _extract_iframe_sources(html_low)
    iframe_domains = set()
    for src in iframe_sources:
        try:
            if src.startswith("http"):
                dom = urlparse(src).netloc.lower()
                if dom:
                    iframe_domains.add(dom)
        except Exception:
            pass

    external_iframe = int(len(iframe_domains) > 0)

    # Providers
    providers = _detect_providers(payment_components)
    provider_count = len(providers)

    all_providers = _detect_providers(html_low)
    provider_page_count = len(all_providers)

    # Domain match
    provider_domain_match = 0
    all_domains = _extract_domains(html_low)

    for provider in providers:
        identifiers = PAYMENT_PROVIDERS[provider]
        for domain in all_domains:
            for identifier in identifiers:
                if identifier in domain:
                    provider_domain_match += 1
                    break

    provider_mismatch = int(provider_count > 0 and provider_domain_match == 0)

    # Combinations
    card_cvv_combo = int(card_input and cvv_input)
    card_expiry_combo = int(card_input and expiry_input)
    sensitive_payment_combo = int(payment_form_present and (card_input or cvv_input or upi_input))
    otp_payment_combo = int(payment_form_present and otp_input)

    # JS
    script_count = len(re.findall(r"<script\b", html_low, re.I))
    redirect_count = len(
        re.findall(r"window\.location|location\.href|location\.replace|location\.assign", html_low, re.I)
    )
    eval_count = len(re.findall(r"\beval\s*\(", html_low, re.I))
    base64_count = len(re.findall(r"base64|atob\s*\(", html_low, re.I))

    features = {
        "https": int(parsed.scheme.lower() == "https"),
        "hostname_length": len(hostname),

        # Actual payment signals
        "payment_form_present": payment_form_present,
        "card_input": card_input,
        "cvv_input": cvv_input,
        "expiry_input": expiry_input,
        "upi_input": upi_input,
        "otp_input": otp_input,

        "payment_word_count": payment_word_count,
        "card_word_count": card_word_count,
        "cvv_word_count": cvv_word_count,
        "expiry_word_count": expiry_word_count,
        "upi_word_count": upi_word_count,
        "otp_word_count": otp_word_count,

        # Forms
        "form_count": len(forms),
        "input_count": len(inputs),
        "button_count": len(buttons),

        # Network structure
        "form_domain_count": len(form_domains),
        "external_form": external_form,
        "iframe_count": len(iframe_sources),
        "iframe_domain_count": len(iframe_domains),
        "external_iframe": external_iframe,

        # Providers
        "provider_count": provider_count,
        "provider_page_count": provider_page_count,
        "provider_domain_match": provider_domain_match,
        "provider_mismatch": provider_mismatch,

        # Important combinations
        "card_cvv_combo": card_cvv_combo,
        "card_expiry_combo": card_expiry_combo,
        "sensitive_payment_combo": sensitive_payment_combo,
        "otp_payment_combo": otp_payment_combo,

        # JS
        "script_count": script_count,
        "redirect_count": redirect_count,
        "eval_count": eval_count,
        "base64_count": base64_count,

        # Page
        "html_length": len(html_raw),
    }

    return features


def analyze_payment(url: str, html: str) -> Tuple[float, Dict[str, Any]]:
    """
    Run Payment Risk inference using Payment XGBoost.
    Returns:
        (payment_prob: float, telemetry: Dict[str, Any])
    """
    if not model_manager.is_loaded:
        model_manager.load_models()

    features_dict = extract_payment_features_dict(url, html)
    feature_names = model_manager.payment_feature_names

    # Build DataFrame in exact feature order
    feature_values = [features_dict.get(f, 0) for f in feature_names]
    X_df = pd.DataFrame([feature_values], columns=feature_names)

    # Predict
    probs = model_manager.payment_model.predict_proba(X_df)[0]
    payment_prob = float(probs[1])

    detected_providers = _detect_providers(_extract_payment_components(html.lower() if html else ""))
    all_page_providers = _detect_providers(html.lower() if html else "")

    telemetry = {
        "payment_probability": round(payment_prob, 4),
        "payment_detected": bool(features_dict["payment_form_present"] or features_dict["payment_word_count"] > 0),
        "card_input_detected": bool(features_dict["card_input"]),
        "cvv_input_detected": bool(features_dict["cvv_input"]),
        "expiry_input_detected": bool(features_dict["expiry_input"]),
        "upi_input_detected": bool(features_dict["upi_input"]),
        "otp_input_detected": bool(features_dict["otp_input"]),
        "external_form_action": bool(features_dict["external_form"]),
        "external_iframe_detected": bool(features_dict["external_iframe"]),
        "provider_detected": detected_providers[0] if detected_providers else (all_page_providers[0] if all_page_providers else None),
        "detected_providers": sorted(set(detected_providers + all_page_providers)),
        "provider_mismatch": bool(features_dict["provider_mismatch"]),
        "sensitive_payment_combo": bool(features_dict["sensitive_payment_combo"]),
        "otp_payment_combo": bool(features_dict["otp_payment_combo"]),
        "raw_features": features_dict,
    }

    return payment_prob, telemetry
