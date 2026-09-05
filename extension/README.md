# 🛡️ Verdict Browser Defense Extension

Autonomous, Zero-Trust Browser Security Agent and Sensor built for **Manifest V3**.  
Verdict protects users in real-time from counterfeit e-commerce shops, brand impersonation phishing, unauthorized payment gateways, and credential harvesting vectors.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Prerequisites](#-prerequisites)
3. [Step-by-Step Setup Guide](#-step-by-step-setup-guide)
4. [How to Use the Extension](#-how-to-use-the-extension)
5. [Testing & Threat Interception Demo](#-testing--threat-interception-demo)
6. [Development & Verification](#-development--verification)
7. [Privacy & Security Commitments](#-privacy--security-commitments)
8. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏛️ Architecture Overview

```
extension/
├── src/
│   ├── background/          # Manifest V3 Service Worker & lifecycle coordinator
│   │   ├── index.ts         # Service worker entrypoint & navigation handlers
│   │   ├── protection.ts    # Threat evaluation & tab-scoped bypass management
│   │   ├── messaging.ts     # Typed IPC message dispatcher
│   │   └── lifecycle.ts     # Device provisioning & dynamic badge manager
│   ├── content/             # In-page DOM signal collectors & isolated warning overlay
│   │   ├── index.ts         # Content script orchestrator (document_start)
│   │   ├── warning/         # Shadow DOM floating pill & warning banner UI
│   │   └── collectors/      # Safe structural DOM and payment surface collectors
│   ├── firewall/            # Standalone Zero-Trust Firewall quarantine bridge
│   │   ├── FirewallApp.tsx  # Standalone quarantine UI with financial hazard warnings
│   │   └── main.tsx         # React root
│   ├── popup/               # Quick glance & shield toggle control interface
│   ├── dashboard/           # Full embedded security inspection dashboard
│   ├── api/                 # Typed client for Verdict Decision Engine (Port 8000)
│   ├── security/            # PII redaction engine, URL validation & Zod schemas
│   └── storage/             # Local & session storage persistence adapters
├── firewall.html            # Standalone quarantine firewall page
├── popup.html               # Extension popup surface
├── dashboard.html           # Full embedded dashboard page
├── manifest.json            # Manifest V3 configuration
├── vite.config.ts           # Multi-page Vite compilation configuration
└── package.json
```

### Key Components

- **Standalone Firewall Quarantine (`firewall.html`)**: Intercepts dangerous sites *before* untrusted scripts or assets execute, presenting threat telemetry, explicit payment hazard callouts, and consent controls.
- **Glance Popup (`popup.html`)**: Minimal control surface. Lets users toggle protection ON/OFF, view immediate active site status, and open the full extension dashboard.
- **Full Security Dashboard (`dashboard.html`)**: Deep inspection interface for threat audit logs, technical telemetry, enrolled devices, and privacy preferences.
- **Content Sensor (`content/index.ts`)**: Runs at `document_start` to collect structural DOM signals without ever reading user input values.

---

## 📋 Prerequisites

Before installing the extension, ensure you have:

- **Google Chrome** (v108+) or any Chromium-based browser (Brave, Microsoft Edge, Arc, Opera).
- **Node.js** (v18.0.0 or higher) & **npm** (v9+).
- **Python** (v3.10+) with FastAPI dependencies installed (for the local AI decision engine).

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Start the Verdict Decision Engine (Backend)

The Chrome extension communicates with the 4-model AI inference engine running on **port 8000**.

1. Open a terminal in the root repository directory:
   ```bash
   cd d:/BCA/Verdict/backend
   ```
2. Activate your virtual environment and start the FastAPI server:
   ```bash
   # On Windows (PowerShell):
   .venv\Scripts\activate
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
3. Verify the backend is operational:
   ```bash
   curl http://localhost:8000/api/health
   # Expected response: {"status":"operational","version":"2.0.0","modelsLoaded":true,...}
   ```

---

### Step 2: Configure & Build the Chrome Extension

1. Open a terminal in the `extension/` directory:
   ```bash
   cd d:/BCA/Verdict/extension
   ```
2. Ensure `.env` is configured for the local backend:
   ```env
   VITE_VERDICT_API_BASE_URL=http://localhost:8000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the production extension bundle:
   ```bash
   npm run build
   ```
   *This compiles TypeScript, bundles React interfaces with Vite, and produces the production assets in `extension/dist/`.*

---

### Step 3: Load the Extension into Google Chrome

1. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the `extension/` directory (or `extension/dist/` depending on your workflow; selecting `d:/BCA/Verdict/extension` loads the root manifest pointing to bundled scripts).
5. The **Verdict Protection** extension card will now appear with the green shield icon.
6. *(Optional)* Pin the Verdict extension icon to your Chrome toolbar for easy access.

---

## 🛡️ How to Use the Extension

### 1. Ambient Background Protection
- Browse the web normally. Verdict operates silently and autonomously.
- **Safe Sites**: A subtle green `Verdict: Safe` pill appears briefly in the bottom-right corner and fades out. The browser toolbar icon displays `OK`.
- **Cautionary Sites**: An amber advisory badge displays potential risks (e.g., newly registered merchant domain, missing TLS).

### 2. Standalone Firewall Intervention (Dangerous Sites)
When a high-risk phishing, credential harvesting, or fake shop site is detected:
1. **Zero-Leak Isolation**: Verdict immediately redirects the tab to the standalone quarantine bridge (`firewall.html`), stopping malicious scripts from executing.
2. **Financial Hazard Callout**: The page explicitly warns:
   > ⚠️ **PAYMENT & FINANCIAL HAZARD**: *DO NOT MAKE ANY PAYMENTS OR ENTER CREDIT CARD / BANKING DETAILS ON THIS SITE.*
3. **Threat Findings**: Displays the exact signals detected (e.g., URL SVM heuristic, DOM impersonation signature, unverified payment form).
4. **Action Options**:
   - **Take me back (Recommended)**: Navigates back safely or redirects to Google.
   - **I understand the risk (Proceed to Website)**: Grants temporary tab-scoped consent to inspect the site.

### 3. Persistent Unsafe Indicator & Refresh Behavior
- If you authorize transit by clicking **"I understand the risk"**:
  - The destination site loads with a persistent red **`Verdict: Unsafe`** capsule anchored in the bottom-right corner.
  - Refreshing the page (F5 / ⟳) will **not** re-block you in that tab.
  - Opening the malicious URL in a **new tab** will re-enforce the firewall barrier.

### 4. Extension Popup (Quick Glance)
Click the Verdict icon in your browser toolbar to:
- Toggle real-time autonomous protection **ON / OFF**.
- View the active tab's current domain, title, and safety verdict.
- Jump directly to the **Security Dashboard**.

### 5. Embedded Security Dashboard
Open `chrome-extension://<EXTENSION_ID>/dashboard.html` or click **View Full Dashboard** in the popup:
- **Overview**: Real-time metrics on total sites scanned, warnings issued, and threats neutralized.
- **Protection History**: Searchable, filterable audit log of evaluated domains with human explanations.
- **Threat Breakdown Modal**: Click any log entry to inspect findings, recommended actions, and technical telemetry.
- **Settings**: Adjust sensitivity, toggle notifications, and inspect your anonymous Device ID.

---

## 🧪 Testing & Threat Interception Demo

You can test Verdict's detection capabilities using the test domains configured in the local engine:

| Target URL / Pattern | Expected Verdict | Behavior |
| :--- | :--- | :--- |
| `https://google.com` | `SAFE` | Silent nominal browsing (`OK` badge). |
| `https://suspicious-unverified-store.com/checkout` | `CAUTION` | Amber warning pill with seller advisory. |
| `http://paypa1-security-verification.com/login` | `DANGER` | **Verdict Firewall Quarantine** intercepts tab. |
| `https://fake-shop-danger.com/login` | `DANGER` | **Verdict Firewall Quarantine** intercepts tab. |

---

## 🛠️ Development & Verification

### Running Automated Tests
The extension includes a complete suite of unit, component, and end-to-end integration tests using Vitest:

```bash
# Run test suite
npm test

# Run tests in watch mode
npm run test:watch
```
*Current test suite status: **64 / 64 tests passing**.*

### Linting and Typechecking
```bash
# Typecheck TypeScript files
npm run typecheck

# Lint with ESLint
npm run lint
```

### Hot Reloading Code Changes
When making changes to files in `extension/src/`:
1. Run `npm run build` to rebuild `dist/`.
2. Open `chrome://extensions` and click the **⟳ (Reload)** button on the Verdict card.
3. Reload the tab you are testing.

---

## 🔒 Privacy & Security Commitments

Verdict adheres to strict data minimization principles:
- **Zero Input Credential Reading**: The content script **never** inspects or records input values for passwords, credit card numbers, CVVs, expiration dates, OTPs, or cookies.
- **Metadata-Only Analysis**: Only structural DOM signals (form actions, input types, protocol, presence of iframe elements) are sent to the local inference engine.
- **Fail-Safe Operation**: If the AI backend is unreachable, the extension fails safely without crashing or breaking normal web browsing.

---

## ❓ Troubleshooting & FAQs

### Q1: The extension says "Engine Unavailable" or shows safe for known test URLs.
- **Fix**: Ensure the FastAPI backend is running on `http://localhost:8000`. Test with `curl http://localhost:8000/api/health`.

### Q2: I updated the code, but changes aren't showing in the browser.
- **Fix**: Run `npm run build` in `extension/`, then visit `chrome://extensions` and click the **⟳ (Reload)** icon on the extension card.

### Q3: How do I open the SOC Console?
- **Answer**: Start the frontend console in `console/` (`npm run dev`) and visit `http://localhost:5174` to view real-time multi-model detection streams.
