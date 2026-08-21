# Backend Flow — FastAPI in detail

This document explains the backend the same way `internal_flow.md` does, but focused only on the server side. Read it if you want to understand every endpoint and the upload pipeline line by line.

Backend code lives in `src/cfa/`.

---

## 1. The server (`api/main.py`)

The server is a FastAPI app. FastAPI gives us automatic API docs at `/docs`.

### CORS (so the Vercel frontend can call it)

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

This says: "I will accept calls from the local dev server and from any Vercel deployment of our frontend."

---

## 2. Endpoints

### GET `/health`
Returns a counter of how many reviews were analyzed and the average latency.
```json
{"status": "ok", "reviews_analyzed": 2002, "avg_latency_ms": 0.0}
```

### GET `/api/v1/ping`
Simple liveness check.
```json
{"message": "CFA backend is alive"}
```

### POST `/api/v1/upload`
The main one. Receives the CSV file and returns the full stats.
```python
@app.post("/api/v1/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    return process_csv(content)
```

### GET `/api/v1/stats`
Combines several readers into one response.
```python
@app.get("/api/v1/stats")
def stats():
    data = get_stats()
    data["countries"] = get_countries()
    data["time_trend"] = get_time_trend()
    data["ratings"] = get_ratings()
    return data
```

### GET `/api/v1/reviews`
Returns the raw list of saved reviews.

### POST `/api/v1/analyze`
Analyze a single review text (used by the Analyzer screen).
```python
result = analyze_review(req.review_text)
```

### GET `/api/v1/concern-comments?concern=battery`
Returns the proof reviews for one concern (the RAG output saved at upload time).

---

## 3. The upload pipeline (`api/pipeline.py`) — step by step

Let us follow one CSV row through the system.

### Input CSV (example, Kaggle format)

```csv
Reviewer Name,Profile Link,Country,Review Count,Review Date,Rating,Review Title,Review Text,Date of Experience
User3,/users/3,US,1 review,2024-03-15T10:00:00.000Z,Rated 1 out of 5 stars,Bad,Battery drains very fast,2024-03-15T10:00:00.000Z
```

### Step 3.1 — Find columns
The code looks at the header row and matches column names:
- text column → `Review Text`
- rating column → `Rating`
- country column → `Country`
- date column → `Date of Experience`
- reviewer column → `Reviewer Name`

This is why both Kaggle format and a simple `review_text,rating,date` format work.

### Step 3.2 — For each row
```python
text = (row.get(text_col) or "").strip()
if not text:
    continue                      # skip empty rows
result = analyze_review(text, include_similar=False)
sentiment = "positive" if result["overall_sentiment"] == "positive" else "negative"
```

`analyze_review` returns the sentiment and the list of concerns (e.g. `[{name: "battery", ...}]`).

### Step 3.3 — Parse the rating
The Kaggle rating is the string `"Rated 1 out of 5 stars"`. We extract the first number:
```python
raw_rating = row.get(rating_col)          # "Rated 1 out of 5 stars"
match = re.search(r"\d+", str(raw_rating)) # finds "1"
rating = int(match.group())               # 1
```
If the rating is already a plain number like `3`, the same code gives `3`. If missing, `rating = None`.

### Step 3.4 — Build one review object
```python
reviews.append({
    "review_id": "a1b2c3d4",     # random 8-char id
    "text": "Battery drains very fast",
    "entity": "battery",          # first concern, or "general"
    "sentiment": "negative",
    "rating": 1,
    "country": "US",
    "date": "2024-03-15T10:00:00.000Z",
    "reviewer": "User3",
})
```

### Step 3.5 — Count concerns
We keep a running tally:
```python
concern_counts["battery"] = {"count": 1, "negative": 1, "texts": ["Battery drains very fast"]}
```
Every time "battery" appears, `count` goes up and `negative` goes up if the sentiment was negative.

### Step 3.6 — Save reviews
```python
REVIEWS_PATH.write_text(json.dumps(reviews, indent=2))   # data/reviews.json
```
From now on, `data/reviews.json` holds every review. This is what the Dashboard reads.

### Step 3.7 — Rank concerns
```python
ranked = rank_concerns({ "concerns": [ {name, count, negative_pct}, ... ] })
```
See `ranking/priority.py`: impact = normalized(count × negative_pct). Result example:
```json
[{"concern": "battery", "count": 11, "negative_pct": 36.4, "impact": 100, "priority": 1}]
```

### Step 3.8 — Build proof + comments (RAG)
```python
proof_by_concern = { name: [{"text": t, "similarity": 1.0} for t in texts[:3]] }

for name in concern_counts:
    for s in find_similar(name.replace("_", " "), top_k=5):
        # attach the real review behind that similarity
        comments_by_concern[name].append({reviewer, text, rating, country, date, sentiment, similarity})
```
This is the "real proof" the Dashboard shows.

### Step 3.9 — Save stats
```python
CONCERN_STATS_PATH.write_text(json.dumps(stats, indent=2))   # data/concern_stats.json
```

### Step 3.10 — Return
The whole `stats` dict is returned to the browser as JSON.

---

## 4. Reading results (`analysis/stats.py`)

The Dashboard never recomputes. It calls readers that just read the saved files:

- `get_stats()` → reads `concern_stats.json`
- `get_reviews()` → reads `reviews.json`
- `get_countries()` → counts countries, returns top 10
- `get_time_trend()` → for each review, extract the 4-digit year:
  ```python
  match = re.search(r"\d{4}", date)   # "2024-03-15" -> "2024", "August 16, 2024" -> "2024"
  ```
- `get_ratings()` → counts star values, skips `None`

Because it only reads saved data, the numbers are always the real ones from your CSV.

---

## 5. Data storage and why it is gitignored

`config.py`:
```python
DATA_DIR = PROJECT_ROOT / "data"
CONCERN_STATS_PATH = DATA_DIR / "concern_stats.json"
REVIEWS_PATH = DATA_DIR / "reviews.json"
MODEL_PATH = PROJECT_ROOT / "models" / "sentiment_model.joblib"
```

`data/` and `models/` are in `.gitignore`. So:
- The repo never contains fake/stored results.
- A fresh deploy starts empty; the first upload creates the files.
- The model files are also excluded, so a fresh deploy uses the **keyword fallback** (see `ml.md`) until someone trains and adds the model.

---

## 6. Example: full upload response

Request:
```
POST /api/v1/upload
file: 6_luxewatch_price.csv
```

Response (trimmed):
```json
{
  "total_reviews": 16,
  "sentiment_distribution": {"positive": 11, "negative": 5},
  "ranked_concerns": [
    {"concern": "price", "count": 11, "negative_pct": 36.4, "impact": 100, "priority": 1},
    {"concern": "battery", "count": 1, "negative_pct": 0.0, "impact": 0, "priority": 2}
  ],
  "ratings": {"1": 6, "2": 5, "4": 2, "5": 3},
  "countries": {"US": 2, "GB": 2, "CA": 2, "IN": 2, "DE": 2, "FR": 2, "AU": 2, "JP": 2},
  "time_trend": [{"year": "2024", "count": 16}],
  "comments_by_concern": {
    "price": [
      {"reviewer": "User23", "text": "Price is too high for the specs", "rating": 2, "country": "US", "date": "2024-01-23T10:00:00.000Z", "sentiment": "negative", "similarity": 1.0}
    ]
  }
}
```

The Dashboard uses `ranked_concerns` for the priority list, `ratings`/`countries`/`time_trend` for the three charts, and `comments_by_concern["price"]` for the View Comments modal.

---

## 7. How to run the backend locally

```bash
cd src/cfa
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

Then open `http://localhost:8000/docs` to see the interactive API.
