# Backend — the server explained simply

> The **backend** is the hidden server that does the thinking. It is written in Python using **FastAPI** (a tool that makes web APIs easy). This file explains every endpoint and the upload pipeline, line by line, in plain words.

Backend code lives in `src/cfa/`.

---

## 1. The server (`api/main.py`)

FastAPI gives us automatic API docs at `/docs`.

### CORS (so the website can call it)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://customer-feedback-insight-system.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)
```
This says: "I accept calls from the local app and from any Vercel deployment of our website."

---

## 2. Auth endpoints (real login now)

All data endpoints need a **token** (a temporary digital pass). You get it by signing up or logging in.

### POST `/api/v1/auth/signup`
Body: `{username, password}` → creates the account (password scrambled safely), returns `{message, token}`.

### POST `/api/v1/auth/login`
Body: `{username, password}` → checks the password, returns `{token}`.

### GET `/api/v1/auth/me`
Needs token. Returns `{username}`. Proof the token works.

How auth works inside (`api/auth.py` + `db/repo.py`, no extra libraries):
- Passwords are scrambled with `pbkdf2` (a one-way scramble) — we never store the plain password.
- The token is a **JWT** (a signed ticket) made with `hmac` + `hashlib`. It is valid for 1 hour.
- Users are stored in the database (`users` table) via `db.repo`. Accounts and uploaded results persist across restarts and re-deploys.

---

## 3. Data endpoints (need token)

### GET `/health`
A counter of how many reviews were analyzed and the average time. No token needed.
```json
{"status": "ok", "reviews_analyzed": 2002, "avg_latency_ms": 0.0}
```

### GET `/api/v1/ping`
"Is the server alive?" No token needed.

### POST `/api/v1/upload`
The main one. Receives the CSV file, analyzes it, saves the result to the database (one row per user, last 3 kept), and returns the full stats.
```python
@app.post("/api/v1/upload")
async def upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    content = await file.read()
    stats = process_csv(content)
    save_analysis(user.id, file.filename, stats)
    return stats
```

### GET `/api/v1/stats`
Combines several readers into one response (countries, time trend, ratings).

### GET `/api/v1/reviews`
Returns the saved review list.

### POST `/api/v1/analyze`
Analyze a single review text (used by the Analyzer screen).

### GET `/api/v1/concern-comments?concern=battery`
Returns the proof reviews for one concern (the RAG output saved at upload time).

### GET `/api/v1/history`
Returns the user's last 3 uploaded analyses (filename, time, total reviews, top concerns). Older uploads are pruned automatically.

---

## 4. The upload pipeline (`api/pipeline.py`) — step by step

We follow one CSV row through the system.

### Step 4.1 — Find columns
The code matches column names: text → `Review Text`, rating → `Rating`, country → `Country`, date → `Date of Experience`, reviewer → `Reviewer Name`. This is why both Kaggle format and a simple `review_text,rating,date` format work.

### Step 4.2 — For each row
```python
text = (row.get(text_col) or "").strip()
if not text:
    continue                      # skip empty rows
result = analyze_review(text, include_similar=False)
sentiment = "positive" if result["overall_sentiment"] == "positive" else "negative"
```
`analyze_review` returns the sentiment and the list of concerns.

### Step 4.3 — Parse the rating
Kaggle rating is the string `"Rated 1 out of 5 stars"`. We extract the first number → `1`. A plain `3` also gives `3`. Missing → `None`.

### Step 4.4 — Build one review object
```python
reviews.append({
    "review_id": "a1b2c3d4",
    "text": "Battery drains very fast",
    "entity": "battery",
    "sentiment": "negative",
    "rating": 1,
    "country": "US",
    "date": "2024-03-15T10:00:00.000Z",
    "reviewer": "User3",
})
```

### Step 4.5 — Count concerns
A running tally: every time "battery" appears, `count` goes up and `negative` goes up if the sentiment was negative.

### Step 4.6 — Save reviews
`data/reviews.json` holds every review. This is what the Dashboard reads.

### Step 4.7 — Rank concerns
`rank_concerns(...)` → impact score (see `ranking/priority.py`). Example:
```json
[{"concern": "battery", "count": 11, "negative_pct": 36.4, "impact": 100, "priority": 1}]
```

### Step 4.8 — Build proof (RAG)
For each concern we call `find_similar(name)` to fetch the top-5 real reviews, stored as `comments_by_concern`. This is the "real proof" the Dashboard shows.

### Step 4.9 — Save stats
`data/concern_stats.json` holds the summary.

### Step 4.10 — Return
The whole stats dict goes back to the browser as JSON.

---

## 5. Reading results (`analysis/stats.py`)

The Dashboard never recomputes. It calls readers that just read the saved files:
- `get_stats()` → `concern_stats.json`
- `get_reviews()` → `reviews.json`
- `get_countries()` → top 10
- `get_time_trend()` → 4-digit year from each date
- `get_ratings()` → star counts

Because it only reads saved data, the numbers are always the real ones from your CSV.

---

## 6. Data storage

Connection is `DATABASE_URL` (see `db/core.py`). With it set, results go to **Aiven MySQL** (`users` + `analyses` tables). With it unset, a local **SQLite** file (`data/app.db`) is used as a fallback.

`config.py`:
```python
DATA_DIR = Path(os.environ.get("DATA_DIR", PROJECT_ROOT / "data"))
REVIEWS_PATH = DATA_DIR / "reviews.json"   # only a fallback for RAG if no DB reviews
MODEL_PATH = PROJECT_ROOT / "models" / "sentiment_model.joblib"
```

- Every result is stored per user in the `analyses` table; only the **last 3 analyses per user** are kept.
- `data/` (SQLite fallback) is gitignored → the repo never ships fake results.
- `models/` (the trained model files) **are committed** → the cloud uses the real trained model, not just the fallback.

---

## 7. Example: full upload response

Request: `POST /api/v1/upload` with `6_luxewatch_price.csv`

Response (trimmed):
```json
{
  "total_reviews": 16,
  "sentiment_distribution": {"positive": 11, "negative": 5},
  "ranked_concerns": [
    {"concern": "price", "count": 11, "negative_pct": 36.4, "impact": 100, "priority": 1}
  ],
  "ratings": {"1": 6, "2": 5, "4": 2, "5": 3},
  "countries": {"US": 2, "GB": 2, "CA": 2},
  "time_trend": [{"year": "2024", "count": 16}],
  "comments_by_concern": {
    "price": [{"reviewer": "User23", "text": "Price is too high", "rating": 2, "country": "US", "date": "2024-01-23", "sentiment": "negative", "similarity": 1.0}]
  }
}
```

---

## 8. How to run the backend locally

```bash
cd src/cfa
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```
Then open `http://localhost:8000/docs` to see the interactive API.
