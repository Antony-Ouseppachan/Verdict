# Verdict Intelligence Detection Engine

Production-grade, multi-modal detection engine powered by 4 trained machine learning models:
1. **URL Intelligence**: Linear SVM + 300,000-dimensional Character TF-IDF Vectorizer (`url_phishing_svm.joblib`)
2. **Page Intelligence**: XGBoost Classifier V2 with 56 DOM structural security features (`html_phishing_xgboost_v2.joblib`)
3. **Payment Intelligence**: XGBoost Classifier with 35 payment-flow and exfiltration signals (`payment_risk_xgboost.joblib`)
4. **Risk Fusion Engine**: Calibrated Logistic Regression model (`risk_engine_fusion.joblib`)

---

## Quick Start

### Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Run Server
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## API Endpoints

### 1. `POST /api/analyze`
Analyze a website URL for phishing, credential harvesting, and payment flow risks.
```json
// Request
{
  "url": "https://example.com/checkout"
}

// Response
{
  "success": true,
  "url": "https://example.com/checkout",
  "finalUrl": "https://example.com/checkout",
  "verdict": "SAFE",
  "riskScore": 0.04,
  "models": {
    "urlScore": -0.85,
    "htmlProbability": 0.02,
    "paymentProbability": 0.01
  },
  "findings": [],
  "analysis": {
    "paymentDetected": false,
    "cardInput": false,
    "cvvInput": false,
    "expiryInput": false,
    "upiInput": false,
    "otpInput": false,
    "externalForm": false,
    "externalIframe": false,
    "providerDetected": null,
    "detectedProviders": [],
    "providerMismatch": false
  },
  "scanDuration": 0.45
}
```

### 2. `GET /api/health`
Inspect model loading health, feature counts, and validated test-set benchmark metrics.
