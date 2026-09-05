"""
Configuration settings for the Verdict Detection Pipeline.
"""

import os
from pathlib import Path
from pydantic import BaseModel

# Resolve project root and models directory safely
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Default model directory
DEFAULT_MODELS_DIR = PROJECT_ROOT / "models"

class Settings(BaseModel):
    # Application Info
    APP_NAME: str = "Verdict Intelligence Engine"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Models Directory (Configurable via ENV or default to D:\BCA\Verdict\models)
    MODELS_DIR: Path = Path(os.getenv("VERDICT_MODELS_DIR", str(DEFAULT_MODELS_DIR)))

    # Model Filenames
    URL_MODEL_FILE: str = "url_phishing_svm.joblib"
    URL_VECTORIZER_FILE: str = "url_tfidf_vectorizer.joblib"
    HTML_MODEL_FILE: str = "html_phishing_xgboost_v2.joblib"
    PAYMENT_MODEL_FILE: str = "payment_risk_xgboost.joblib"
    FUSION_MODEL_FILE: str = "risk_engine_fusion.joblib"

    # Fetcher & Security Limits
    FETCH_TIMEOUT_SECONDS: float = 8.0
    FETCH_MAX_BYTES: int = 2 * 1024 * 1024  # 2 MB limit
    FETCH_MAX_REDIRECTS: int = 3
    FETCH_USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36 VerdictSecurity/2.0"
    )

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

settings = Settings()
