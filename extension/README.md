# Verdict Chrome Extension (`extension/`)

Autonomous browser safety agent and sensor built for Manifest V3.

---

## System Architectural Roles

- **`Popup` (Glance & Control)**: Minimal control surface. Lets users toggle protection ON/OFF, see immediate active site status, and open the full extension dashboard.
- **`Dashboard` (Understand & Manage)**: Full embedded extension page (`dashboard.html`) designed for deep inspection, protection history, enrolled devices, and privacy preferences.
- **`Website` (`web/`)**: User account management, billing, cloud sync, and family subscription settings.
- **`Console` (`console/`)**: Internal operator monitoring, sandbox queues, and telemetry.
- **`Backend` (`backend/`)**: Intelligence, detection, brand spoof analysis, and decision engine.

---

## Directory Structure

```
extension/
├── src/
│   ├── background/          # Manifest V3 Service Worker & lifecycle
│   ├── content/             # DOM signal collectors & isolated warning overlay
│   ├── popup/               # Glance & control interface
│   ├── dashboard/           # Full embedded security dashboard
│   │   ├── components/      # Sidebar, Header, CurrentSiteCard, MetricsCard, DetailModal, DeviceCard
│   │   ├── pages/           # OverviewPage, HistoryPage, DevicesPage, SettingsPage
│   │   ├── hooks/           # useProtection, useHistory, useTheme
│   │   ├── styles/          # tokens.css, dashboard.css
│   │   ├── App.tsx          # Root dashboard shell
│   │   └── main.tsx         # React entrypoint
│   ├── api/                 # Decision engine client, retry backoff & schemas
│   ├── collectors/          # Safe DOM signal collectors (metadata only)
│   ├── storage/             # Local storage persistence (Protection state, History, Stats, Device ID)
│   ├── security/            # Redaction engine, URL validation & permissions
│   └── shared/              # Types, constants, logger & deduplication
├── public/                  # Static assets & icons (16px, 48px, 128px)
├── tests/                   # Unit & end-to-end integration tests (44/44 passing)
├── dashboard.html           # Embedded Dashboard HTML entry
├── popup.html               # Popup HTML entry
├── manifest.json            # Manifest V3 configuration
├── package.json
└── README.md
```

---

## Key Features

1. **Autonomous Ambient Protection**:
   - Evaluates sites silently in real-time on navigation.
   - Remains completely silent for `SAFE` sites.
   - Shows non-intrusive advisories for `CAUTION` sites.
   - Renders safety barriers for `DANGER` (fake shops / phishing).

2. **Full Embedded Security Dashboard (`dashboard.html`)**:
   - **Overview**: Active site status, key safety metrics (Sites Checked, Warnings, Threats Prevented), recent timeline.
   - **Protection History**: Searchable, filterable audit log of evaluated domains with human explanations.
   - **Detail Modal**: Explains *What Happened*, *What Verdict Noticed*, *What You Should Do*, and an expandable *Technical Details* drawer.
   - **Devices**: Enrolled devices with future-ready Family Shield sync structure.
   - **Settings**: Autonomous shield toggles, notification preferences, and privacy assurances.

3. **Strict Data Minimization & Privacy**:
   - **Zero Form Value Ingestion**: Never reads passwords, credit cards, CVVs, cookies, or auth tokens.
   - Sanitizes and redacts all telemetry prior to transmission.

4. **Fault-Tolerant & Non-Blocking**:
   - If the backend is unreachable, the extension fails safely without blocking browsing or spamming errors.

---

## Development & Build Commands

```bash
# Install dependencies
npm install

# Run test suite (44 tests)
npm run test

# Typecheck and lint
npm run typecheck
npm run lint

# Build production bundle
npm run build

# Package distributable ZIP
npm run package
```
