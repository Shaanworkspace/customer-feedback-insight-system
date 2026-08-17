# Customer Feedback Insight System (FeedSight)

**Cognizant Hackathon — Sentiment Analysis of Customer Reviews**

A lightweight customer feedback analysis system using the Amazon Reviews Dataset. It classifies customer sentiment, identifies key concerns and their sentiment, summarizes concern-level trends, and provides both aggregate analysis (dashboard) and real-time review analysis.

## Problem

Businesses struggle to analyze large volumes of customer feedback. Reading thousands of reviews manually is impossible. We answer: *"What are customers unhappy about?"* — not just *"Are they happy or unhappy?"*

## Solution

```
Review
  → Overall Sentiment
  → Key Concerns
  → Concern-level Sentiment
  → Concern Frequency
  → Negative Percentage
  → Priority Concern
```

## Tech Stack

| Layer | Technology |
|---|---|
| ML / Data | Python, scikit-learn, pandas, numpy |
| Concern analysis + RAG | Python + curated lexicon + TF-IDF cosine similarity |
| API | FastAPI + uvicorn |
| Frontend | React (Vite) + Recharts |
| Deployment | Render (free tier) |
| CI/CD | GitHub Actions |

## Project Structure (monorepo)

```
├── src/cfa/           # backend package (pip install -e .)
│   ├── data/          # dataset download + preprocessing
│   ├── ml/            # sentiment model training + evaluation
│   ├── analysis/      # concern detection + aspect sentiment + RAG
│   ├── ranking/       # impact score + priority ranking
│   ├── api/           # FastAPI endpoints (/analyze /stats /health)
│   └── core/          # config
├── frontend/          # React app (Dashboard, Analyzer, Explorer)
├── tests/             # per-module tests
├── models/            # trained artifacts (gitignored)
├── data/              # dataset (gitignored)
└── render.yaml        # Render free-tier deployment config
```

## Quick Start

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# 1. Download + sample the Amazon reviews dataset
python -m cfa.data.download

# 2. Train the sentiment model
python -m cfa.ml.train

# 3. Run the API
uvicorn cfa.api.main:app --reload
# → http://localhost:8000/docs
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | App status + counters (monitoring) |
| POST | `/analyze` | One review → sentiment, concerns, concern-level sentiment, similar-review evidence |
| GET | `/stats` | Dashboard aggregates |

## Data Source

Amazon Reviews Dataset (McAuley corpus via public `amazon_polarity` collection). Real Amazon customer reviews with star ratings; sentiment labels derived as 1–2★ negative, 4–5★ positive. All reported metrics come from actual evaluation — never fabricated.

## Roadmap

- **Day 1** Dataset + preprocessing + sentiment model + evaluation
- **Day 2** Concern identification + aspect sentiment + RAG + priority ranking
- **Day 3** FastAPI endpoints + React Dashboard + Analyzer
- **Day 4** Tests, docs, CI/CD, Render deploy, demo video, presentation

## Team

- SHAAN — Team Lead, integration, docs, presentation
- Reekaal — Data + ML model
- Ram Ashish + Sharad — Concern analysis + RAG
- Shikhar — Priority ranking + impact score
- Rohan + Sachidanand — Backend API + deployment
- Shivang — Frontend UI
