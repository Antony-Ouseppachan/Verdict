"""
Verdict Intelligence Platform — FastAPI Application Entry Point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .core.config import settings
from .models_manager.manager import model_manager
from .routes.analyze import router as analyze_router
from .routes.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: loads models once on startup."""
    print("=" * 60)
    print("[VERDICT] VERDICT INTELLIGENCE DETECTION PIPELINE")
    print("=" * 60)
    model_manager.load_models()
    yield
    print("[INFO] Verdict Engine shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production Phishing & Payment Threat Detection Pipeline",
    lifespan=lifespan,
)

# Enable CORS for Console and external integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(analyze_router)
app.include_router(health_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "engine": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs_url": "/docs",
    }


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
