# Customer Feedback Insight System

Hackathon project: Sentiment Analysis of Customer Reviews using the Amazon Reviews Dataset.

The system reads customer reviews, classifies sentiment, finds which product aspects
customers complain about (battery, camera, delivery, price), and shows what needs fixing
first. It has a dashboard for aggregate analysis and a live analyzer for single reviews.

## How it works

Review -> overall sentiment -> detected concerns -> concern-level sentiment ->
concern frequency -> negative percentage -> priority ranking.

## Project structure

```
src/cfa/           backend package
  data/            dataset download + preprocessing
  ml/              sentiment model training + evaluation
  analysis/        concern detection + aspect sentiment + RAG
  ranking/         impact score + priority ranking
  api/             FastAPI endpoints
  core/            config
frontend/          React app
tests/             module tests
data/              dataset (gitignored)
models/            trained artifacts (gitignored)
```

## Setup

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# download + sample the dataset
python -m cfa.data.download

# train the sentiment model
python -m cfa.ml.train

# run the API
uvicorn cfa.api.main:app --reload
```

API docs available at http://localhost:8000/docs

## API endpoints

- GET /health - app status + counters
- POST /analyze - one review -> sentiment, concerns, concern-level sentiment
- GET /stats - dashboard aggregates

## Data source

Amazon Reviews Dataset (McAuley corpus via the public amazon_polarity collection).
Sentiment labels are derived from star ratings (1-2 star negative, 4-5 star positive).

## Roadmap

- Day 1: dataset, preprocessing, sentiment model, evaluation
- Day 2: concern identification, aspect sentiment, RAG, priority ranking
- Day 3: FastAPI endpoints, React dashboard + analyzer
- Day 4: tests, docs, CI/CD, deployment, demo

## Team

- SHAAN - team lead, integration, docs, presentation
- Reekaal - data + ML model
- Ram Ashish, Sharad - concern analysis + RAG
- Shikhar - priority ranking + impact score
- Rohan, Sachidanand - backend API + deployment
- Shivang - frontend UI
