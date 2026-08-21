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
  api/             FastAPI endpoints + upload pipeline
  analysis/        concern detection + aspect sentiment + RAG retrieval
  ranking/         impact score + priority ranking
  ml/              sentiment prediction
  core/            config
frontend/          React app (dashboard, analyzer, explorer)
tests/             module tests
data/              dataset + saved stats (gitignored)
models/            trained artifacts (gitignored)
```

## Setup

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# run the API
uvicorn cfa.api.main:app --reload

# run the frontend
cd frontend && npm install && npm run dev
```

API docs available at http://localhost:8000/docs

## API endpoints

- GET /health - app status + counters
- POST /api/v1/analyze - one review -> sentiment, concerns, priority
- POST /api/v1/upload - CSV file -> full pipeline, returns dashboard stats
- GET /api/v1/stats - dashboard aggregates (real saved data)
- GET /api/v1/reviews - raw reviews for the explorer

## Data source

Amazon Reviews Dataset. Each review keeps its review text, entity and
sentiment in data/reviews.json. Aggregates (sentiment split, ranked
concerns, proof quotes) live in data/concern_stats.json.

## Architecture

### Current (simple)

Monolith: FastAPI serves both the analysis logic and the saved data.
Concerns are detected with a lexicon, sentiment with a keyword model.
Works end to end with one server process.

### Alternative A (async + queue)

Add a task queue (Celery + Redis) so large CSV uploads run in the
background. The upload endpoint returns a job id, the frontend polls
until the job finishes. Better for very large datasets.

### Alternative B (LLM pipeline)

Replace the keyword sentiment model with a batched LLM (e.g. Llama 3.3
via Groq). An LLM reads reviews in batches, returns entity + sentiment +
confidence for every review, and the Python side keeps counting, ranking
and RAG. Same output shape, higher accuracy on real-world language.

### Alternative C (vector RAG)

Replace the word-overlap RAG with embeddings (sentence-transformers)
stored in a vector store. Retrieval becomes semantic instead of exact
word match, so paraphrases are found too.

## Roadmap

- Phase 1 (done): dataset, lexicon concern detection, keyword sentiment,
  priority ranking, FastAPI endpoints, React dashboard, tests, CI/CD.
- Phase 2: batch LLM sentiment + entity extraction for real-world accuracy.
- Phase 3: background jobs for large uploads, semantic RAG.
- Phase 4: monitoring (latency, review counters), model evaluation
  (precision, recall, F1) on a labelled holdout set.

## Team

- Team lead - integration, docs, presentation
- Data + ML model
- Concern analysis + RAG
- Priority ranking + impact score
- Backend API + deployment
- Frontend UI