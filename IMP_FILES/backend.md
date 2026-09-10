# Backend — the server explained simply

> The **backend** is the hidden server that does the thinking. It is Python + **FastAPI**. This file matches the latest code (BERT perfect model, no hard-code).

Code lives in `src/cfa/`.

## 1. The server (`api/main.py`)

- `FastAPI(title="Customer Feedback Insight System")`
- `CORSMiddleware` allows `localhost:5173`, `localhost:4173`, `https://customer-feedback-insight-system.vercel.app` and `*.vercel.app`, `allow_credentials=True`.
- Rate limit: 60 req/min per IP (except `/health`, `/api/v1/ping`).
- `init_db()` creates `users` + `analyses` tables (MySQL via `DATABASE_URL`, else SQLite `data/app.db`).

## 2. Auth (real login, no fake)

- `POST /api/v1/auth/signup` → `add_user` (pbkdf2 scramble), returns `{token}`.
- `POST /api/v1/auth/login` → `authenticate` (verify pbkdf2), returns `{token}`.
- `GET /api/v1/auth/me` → needs `Bearer token`, returns `{username}`.
- Token is **JWT** (`hmac`+`hashlib`, `exp` 1h, `SECRET=JWT_SECRET` env, default `dev-secret...` for local).
- `db/repo.py`: `users` table, `create_user`/`get_user_by_username` with `IntegrityError` handling.

## 3. Data endpoints (need token)

- `GET /health` → `{status, reviews_analyzed, avg_latency_ms}` — no token.
- `GET /api/v1/ping` → `alive`.
- `POST /api/v1/upload` → main. Reads bytes, `process_csv`, `save_analysis` (keep last 3 per user), returns full stats.
- `GET /api/v1/stats` → `get_stats(user.id)` (latest analysis).
- `GET /api/v1/reviews` → `get_reviews`.
- `POST /api/v1/analyze` → one review via `analyze_review` + `rank_concerns`.
- `GET /api/v1/concern-comments?concern=battery` → RAG proof.
- `GET /api/v1/history` → last 3 (`id, filename, created_at, total_reviews, top_concerns`).
- `GET /api/v1/history/{id}` → full data for one analysis.
- `DELETE /api/v1/history/{id}` → `delete_analysis` (new: delete button on dashboard).

All except `health/ping` use `Depends(get_current_user)` which checks `Authorization: Bearer <token>` and returns `401 Invalid or expired token` if bad. Frontend `api.js` clears token and redirects to `/?view=login` on `401`.

## 4. The upload pipeline (`api/pipeline.py`) — step by step, small helpers

We follow one CSV row through the system. Helpers are 8–25 lines each, easy names.

- **Find columns** — `preprocessing.py:find_text_column()` checks candidates `review_text, review, comment, text...` case-insensitive, so any CSV layout works (minimal: just `review_text`).
- **For each row** — `preprocess_csv(content)` → `cleanedRows` (`text, rating, country, date, reviewer, attributes`), skips empty.
- **Analyze** — `analyze_reviews([row["text"] for row in cleanedRows])`:
  - `analysis/extract.py`: `_bert_aspects()` first (if `bert_aste_final/` exists, no list), else `_llm_batch()` if `HF_TOKEN`, else `_dynamic_fallback_batch()` (per-CSV frequent nouns via `ENGLISH_STOP_WORDS` + `dynamicMinCount = 3 if >20 else 2` + word-alone sentiment filter — no product hard-code).
  - `analysis/sentiment.py`: `SentimentClassifier.classify()` counts `pos/neg` from `aspects` → `Mixed` if both, else `Positive/Negative/Neutral` (no word list, no second classifier).
- **Build reviews** — `buildReviewsForStorage()` makes `review_id` (uuid), `entity`, `sentiment`, `rating` (first number via regex), `country`, `date`, `concerns`, `aspects`, and `concernAggregator.add(name, sentiment, text)`.
- **Counts** — `buildSentimentDistribution()` → `positive/negative/neutral/mixed`, `rank_concerns({"concerns": agg.stats()})` → `impact = count × negative_pct`, `proof` + `comments_by_concern` via `find_similar` (word overlap, no vector DB).
- **Charts** — `_ratings`, `_countries`, `extractMonthTrend` (regex `YYYY-MM`).
- **Save** — `save_analysis(user_id, filename, stats)` + `ReportStore.save_json` → `analyses` table (keep 3). On `data/app.db` fallback, file is created via `DATA_DIR.mkdir`.

**Error handling is split, not one big try:** `readUploadFileSafely`, `decodeCsvBytesToText`, `processCsvBytesToStats` each raise `HTTPException(400/500)` with a clear message, shown in the frontend red alert.

## 5. Reading results (`analysis/stats.py`, `db/repo.py`)

Dashboard never recomputes. It reads the latest saved `data`:
- `get_stats()` → `total_reviews, sentiment_distribution, ranked_concerns, ratings, countries, time_trend, proof, comments, reviews`
- `get_reviews()` → list of review objects
- `get_concern_comments()` → top similar reviews for one concern

## 6. Data storage

- `DATABASE_URL=mysql+pymysql://...@aivencloud.com:14273/cfa` (from `.env` or EC2 env `sync: false`) → **Aiven MySQL** (`users`, `analyses` JSON). Without it, `sqlite:///data/app.db`.
- `JWT_SECRET` env → stable token (default `dev-secret...` for local).
- `config.py`: `BERT_ASTE_DIR = PROJECT_ROOT / "bert_aste_final"` (400MB, gitignored until trained), `MODEL_PATH` legacy TF-IDF kept.
- `data/` is gitignored → repo never ships fake results.

## 7. Example upload response

`POST /api/v1/upload` with `bluetooth_speaker_reviews.csv` (48 rows, 4 cols):

```json
{
  "total_reviews": 48,
  "sentiment_distribution": {"positive": 7, "negative": 27, "neutral": 1, "mixed": 13},
  "ranked_concerns": [{"concern": "battery", "count": 9, "negative_pct": 77.8, "impact": 100, "priority": 1}],
  "ratings": {"1": 12, "2": 8, "5": 20},
  "countries": {"India": 15, "USA": 18},
  "time_trend": [{"month": "2024-01", "count": 10}],
  "reviews": [{"review_id": "a1b2c3d4", "text": "Battery drains...", "sentiment": "negative", "concerns": [{"name": "battery", "sentiment": "negative"}]}]
}
```

## 8. How to run locally (online DB)

```bash
# .env must have DATABASE_URL (Aiven) and JWT_SECRET
cat .env  # DATABASE_URL=mysql+pymysql://...
cd src/cfa
python -m venv .venv; source .venv/bin/activate
pip install -r requirements.txt  # includes transformers, torch, datasets
PYTHONPATH=src uvicorn cfa.api.main:app --host 0.0.0.0 --port 8000  # uses MySQL, not SQLite
# Frontend in another terminal
cd frontend; npm install; npm run dev  # http://localhost:5173
```

Check `http://localhost:8000/health` and `http://localhost:8000/docs`.
