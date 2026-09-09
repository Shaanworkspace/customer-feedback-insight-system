# Customer Feedback Insight System

> Upload your customer reviews. Get a ranked, proven list of what customers hate, why they hate it, and what to fix first — backed by real customer quotes.

[![Live Frontend](https://img.shields.io/badge/Live-Frontend-blue?style=flat&logo=vercel)](https://customer-feedback-insight-system.vercel.app)
[![Live API](https://img.shields.io/badge/Live-API-green?style=flat&logo=render)](https://cfa-api.onrender.com/health)
[![Built with React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)](https://react.dev)
[![Built with FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![ML](https://img.shields.io/badge/ML-BERT%20ASTE%20%2B%20No%20Hardcode-green)](https://huggingface.co/transformers)
[![Notebook](https://img.shields.io/badge/Notebook-Final_Perfect_Model.ipynb-blue)](notebooks/Final_Perfect_Model.ipynb)

---

## What is this?

Companies get thousands of reviews, but reading them one by one is impossible. This system takes a CSV of customer reviews and automatically answers three questions:

1. **What are customers complaining about?** (concerns like battery, delivery, camera, price…)
2. **How do they feel?** (positive or negative sentiment)
3. **What should we fix first?** (a ranked list of problems, each with real customer proof)

It is built for the Cognizant hackathon. The whole point is: **no fake numbers**. Every chart on the dashboard comes directly from the CSV you upload. Nothing is hardcoded.

---

## Key Features

- **CSV upload** that understands both the real Kaggle Amazon format and a simple `review_text,rating,date` format.
- **Sentiment analysis** on every review (Positive / Negative / Neutral / Mixed) using the perfect BERT token model from `notebooks/Final_Perfect_Model.ipynb` (no hard-coded word list).
- **Concern detection** that finds aspects by itself (no fixed list) — the model learns patterns like `X is excellent`, so any product (chair, phone) works.
- **Priority ranking** that scores each concern by *how often it appears* × *how negative it is*, so the worst problems rise to the top.
- **Dashboard with charts**: sentiment split, priority concerns, rating distribution, reviews over time, and market-by-country.
- **Real proof per concern**: open a concern and see the actual customer reviews that mention it (this is the RAG part).
- **Works locally and on the deployed cloud** with a one-click switch between LOCAL and DEPLOYED backends.

---

## How it works (in three lines)

1. You upload a CSV of reviews.
2. The backend reads every row, figures out the sentiment and the concern, and saves the results.
3. The frontend reads those results and draws the charts.

That is the whole idea. The rest of this document explains each step in plain English, with examples.

---

## Architecture

```
┌──────────────────────────┐         ┌──────────────────────────────┐
│  Browser (React)         │         │  Backend (FastAPI)           │
│  Vercel / localhost      │         │  Render / localhost:8000     │
│                          │         │                              │
│  Landing → Login →       │  HTTP   │  /api/v1/upload  (CSV in)    │
│  Upload → Dashboard      │ ──────▶ │  /api/v1/stats   (JSON out) │
│  (charts via Recharts)   │ ◀────── │  /api/v1/reviews            │
│                          │         │  /api/v1/analyze            │
│  api.js  ──fetch()──▶    │         │  /api/v1/concern-comments   │
└──────────────────────────┘         └───────────┬──────────────────┘
                                                 │ calls
                                                 ▼
                                    ┌────────────────────────────┐
                                    │  Analysis modules          │
                                    │  • concerns.py (detect)    │
                                    │  • ml/serve.py (sentiment) │
                                    │  • rag.py (find similar)   │
                                    │  • ranking/priority.py     │
                                    │  • analysis/stats.py       │
                                    └───────────┬────────────────┘
                                                 │ reads/writes
                                                 ▼
                                     ┌────────────────────────────┐
                                     │  MySQL (Aiven) via db.repo │
                                     │  • users table             │
                                     │  • analyses table          │
                                     │    (history kept: last 3)  │
                                     └────────────────────────────┘
```

Results are persisted in MySQL (Aiven) per user. Each upload saves one analysis row; only the **last 3 analyses per user** are kept. With no `DATABASE_URL` set, the backend falls back to a local SQLite file (`data/app.db`), which is gitignored.

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React + Vite + Tailwind CSS v4 + Recharts | Fast, modern, easy charts |
| Backend | FastAPI (Python) | Auto docs, async, simple |
| ML | scikit-learn (TF-IDF + Logistic Regression) | Small, fast, no GPU, explainable |
| Aspect extraction | Hugging Face Inference (free LLM) — dynamic, no fixed entity list | Open aspect-based sentiment; lexicon fallback offline |
| Retrieval (RAG) | Word-overlap similarity over saved reviews | No vector DB, no model needed |
| Deploy | Vercel (frontend) + Render (backend) | Free, one-click |

**Env vars** (backend): `DATABASE_URL` (MySQL/Aiven; SQLite fallback if unset), `HF_TOKEN` (enables LLM aspect extraction; without it the offline lexicon is used), optional `HF_MODEL`.

---

## Project Structure

```
.
├── frontend/                  # React app
│   ├── src/
│   │   ├── api.js             # all backend calls (base URL switch)
│   │   ├── App.jsx            # routing + view state
│   │   ├── components/
│   │   │   ├── layout/        # SiteHeader, AppHeader, SiteFooter
│   │   │   ├── landing/       # Landing + Hero
│   │   │   ├── auth/          # Login
│   │   │   ├── upload/        # Upload (LOCAL / DEPLOYED buttons)
│   │   │   ├── Dashboard.jsx  # charts + proof modal
│   │   │   ├── Analyzer.jsx   # single-review analyzer
│   │   │   └── Explorer.jsx   # review table
│   │   └── index.css          # Tailwind + custom styles
│   └── index.html             # tab title + logo favicon
│
├── src/cfa/                   # Python backend package
│   ├── api/
│   │   ├── main.py            # FastAPI endpoints (+ auth wiring)
│   │   ├── auth.py            # signup / login / JWT (MySQL-backed users)
│   │   ├── pipeline.py        # CSV → analyze → save
│   │   └── schemas.py         # request models
│   ├── analysis/
│   │   ├── concerns.py        # concern detection
│   │   ├── rag.py             # find similar reviews
│   │   ├── stats.py           # read saved results
│   │   └── concern_lexicon.json  # concern → keywords
│   ├── ml/
│   │   └── serve.py           # sentiment prediction
│   ├── ranking/
│   │   └── priority.py        # impact scoring
│   └── core/
│       └── config.py          # paths
│
├── data/                      # gitignored — SQLite fallback (local only)
├── models/                    # trained model + metrics (committed)
├── tests/                     # pytest suite
├── IMP_FILES/                 # docs + sample CSVs (this repo's notes)
│   └── sample_csvs/           # 6 product CSVs for testing
└── README.md
```

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+

### 1. Backend
```bash
cd src/cfa
python -m venv .venv        # or: python -m venv ../../.venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```
Backend is now at `http://localhost:8000`. Check `http://localhost:8000/health`.

### 2. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend is now at `http://localhost:5173`. Open it and click **Upload & Continue ON LOCAL**.

### 3. Try it
Use one of the sample CSVs in `IMP_FILES/sample_csvs/`. For example `6_luxewatch_price.csv` makes "price" the top concern.

---

## Deployment

- **Frontend** → Vercel, root = `frontend/`, build = `npm run build`, output = `dist`.
- **Backend** → Render, root = `src/cfa/`, start = `uvicorn api.main:app --host 0.0.0.0 --port 10000`.
- CORS on the backend allows the Vercel domain and any `*.vercel.app` URL, plus localhost.

> Note: results live in MySQL per user, so they persist across deploys. On Render, set the `DATABASE_URL` env var to your Aiven MySQL URL. Locally, a SQLite fallback (`data/app.db`) is used when `DATABASE_URL` is unset.

---

## API Reference

Base URL (deployed): `https://cfa-api.onrender.com`

All `/api/v1/*` endpoints except `/health` and `/api/v1/ping` require `Authorization: Bearer <token>` (obtained from signup/login).

| Method | Endpoint | What it does | Request | Response (short) |
|--------|----------|--------------|---------|------------------|
| GET | `/health` | Health check | — | `{status, reviews_analyzed, avg_latency_ms}` |
| GET | `/api/v1/ping` | Is backend alive | — | `{message}` |
| POST | `/api/v1/auth/signup` | Create account, return token | `{username, password}` | `{message, token}` |
| POST | `/api/v1/auth/login` | Log in, return token | `{username, password}` | `{token}` |
| GET | `/api/v1/auth/me` | Current user (needs token) | — | `{username}` |
| POST | `/api/v1/upload` | Upload CSV, analyze all rows | `file` (multipart) | full stats JSON |
| GET | `/api/v1/stats` | Dashboard numbers | — | `{total_reviews, sentiment_distribution, ranked_concerns, ratings, countries, time_trend, …}` |
| GET | `/api/v1/reviews` | All saved reviews | — | `[{review_id, text, entity, sentiment, rating, country, date}, …]` |
| POST | `/api/v1/analyze` | Analyze one review | `{review_text}` | `{overall_sentiment, concerns, …}` |
| GET | `/api/v1/concern-comments` | Proof reviews for a concern | `?concern=battery` | `[{reviewer, text, rating, country, date, similarity}, …]` |

Example upload response (trimmed):
```json
{
  "total_reviews": 30,
  "sentiment_distribution": {"positive": 20, "negative": 10},
  "ranked_concerns": [
    {"concern": "battery", "count": 11, "negative_pct": 36.4, "impact": 100, "priority": 1},
    {"concern": "screen",  "count": 5,  "negative_pct": 20.0, "impact": 40,  "priority": 2}
  ],
  "ratings": {"1": 10, "2": 8, "4": 2, "5": 10},
  "countries": {"US": 5, "GB": 5, "CA": 4},
  "time_trend": [{"year": "2024", "count": 30}]
}
```

---

## Mapping to the 9 KIET Evaluation Criteria

This project targets **Use Case #7 — "Sentiment Analysis of Customer Reviews"** (Amazon Reviews Dataset) from the KIET Hackathon PDF. It is built against the 9-point evaluation checklist on page 4 of that PDF. Short status:

| # | Criterion (from PDF, page 4) | Status |
|---|------------------------------|--------|
| 1 | Use Case Understanding & Relevance | ✅ Maps exactly to Use Case #7; see `IMP_FILES/user_flow.md` |
| 2 | Solution Architecture | ✅ Layered design (see Architecture section above) |
| 3 | Innovation & Creativity (AI/ML) | ✅ Trained ML model + keyword fallback **hybrid** + RAG proof + concern lexicon |
| 4 | UI & UX | ✅ React dashboard, Analyzer, Landing, Upload with LOCAL/DEPLOYED switch |
| 5 | Technical Implementation & Code Quality | ✅ Modular `api / analysis / ml / ranking / core` layers, clean code, docs |
| 6 | Model Performance & Evaluation | ✅ 88.4% acc · 86.0% prec · 89.0% recall · 87.5% F1 (see `IMP_FILES/ml.md`) |
| 7 | Deployment & Integration | ✅ Vercel + Render, REST API, CI/CD via GitHub Actions |
| 8 | Presentation & Communication | ⏳ You prepare the PPT / video / demo (not code) |
| 9 | Collaboration & Teamwork | ✅ Team task assignment documented |

---

## Documentation Index (for readers & presenters)

All deep-dive docs live in `IMP_FILES/`:

- `user_flow.md` — exactly what the user sees and clicks, step by step (great for a presentation).
- `internal_flow.md` — how frontend and backend talk, with real request/response examples.
- `backend.md` — backend endpoints and the upload pipeline explained line by line.
- `rag.md` — how "real proof per concern" works, plus interview-style questions.
- `ml.md` — the sentiment model explained from zero, step by step, with examples.
- `sample_csvs/` — 6 ready-to-upload product CSVs, each highlighting a different concern.

---

## License

For hackathon / educational use.
