"""
HTML DOM and Security Feature Extraction and XGBoost V2 Inference.
"""

import re
import pandas as pd
from urllib.parse import urlparse
from typing import Dict, Any, Tuple, List

from ..core.constants import (
    HTML_FEATURE_NAMES,
    HTML_PAYMENT_WORDS,
    HTML_LOGIN_WORDS,
    HTML_SUSPICIOUS_WORDS,
    HTML_PROVIDERS_LIST,
)
from ..models_manager.manager import model_manager


def extract_html_features(html: str, page_url: str) -> List[Any]:
    """
    Extract exact 56 HTML & DOM features matching training contract.
    """
    html = str(html) if html else ""
    low = html.lower()

    # Basic DOM element counts
    links = re.findall(r"<a\b[^>]*>", low)
    scripts = re.findall(r"<script\b[^>]*>", low)
    forms = re.findall(r"<form\b[^>]*>", low)
    inputs = re.findall(r"<input\b[^>]*>", low)
    iframes = re.findall(r"<iframe\b[^>]*>", low)
    images = re.findall(r"<img\b[^>]*>", low)
    buttons = re.findall(r"<button\b[^>]*>", low)

    # External resource analysis
    page_host = ""
    try:
        page_host = urlparse(page_url).hostname or ""
    except Exception:
        pass

    hrefs = re.findall(r'''(?:href|src)\s*=\s*["']([^"']+)["']''', low)

    external = 0
    external_domains = set()

    for x in hrefs:
        if x.startswith(("http://", "https://")):
            try:
                host = urlparse(x).hostname or ""
                if host and host != page_host:
                    external += 1
                    external_domains.add(host)
            except Exception:
                pass

    # Keyword frequencies
    payment_count = sum(low.count(w) for w in HTML_PAYMENT_WORDS)
    login_count = sum(low.count(w) for w in HTML_LOGIN_WORDS)
    suspicious_count = sum(low.count(w) for w in HTML_SUSPICIOUS_WORDS)

    # Specific input types
    password_inputs = len(re.findall(r'type\s*=\s*["\']password["\']', low))
    hidden_inputs = len(re.findall(r'type\s*=\s*["\']hidden["\']', low))

    card_inputs = int(re.search(r"card|credit|debit", low) is not None)
    cvv_inputs = int(re.search(r"cvv|cvc|security code", low) is not None)
    otp_inputs = int(re.search(r"otp|one time password", low) is not None)

    # Form actions
    form_actions = re.findall(r'''<form[^>]*action\s*=\s*["']([^"']+)["']''', low)
    external_forms = 0

    for action in form_actions:
        if action.startswith(("http://", "https://")):
            try:
                host = urlparse(action).hostname or ""
                if host and host != page_host:
                    external_forms += 1
            except Exception:
                pass

    # Iframe information
    iframe_srcs = re.findall(r'''<iframe[^>]*src\s*=\s*["']([^"']+)["']''', low)
    external_iframes = 0

    for src in iframe_srcs:
        if src.startswith(("http://", "https://")):
            try:
                host = urlparse(src).hostname or ""
                if host and host != page_host:
                    external_iframes += 1
            except Exception:
                pass

    # Script information
    external_scripts = 0
    for src in re.findall(r'''<script[^>]*src\s*=\s*["']([^"']+)["']''', low):
        if src.startswith(("http://", "https://")):
            try:
                host = urlparse(src).hostname or ""
                if host and host != page_host:
                    external_scripts += 1
            except Exception:
                pass

    # JavaScript / Obfuscation indicators
    eval_count = len(re.findall(r"\beval\s*\(", low))
    atob_count = len(re.findall(r"\batob\s*\(", low))
    fetch_count = len(re.findall(r"\bfetch\s*\(", low))
    xhr_count = len(re.findall(r"xmlhttprequest", low))
    document_write_count = len(re.findall(r"document\.write", low))
    base64_count = len(re.findall(r"[A-Za-z0-9+/]{40,}={0,2}", html))

    # Redirect / overlay indicators
    meta_refresh = len(re.findall(r'<meta[^>]*http-equiv\s*=\s*["\']?refresh', low))
    fixed_count = len(re.findall(r"position\s*:\s*fixed", low))
    zindex_count = len(re.findall(r"z-index\s*:", low))

    # Provider mentions
    provider_mentions = sum(low.count(x) for x in HTML_PROVIDERS_LIST)

    # Ratios
    total_links = len(hrefs)
    external_ratio = external / max(total_links, 1)
    external_script_ratio = external_scripts / max(len(scripts), 1)
    external_iframe_ratio = external_iframes / max(len(iframes), 1)

    # Embedded URL features
    url = str(page_url) if page_url else ""
    try:
        p = urlparse(url)
        host = p.hostname or ""
    except Exception:
        p = None
        host = ""

    digits = sum(c.isdigit() for c in url)
    special = sum(not c.isalnum() for c in url)

    url_feats = [
        len(url),
        len(host),
        url.count("."),
        url.count("-"),
        url.count("_"),
        url.count("/"),
        url.count("?"),
        url.count("="),
        url.count("@"),
        url.count("%"),
        digits,
        special,
        int(url.lower().startswith("https://")),
        int(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host or "") is not None),
        len(host.split(".")),
        len(p.path) if p else 0,
        len(p.query) if p else 0,
    ]

    return [
        len(html),
        len(links),
        len(scripts),
        len(forms),
        len(inputs),
        len(iframes),
        len(images),
        len(buttons),
        external,
        len(external_domains),
        external_ratio,
        external_scripts,
        external_script_ratio,
        external_iframes,
        external_iframe_ratio,
        external_forms,
        password_inputs,
        hidden_inputs,
        card_inputs,
        cvv_inputs,
        otp_inputs,
        payment_count,
        login_count,
        suspicious_count,
        eval_count,
        atob_count,
        fetch_count,
        xhr_count,
        document_write_count,
        base64_count,
        meta_refresh,
        fixed_count,
        zindex_count,
        provider_mentions,
        html.count("<object"),
        html.count("<embed"),
        html.count("<video"),
        html.count("<canvas"),
        html.count("<svg"),
        *url_feats,
    ]


def analyze_html(html: str, page_url: str) -> Tuple[float, Dict[str, Any]]:
    """
    Run HTML inference using XGBoost V2.
    Returns:
        (html_prob: float, telemetry: Dict[str, Any])
    """
    if not model_manager.is_loaded:
        model_manager.load_models()

    feature_values = extract_html_features(html, page_url)
    feature_names = model_manager.html_feature_names

    if len(feature_values) != len(feature_names):
        raise ValueError(
            f"HTML feature count mismatch: extracted {len(feature_values)}, expected {len(feature_names)}"
        )

    # Build DataFrame matching feature contract
    X_df = pd.DataFrame([feature_values], columns=feature_names)

    # Run prediction
    probs = model_manager.html_model.predict_proba(X_df)[0]
    html_prob = float(probs[1])

    features_dict = dict(zip(feature_names, feature_values))

    telemetry = {
        "html_probability": round(html_prob, 4),
        "html_length": features_dict.get("html_length", 0),
        "form_count": features_dict.get("form_count", 0),
        "input_count": features_dict.get("input_count", 0),
        "iframe_count": features_dict.get("iframe_count", 0),
        "script_count": features_dict.get("script_count", 0),
        "external_domains_count": features_dict.get("external_domains", 0),
        "external_forms": features_dict.get("external_forms", 0),
        "external_iframes": features_dict.get("external_iframes", 0),
        "password_inputs": features_dict.get("password_inputs", 0),
        "eval_count": features_dict.get("eval_count", 0),
        "base64_count": features_dict.get("base64_count", 0),
        "raw_features": features_dict,
    }

    return html_prob, telemetry
