# Verdict Backend Decision Engine

Minimal, high-performance decision engine API for Verdict.

---

## Running the Backend

```bash
cd backend
npm install
npm run dev
```

The server starts at `http://localhost:3000`.

### Endpoints

- `GET /v1/status`: Health check
- `POST /v1/analyze`: Evaluate URL and risk signals, returning a `VerdictDecision` (`SAFE`, `CAUTION`, `DANGER`).
