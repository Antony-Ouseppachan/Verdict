# 🛡️ Verdict — Real-Time Autonomous Neural Defense Platform

**Verdict** is a next-generation browser threat defense platform designed to protect users in real-time from counterfeit e-commerce shops, brand impersonation phishing, credential harvesters, and rogue payment gateways.

---

## 📦 System Architecture

```
Verdict/
├── backend/      # FastAPI AI Inference Decision Engine (Port 8000) with 4-Model ML Pipeline
├── console/      # Cyber-SOC Security Operations Center Console (Vite + React, Port 5174)
├── extension/    # Manifest V3 Chrome Defense Extension & Standalone Firewall Quarantine
├── models/       # Trained ML Models (URL SVM, HTML XGBoost V2, Payment XGBoost, Risk Fusion)
└── docs/         # System specifications, threat vectors, and API contracts
```

---

## 🚀 Quick Start Guide

### 1. Start the Backend AI Engine
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Launch the SOC Workstation Console
```bash
cd console
npm install
npm run dev
# Opens SOC workstation at http://localhost:5174
```

### 3. Load the Chrome Defense Extension
Detailed setup and usage instructions are provided in the [Extension Documentation](file:///d:/BCA/Verdict/extension/README.md):
```bash
cd extension
npm install
npm run build
```
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** to ON.
3. Click **Load unpacked** and select the `d:/BCA/Verdict/extension` directory.

---

## 📚 Component Documentation
- [Chrome Extension Setup & Usage Guide](file:///d:/BCA/Verdict/extension/README.md)
- [Backend Decision Engine Guide](file:///d:/BCA/Verdict/backend/README.md)
