"""
Health Check and Benchmark Metrics Endpoint.
"""

from fastapi import APIRouter
from ..schemas.api import HealthResponse
from ..models_manager.manager import model_manager
from ..core.constants import BENCHMARK_METRICS
from ..core.config import settings

router = APIRouter(prefix="/api", tags=["Health & Diagnostics"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health & Model Status",
)
async def health_check():
    """
    Return operational health, model loading status, and test-set benchmark metrics.
    """
    return HealthResponse(
        status="operational",
        version=settings.APP_VERSION,
        modelsLoaded=model_manager.is_loaded,
        models={
            "url_svm": "LinearSVC (Character TF-IDF, 300K features)",
            "html_xgboost": f"XGBClassifier V2 ({len(model_manager.html_feature_names)} features)",
            "payment_xgboost": f"XGBClassifier ({len(model_manager.payment_feature_names)} features)",
            "risk_engine": "LogisticRegression (Fusion of URL, HTML, Payment)",
        },
        benchmarkMetrics=BENCHMARK_METRICS,
    )
