"""
API Request and Response Pydantic Schemas for Verdict Detection Engine.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="Target webpage URL to analyze")


class ModelScores(BaseModel):
    urlScore: float = Field(..., description="Raw decision function score from URL Linear SVM")
    htmlProbability: float = Field(..., description="Phishing probability from HTML XGBoost V2 (0.0–1.0)")
    paymentProbability: float = Field(..., description="Risk probability from Payment XGBoost (0.0–1.0)")


class SecurityFinding(BaseModel):
    severity: str = Field(..., description="Severity level: 'high', 'medium', or 'low'")
    category: str = Field(..., description="Category: 'url', 'payment', 'html', 'code', 'brand', 'network'")
    title: str = Field(..., description="Concise finding headline")
    description: str = Field(..., description="Evidence-backed description of the detected anomaly")


class PaymentAnalysis(BaseModel):
    paymentDetected: bool
    cardInput: bool
    cvvInput: bool
    expiryInput: bool
    upiInput: bool
    otpInput: bool
    externalForm: bool
    externalIframe: bool
    providerDetected: Optional[str] = None
    detectedProviders: List[str] = []
    providerMismatch: bool = False
    sensitivePaymentCombo: bool = False
    otpPaymentCombo: bool = False


class AnalyzeResponse(BaseModel):
    success: bool = True
    url: str
    finalUrl: str
    verdict: str = Field(..., description="'SAFE', 'SUSPICIOUS', or 'HIGH RISK'")
    riskScore: float = Field(..., description="Calibrated final risk score (0.00–1.00)")
    models: ModelScores
    findings: List[SecurityFinding]
    analysis: PaymentAnalysis
    telemetry: Optional[Dict[str, Any]] = None
    scanDuration: float = Field(0.0, description="Elapsed time in seconds for analysis")
    decision: Optional[Dict[str, Any]] = None
    requestId: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    modelsLoaded: bool
    models: Dict[str, str]
    benchmarkMetrics: Dict[str, Any]
