<div align="center">

<img src="https://img.shields.io/badge/TestPilot_AI-Visual_Regression_Testing-6366f1?style=for-the-badge" alt="TestPilot AI" />

# TestPilot AI

**AI-powered cross-browser visual regression testing — catch UI bugs before your users do.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-testpilot.gauravvv.me-6366f1?style=flat-square)](https://testpilot.gauravvv.me)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square)](https://testpilot-backend-42zb.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-v24-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-v1.59-2EAD33?style=flat-square&logo=playwright)](https://playwright.dev)

<br/>

> Drop in a URL. TestPilot AI spins up real browsers, captures screenshots, diffs them against your baseline, and uses an AI vision model to tell you exactly what broke, where, and how to fix it.

<br/>

[**Try it live →**](https://testpilot.gauravvv.me)

</div>

---

## What It Does

TestPilot AI automates visual QA across browsers using real Playwright-driven screenshots — not simulated rendering. When a regression is detected, it doesn't just highlight pixels. It sends the baseline, current, and diff images to NVIDIA's Nemotron Omni vision model, which returns structured analysis including severity, root cause, a concrete CSS fix, and a confidence score.

```
URL input → Playwright captures screenshots → pixel diff generated
→ NVIDIA NIM vision model analyses all 3 images
→ structured JSON report streamed live to dashboard
```

---

## Features

**Real browser testing**
Runs actual Chromium and WebKit instances via Playwright — not headless simulations. What you see in TestPilot is what your users see.

**AI-powered issue analysis**
Every regression is analysed by `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, a GUI-trained vision model that tops OCRBenchV2 for document and layout intelligence. It was purpose-built for screen and UI understanding.

**Structured JSON reports — not vague alerts**
Each issue comes with:
- `severity` — critical / high / medium / low
- `rootCause` — what changed and likely why
- `suggestedFix` — a concrete, valid CSS snippet
- `affectedProperty` — the CSS property most responsible
- `confidence` — integer 0–100
- `location` — where on the page (e.g. "header nav", "hero CTA button")

**Live SSE streaming**
Results stream to the dashboard token-by-token as the model reasons — no waiting for a full response before seeing output.

**Baseline management**
First run captures the baseline. Every subsequent run diffs against it automatically. Baselines are stored per-browser per-URL.

**Cross-browser diff**
Chromium and WebKit run sequentially with isolated contexts — memory-safe on constrained infrastructure.

**Production-hardened retry logic**
Distinguishes quota exhaustion (fails fast) from transient rate limits (exponential backoff with `Retry-After` header respect). No wasted retries against a hard quota wall.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express |
| **Browser Automation** | Playwright v1.59 (Chromium + WebKit) |
| **AI Vision Model** | NVIDIA NIM — `nemotron-3-nano-omni-30b-a3b-reasoning` |
| **Streaming** | Server-Sent Events (SSE) |
| **Database** | PostgreSQL |
| **Containerisation** | Docker (Microsoft official Playwright image) |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (Vercel)              │
│         React + Tailwind + shadcn/ui             │
│                                                  │
│  URL input → run trigger → SSE result display    │
└──────────────────┬──────────────────────────────┘
                   │ HTTP + SSE
┌──────────────────▼──────────────────────────────┐
│               Backend (Render + Docker)          │
│                  Express + Node.js               │
│                                                  │
│  ┌─────────────┐    ┌──────────────────────────┐ │
│  │  Playwright  │    │      Rate Limiter        │ │
│  │  Runner      │    │  (14 RPM queue + daily   │ │
│  │  Chromium    │    │   limit tracking)        │ │
│  │  WebKit      │    └──────────────────────────┘ │
│  └──────┬──────┘                │                 │
│         │ screenshots           │                 │
│  ┌──────▼──────────────────────▼──────────────┐  │
│  │           NVIDIA Analyzer                  │  │
│  │  baseline + current + diff → callNvidia()  │  │
│  └──────────────────┬─────────────────────────┘  │
│                     │                             │
└─────────────────────┼───────────────────────────┘
                      │ NVIDIA NIM API
┌─────────────────────▼───────────────────────────┐
│         NVIDIA NIM (nemotron-omni-30b)           │
│   reasoning_content (thinking trace, ignored)    │
│   content → structured JSON issues              │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              PostgreSQL Database                 │
│         runs · screenshots · issues             │
└─────────────────────────────────────────────────┘
```
<img width="1621" height="911" alt="Screenshot 2026-07-16 194733" src="https://github.com/user-attachments/assets/e45390cd-985f-42aa-9f3b-b5b80c45796f" />
<img width="1620" height="911" alt="Screenshot 2026-07-16 195137" src="https://github.com/user-attachments/assets/c64cbb74-e006-4aca-8742-d8317425dc9a" />

---

## Local Setup

### Prerequisites

- Node.js v18+
- PostgreSQL database
- NVIDIA NIM API key — free at [build.nvidia.com](https://build.nvidia.com) (no credit card needed)
- Docker (for production-parity local runs — optional)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/testpilot-ai.git
cd testpilot-ai
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install
npx playwright install chromium webkit

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment variables

```bash
# backend/.env
NVIDIA_API_KEY=nvapi-your-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/testpilot
PORT=3001
```

```bash
# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Set up the database

```bash
cd backend
npm run db:migrate
```

### 5. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Visit `http://localhost:3000`

---

## Docker (Production-parity)

```bash
docker build -t testpilot-ai .
docker run -p 3001:3001 \
  -e NVIDIA_API_KEY=nvapi-your-key \
  -e DATABASE_URL=your-db-url \
  testpilot-ai
```

The Dockerfile uses Microsoft's official Playwright image (`mcr.microsoft.com/playwright:v1.59.1-noble`) which includes all browser binaries and system dependencies pre-installed — no manual library management needed.

---

## API Reference

### `POST /api/runs`
Trigger a new visual regression test run.

**Request**
```json
{
  "url": "https://your-site.com",
  "browsers": ["chromium", "webkit"]
}
```

**Response**
```json
{
  "runId": "run_4805d6dd-bc04-4603-ba83-7856dd61d8a3",
  "status": "queued",
  "browsers": ["chromium", "webkit"]
}
```

---

### `GET /api/runs/:runId`
Get results for a completed run.

**Response**
```json
{
  "runId": "run_4805d6dd",
  "status": "complete",
  "results": [
    {
      "browser": "chromium",
      "overallStatus": "needs_review",
      "summary": "Navigation bar shifts 8px left at 1280px viewport",
      "issues": [
        {
          "id": "issue_1720000000_1",
          "browser": "chromium",
          "title": "Nav alignment broken at wide viewport",
          "severity": "high",
          "category": "layout",
          "location": "header nav",
          "rootCause": "flex container lost justify-content after recent CSS update",
          "suggestedFix": "nav { justify-content: space-between; }",
          "affectedProperty": "justify-content",
          "confidence": 91
        }
      ]
    }
  ]
}
```

---

### `GET /ask` (SSE)
Stream AI analysis results in real time.

```
GET /ask?runId=run_4805d6dd&browser=chromium
Content-Type: text/event-stream
```

**Events emitted:**
| Event | Payload | Description |
|---|---|---|
| `thinking` | `{ message, model }` | Analysis started, model name |
| `data` | `{ token }` | Streaming token from model |
| `result` | Full JSON issue report | Parsed structured output |
| `error` | `{ message }` | Error with description |
| `done` | `{}` | Stream complete |

---

### `GET /status`
Health check — returns rate limiter status.

```json
{
  "requestsThisMinute": 2,
  "requestsToday": 47,
  "rpm": 14,
  "dailyLimit": 1500,
  "queueLength": 0
}
```

---

## Production Debugging Notes

Real production issues solved during development — useful if you're building something similar:

**Playwright on constrained infrastructure (512MB RAM)**
Running multiple browser instances simultaneously causes OOM kills. Fixed by sequential browser execution and `--disable-dev-shm-usage` + `--single-process` flags for Chromium.

**WebKit headless compositor hang**
WebKit on Docker Linux hangs at screenshot capture with no GPU. Fixed with `WEBKIT_DISABLE_COMPOSITING_MODE=1` and `WEBKIT_DISABLE_DMABUF_RENDERER=1` env vars.

**NVIDIA reasoning model response parsing**
Nemotron Omni returns thinking traces in a separate `reasoning_content` field — not inside `<think>` tags in `content`. Read `content` directly, no stripping needed.

**Quota exhaustion vs rate limiting**
Both return HTTP 429 but behave differently. Quota exhaustion (`limit: 0` in error details) should never be retried. Rate limiting should use exponential backoff with `Retry-After` header. Treating them the same wastes 105 seconds retrying a request that will never succeed.

---

## Roadmap

- [ ] Webhook notifications on critical regressions
- [ ] GitHub Actions integration for CI/CD pipelines
- [ ] Scheduled runs (cron-based monitoring)
- [ ] Mobile viewport testing
- [ ] Multi-page crawl support
- [ ] Team workspaces

---

## Author

**Gaurav** — Full Stack Developer & QA Automation Engineer

[![Portfolio](https://img.shields.io/badge/Portfolio-gauravvv.me-6366f1?style=flat-square)](https://gauravvv.me)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/gauravsuthar7)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square&logo=github)](https://github.com/Gaurav00780)

---

<div align="center">

**Built with Node.js · Playwright · NVIDIA NIM · PostgreSQL · React**

⭐ Star this repo if you found it useful

</div>
