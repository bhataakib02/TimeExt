# ProdLytics

**ProdLytics** is a productivity platform that combines a **Chrome extension** (Manifest V3), a **Next.js dashboard**, and **MongoDB** to track browsing, classify sites, score focus, set goals, manage focus blocklists, run Pomodoro-style sessions, and surface **AI Insights** (charts, recommendations, and suggested planning).

📄 **Full technical report:** [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) (architecture, APIs, data models, extension behavior, limitations).  
📋 **Software Requirements Specification (SRS):** [docs/SRS.md](docs/SRS.md) (functional/non-functional requirements, process alignment, appendices P–U for page-count targets). If the file ever shows literal `\n` or garbled dashes after a bad merge, run `python docs/fix_srs_encoding.py` from the repo root.

---

## What’s in this repo

| Folder | Description |
|--------|-------------|
| **`frontend/`** | Next.js 16 app (App Router): dashboard UI + all `/api/*` routes; talks to MongoDB via `@prodlytics/backend`. |
| **`backend/`** | Shared npm package: Mongoose models, DB connection, `aiClassifier` (productive / unproductive / neutral rules). |
| **`extension/`** | Chrome extension source; **build output** goes to `extension/dist/` (what you load in Chrome). |
| **`docs/`** | Project documentation and this README’s companion report. |

---

## Features (at a glance)

- **Tracking** — Time on site, scrolls, clicks, title/snippet; stored with a **category** (productive / unproductive / neutral).
- **Classification** — Rule-based domains + keywords (`backend/services/aiClassifier.js`); **user overrides** in `Category` win when `source: "user"`.
- **Dashboard** — Overview, Analytics, Goals, Focus Mode (blocklist), Timer (deep-work sessions), **AI Insights**, Extension Setup.
- **Insights** — Cognitive load over time (D3), focus score, streaks, goals strip, “tomorrow’s focus block” hint, actionable buttons (Focus, Timer, Goals, sync).
- **Extension sync** — Dashboard can message the extension (`frontend/src/lib/extensionSync.js`) on localhost for sync/toasts.

---

## Architecture (short)

```mermaid
flowchart LR
    EXT[Chrome Extension] -->|REST| API[Next.js /api]
    UI[Dashboard] -->|REST| API
    API -->[(MongoDB)]
    UI -.->|postMessage| EXT
```

---

## Tech stack

- **UI / API:** Next.js 16, React 19, Tailwind CSS v4, Framer Motion, D3, Recharts, Axios  
- **Data:** MongoDB, Mongoose (via `backend/db/mongodb.js` and models)  
- **Extension:** Manifest V3, Vite build, service worker + content scripts  

---

## Prerequisites

- **Node.js** 20+ recommended  
- **MongoDB** (local or Atlas)  
- **Google Chrome** (or Chromium) for the extension  

---

## Environment variables

Create **`frontend/.env.local`** (or `.env`) with:

```env
MONGO_URI=mongodb://127.0.0.1:27017/prodlytics
```

Use your real connection string for Atlas or other hosts. The Next.js API routes read `MONGO_URI` through the shared backend connector.

---

## Getting started

### 1. Clone and install the dashboard

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Build and load the extension

```bash
cd extension
npm install
npm run build
```

1. Open Chrome → `chrome://extensions`  
2. Enable **Developer mode**  
3. **Load unpacked** → select the **`extension/dist`** folder (the built output, not the raw `extension` source folder)  
4. After code changes, run `npm run build` again in `extension`, then **Reload** the extension on the extensions page  

The extension expects the API at **`http://localhost:3000/api`** (see `extension/src/background.jsx`). If you change the port, update `API_URL` there and `host_permissions` / `externally_connectable` in `extension/manifest.json`.

### 3. Optional: run from repo root

There is no root `package.json` orchestrator by default; run `frontend` and `extension` in separate terminals as above.

---

## API overview

REST handlers live under `frontend/src/app/api/`. Examples:

- `POST /api/tracking` — submit browsing time; classifier assigns category unless user override exists  
- `GET /api/tracking/stats?range=today|yesterday|week|month` — aggregates, score, streak  
- `GET /api/tracking/cognitive-load` — hourly heuristic series + insight metrics  
- `GET|PUT /api/auth/preferences` — focus/timer preferences  
- `GET|POST|PUT|DELETE /api/goals` and `GET /api/goals/progress`  
- `GET|POST|DELETE /api/focus` — blocklist  
- `GET|POST /api/deepwork` — timer sessions  

Full method tables and model descriptions: **[docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)**.

---

## Product philosophy (short)

1. **Awareness** — Measure where time goes and how engagement looks.  
2. **Interpretation** — Scores, categories, and charts—not raw logs only.  
3. **Action** — Goals, focus blocks, timer, and sync so the UI is **actionable**.  

---

## Limitations (read before demo or production)

- Many routes use a **fixed mock user id** for development; replace with real auth for multi-user production.  
- CORS is open for extension dev; **tighten** for production.  
- “Cognitive load” and similar metrics are **heuristics**, not medical or psychological diagnostics.  

Details: [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) §11.

---

## Contributors

| GitHub |
|--------|
| [@adnaan-dev](https://github.com/adnaan-dev) |
| [@sradha2474](https://github.com/sradha2474) |
| [@akeem786](https://github.com/akeem786) |
| [@saqibmokhtar884](https://github.com/saqibmokhtar884) |
| [@bhataakib02](https://github.com/bhataakib02) |
| [@abhishek-134](https://github.com/abhishek-134) |
| [@satakshik-chaurasia](https://github.com/satakshik-chaurasia) |

Short project report (same team list): [report.md](report.md).

---

## License / credits

See repository license if present. Developed as the **ProdLytics** productivity suite.
