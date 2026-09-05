"""
Centralized Model Manager. Loads models once at application startup with strict validation.
"""

import os
import joblib
import logging
from typing import Dict, Any, Tuple, List, Optional
from pathlib import Path

from ..core.config import settings
from ..core.constants import HTML_FEATURE_NAMES, PAYMENT_FEATURE_NAMES, FUSION_FEATURE_NAMES

logger = logging.getLogger("verdict.models")


class ModelManagerError(Exception):
    """Raised when models fail to load or validate."""
    pass


class ModelManager:
    """Singleton model manager for loading and serving the four Verdict detection models."""

    _instance: Optional["ModelManager"] = None

    def __init__(self):
        self.url_model = None
        self.url_vectorizer = None
        self.html_model = None
        self.html_feature_names: List[str] = []
        self.payment_model = None
        self.payment_feature_names: List[str] = []
        self.fusion_model = None
        self._is_loaded = False

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load_models(self) -> None:
        """Load and strictly validate all four models at application startup."""
        if self._is_loaded:
            return

        models_dir: Path = settings.MODELS_DIR
        print(f"\n[INFO] Initializing Verdict Model Manager from: {models_dir.resolve()}")

        if not models_dir.exists():
            raise ModelManagerError(f"Models directory not found at: {models_dir.resolve()}")

        # ------------------------------------------------------------------
        # 1. Load URL TF-IDF Vectorizer and Linear SVM Model
        # ------------------------------------------------------------------
        url_model_path = models_dir / settings.URL_MODEL_FILE
        url_vec_path = models_dir / settings.URL_VECTORIZER_FILE

        if not url_model_path.exists():
            raise ModelManagerError(f"URL Model file not found: {url_model_path}")
        if not url_vec_path.exists():
            raise ModelManagerError(f"URL Vectorizer file not found: {url_vec_path}")

        try:
            self.url_model = joblib.load(url_model_path)
            self.url_vectorizer = joblib.load(url_vec_path)
            
            # Validation
            if not hasattr(self.url_model, "decision_function"):
                raise ModelManagerError("URL model missing decision_function method (expected LinearSVC).")
            if not hasattr(self.url_vectorizer, "transform"):
                raise ModelManagerError("URL vectorizer missing transform method.")
            
            print("[OK] URL model loaded (LinearSVC + Character TF-IDF Vectorizer)")
        except Exception as e:
            raise ModelManagerError(f"Failed to load URL model/vectorizer: {e}")

        # ------------------------------------------------------------------
        # 2. Load HTML Phishing XGBoost V2 Model
        # ------------------------------------------------------------------
        html_model_path = models_dir / settings.HTML_MODEL_FILE
        if not html_model_path.exists():
            raise ModelManagerError(f"HTML Model file not found: {html_model_path}")

        try:
            self.html_model = joblib.load(html_model_path)
            
            # Validation
            if not hasattr(self.html_model, "predict_proba"):
                raise ModelManagerError("HTML model missing predict_proba method (expected XGBClassifier).")
            
            # Enforce exact feature count and ordering
            model_features = getattr(self.html_model, "feature_names_in_", None)
            if model_features is not None:
                self.html_feature_names = list(model_features)
            else:
                self.html_feature_names = list(HTML_FEATURE_NAMES)
                
            if len(self.html_feature_names) != 56:
                raise ModelManagerError(f"Expected 56 HTML features, but found {len(self.html_feature_names)}")
                
            print(f"[OK] HTML model loaded (XGBoost V2 with {len(self.html_feature_names)} features)")
        except Exception as e:
            raise ModelManagerError(f"Failed to load HTML model: {e}")

        # ------------------------------------------------------------------
        # 3. Load Payment Risk XGBoost Model
        # ------------------------------------------------------------------
        payment_model_path = models_dir / settings.PAYMENT_MODEL_FILE
        if not payment_model_path.exists():
            raise ModelManagerError(f"Payment Model file not found: {payment_model_path}")

        try:
            payment_obj = joblib.load(payment_model_path)
            if isinstance(payment_obj, dict):
                self.payment_model = payment_obj["model"]
                self.payment_feature_names = payment_obj.get("features", PAYMENT_FEATURE_NAMES)
            else:
                self.payment_model = payment_obj
                self.payment_feature_names = list(getattr(payment_obj, "feature_names_in_", PAYMENT_FEATURE_NAMES))

            if not hasattr(self.payment_model, "predict_proba"):
                raise ModelManagerError("Payment model missing predict_proba method (expected XGBClassifier).")
                
            if len(self.payment_feature_names) != 35:
                raise ModelManagerError(f"Expected 35 Payment features, but found {len(self.payment_feature_names)}")
                
            print(f"[OK] Payment model loaded (XGBoost with {len(self.payment_feature_names)} features)")
        except Exception as e:
            raise ModelManagerError(f"Failed to load Payment model: {e}")

        # ------------------------------------------------------------------
        # 4. Load Risk Engine Fusion Logistic Regression Model
        # ------------------------------------------------------------------
        fusion_model_path = models_dir / settings.FUSION_MODEL_FILE
        if not fusion_model_path.exists():
            raise ModelManagerError(f"Risk Engine Fusion Model file not found: {fusion_model_path}")

        try:
            self.fusion_model = joblib.load(fusion_model_path)
            if not hasattr(self.fusion_model, "predict_proba"):
                raise ModelManagerError("Risk Engine Fusion model missing predict_proba method.")

            # Validate fusion feature contract
            fusion_features = getattr(self.fusion_model, "feature_names_in_", None)
            if fusion_features is not None:
                expected_list = list(fusion_features)
                if expected_list != FUSION_FEATURE_NAMES:
                    raise ModelManagerError(
                        f"Fusion feature mismatch. Expected {FUSION_FEATURE_NAMES}, got {expected_list}"
                    )

            print("[OK] Risk engine loaded (Logistic Regression Fusion Model)\n")
        except Exception as e:
            raise ModelManagerError(f"Failed to load Risk Engine Fusion model: {e}")

        self._is_loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded


model_manager = ModelManager.get_instance()
