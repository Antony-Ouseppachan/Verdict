"""
URL Feature Extraction and Linear SVM Inference.
"""

from urllib.parse import urlparse
import re
from typing import Dict, Any, Tuple

from ..models_manager.manager import model_manager


def analyze_url(url: str) -> Tuple[float, Dict[str, Any]]:
    """
    Run URL inference using character TF-IDF vectorizer + Linear SVM.
    Returns:
        (url_score: float, url_telemetry: Dict[str, Any])
    """
    if not model_manager.is_loaded:
        model_manager.load_models()

    url_str = str(url or "").strip()
    
    # 1. TF-IDF Character Vectorization
    X_vec = model_manager.url_vectorizer.transform([url_str])

    # 2. Linear SVM Raw Decision Function Score
    raw_decision = model_manager.url_model.decision_function(X_vec)
    url_score = float(raw_decision[0])

    # 3. Structural Telemetry for reporting
    try:
        parsed = urlparse(url_str)
        hostname = parsed.hostname or ""
        path = parsed.path or ""
        query = parsed.query or ""
    except Exception:
        hostname = ""
        path = ""
        query = ""

    telemetry = {
        "url": url_str,
        "hostname": hostname,
        "scheme": parsed.scheme if 'parsed' in locals() else "",
        "length": len(url_str),
        "hostname_length": len(hostname),
        "num_dots": url_str.count("."),
        "num_hyphens": url_str.count("-"),
        "num_underscores": url_str.count("_"),
        "num_slashes": url_str.count("/"),
        "num_digits": sum(c.isdigit() for c in url_str),
        "has_ip_host": bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", hostname)),
        "is_https": url_str.lower().startswith("https://"),
        "subdomain_count": max(0, len(hostname.split(".")) - 2) if hostname else 0,
        "url_score": round(url_score, 4),
    }

    return url_score, telemetry
