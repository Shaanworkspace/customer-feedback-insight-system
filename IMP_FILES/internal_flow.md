# Internal Flow — How the pieces talk (with examples)

This document is for someone who wants to understand the **internals**: what each part of the code does, how the frontend calls the backend, what JSON goes back and forth, how RAG works, and how the ML model works. Read this after `user_flow.md`.

We will follow **one CSV upload** from the browser all the way to the charts.

---

## Part A — The frontend side

### A1. Where the backend address lives (`frontend/src/api.js`)

The frontend does not hardcode one server. It keeps a variable `currentBase` and lets the Upload screen switch it.

```js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://cfa-api.onrender.com'
const LOCAL_BASE = 'http://localhost:8000'
const DEPLOYED_BASE = 'https://cfa-api.onrender.com'

let currentBase = API_BASE

export function setApiBase(base) { currentBase = base }   // Upload screen calls this
export function getApiBase() { return currentBase }
```

Helper functions wrap `fetch()`:
- `getStats()` → `GET {base}/api/v1/stats`
- `getReviews()` → `GET {base}/api/v1/reviews`
- `getConcernComments(concern)` → `GET {base}/api/v1/concern-comments?concern=...`
- `analyzeReview(text)` → `POST {base}/api/v1/analyze`
- `uploadReviews(file)` → `POST {base}/api/v1/upload` (sends the file as `FormData`)
- `pingBackend()` → `GET {base}/api/v1/ping`

### A2. The Upload screen (`upload/Upload.jsx`)

When you click **LOCAL** or **DEPLOYED**:

```js
const handleUpload = async (e, base) => {
  e.preventDefault()
  if (!file) { setError('Please choose a CSV file first.'); return }
  setBusy(true)
  setApiBase(base)     // 1) point at the chosen server
  onStart?.()          // 2) open Dashboard with loading state

  try {
    await uploadReviews(file)   // 3) POST the file to /api/v1/upload
  } catch (err) {
    console.error('Upload failed:', err)
  } finally {
    setBusy(false)
  }
  onDone()             // 4) turn off loading, refresh Dashboard
}
```

So the order is: **set server → open dashboard (loading) → send file → on reply, fill dashboard**.

### A3. The Dashboard (`Dashboard.jsx`)

```js
useEffect(() => {
  if (analyzing) return
  Promise.all([getStats(), getReviews()])
    .then(([s, r]) => { setStats(s); setReviews(r) })
    .catch(() => setError(true))
}, [analyzing, reloadKey])
```

- While `analyzing` is true → show grey skeletons.
- When `analyzing` becomes false (upload finished) → fetch stats + reviews together and draw charts.
- Clicking **View Comments** on a concern calls `getConcernComments(concern)` and opens a modal.

---

## Part B — The network call (what actually goes over the wire)

**Request** (from browser to backend), for upload:

```
POST https://cfa-api.onrender.com/api/v1/upload
Content-Type: multipart/form-data

file: <the CSV bytes>
```

**Response** (backend → browser) is a JSON object. Example (trimmed):

```json
{
  "total_reviews": 30,
  "sentiment_distribution": {"positive": 20, "negative": 10},
  "ranked_concerns": [
    {"concern": "battery", "count": 11, "negative_pct": 36.4, "impact": 100, "priority": 1},
    {"concern": "screen",  "count": 5,  "negative_pct": 20.0, "impact": 40,  "priority": 2}
  ],
  "ratings":    {"1": 10, "2": 8, "4": 2, "5": 10},
  "countries":  {"US": 5, "GB": 5, "CA": 4},
  "time_trend": [{"year": "2024", "count": 30}],
  "proof_by_concern": { "battery": [ {"text": "...", "similarity": 1.0} ] },
  "comments_by_concern": { "battery": [ {"reviewer":"User3","text":"...","rating":1,"country":"US","date":"2024-...","sentiment":"negative","similarity":0.83} ] }
}
```

The Dashboard reads fields like `ranked_concerns`, `ratings`, `countries`, `time_trend` and draws charts from them.

---

## Part C — The backend side (FastAPI, `api/main.py`)

Endpoints:

| Endpoint | Calls |
|----------|-------|
| `POST /api/v1/upload` | `process_csv(content)` |
| `GET /api/v1/stats` | `get_stats()` + `get_countries()` + `get_time_trend()` + `get_ratings()` |
| `GET /api/v1/reviews` | `get_reviews()` |
| `POST /api/v1/analyze` | `analyze_review(text)` + `rank_concerns(...)` |
| `GET /api/v1/concern-comments?concern=x` | reads `comments_by_concern[x]` from saved stats |
| `GET /api/v1/ping` | returns "alive" |
| `GET /health` | returns counters |

CORS is set so the Vercel frontend (and localhost) can call the Render backend.

---

## Part D — The upload pipeline (`api/pipeline.py`)

`process_csv(content)` does this, row by row:

1. **Find the columns** by name (flexible):
   - text column: `review_text` / `review` / `text` / …
   - rating column: `rating` / `stars`
   - country column: `country`
   - date column: `date` / `date of experience`
   - reviewer column: `reviewer name` / `author`
   (This is why both the Kaggle format and a simple format work.)
2. For each row with text:
   - `analyze_review(text, include_similar=False)` → returns sentiment + list of concerns.
   - Convert sentiment to `positive` / `negative`.
   - Parse the rating: `"Rated 1 out of 5 stars"` → `1`, or `"3"` → `3`.
   - Save one review object:
     ```json
     {
       "review_id": "a1b2c3d4",
       "text": "Battery drains very fast",
       "entity": "battery",
       "sentiment": "negative",
       "rating": 1,
       "country": "US",
       "date": "2024-03-15T10:00:00.000Z",
       "reviewer": "User3"
     }
     ```
3. Count how many times each concern appears, and how many are negative.
4. **Save** all reviews to `data/reviews.json`.
5. `rank_concerns(...)` → compute impact scores (see Part F).
6. Build `proof_by_concern` (first 3 texts per concern) and `comments_by_concern` (real reviews found by RAG — see Part E).
7. **Save** the summary to `data/concern_stats.json`.
8. Return the stats object to the browser.

> Why `include_similar=False` during upload? Running RAG for every row of a 21k file is slow. So during bulk upload we skip per-row similarity and instead compute `comments_by_concern` once at the end (much faster — this is what made upload drop from 120s to ~8s).

---

## Part E — RAG: "show me real proof" (`analysis/rag.py`)

When the Dashboard asks for comments on a concern (e.g. `battery`), the backend already saved `comments_by_concern["battery"]` during upload. That list was built by:

```python
find_similar("battery", top_k=5)
```

`find_similar` works like this:
1. Load all saved reviews from `reviews.json`.
2. For each review, measure **word-overlap** between the query ("battery") and the review text.
3. Keep the reviews with the highest overlap, take the top 5.
4. Return `{review_id, text_preview, similarity}`.

If there are no saved reviews yet, it returns a placeholder example so the UI never breaks.

Full walkthrough + interview questions are in `rag.md`.

---

## Part F — Ranking (`ranking/priority.py`)

Impact tells you what to fix first.

```
impact = (count × negative_pct) / max(count × negative_pct) × 100
```

Example:
- battery: count 11, negative 36% → 11 × 36 = 396
- screen: count 5, negative 20% → 5 × 20 = 100
- max = 396
- battery impact = 396 / 396 × 100 = **100**
- screen impact = 100 / 396 × 100 = **25**

So battery is priority 1 (impact 100), screen is lower. This is a simple, explainable formula — no black box.

---

## Part G — Sentiment ML (`ml/serve.py`)

For each review, `predict_sentiment(text)` returns `{label, confidence}`.

- If the trained model files exist → use TF-IDF + Logistic Regression.
- If they are missing (fresh checkout / cloud without model) → use a **keyword fallback**: count positive words vs negative words.

Full explanation in `ml.md`.

---

## Part H — Reading results (`analysis/stats.py`)

The Dashboard does not recompute anything. It just reads the saved files:
- `get_stats()` → reads `concern_stats.json`
- `get_reviews()` → reads `reviews.json`
- `get_countries()` → counts countries (top 10)
- `get_time_trend()` → extracts the 4-digit year from each date (handles both `"2024-03-15"` and `"August 16, 2024"`)
- `get_ratings()` → counts star values

Because it only reads saved data, the numbers are always the real ones from your CSV.

---

## End-to-end example (one sentence each)

1. User clicks Upload on `6_luxewatch_price.csv`.
2. Browser POSTs the file to `/api/v1/upload`.
3. `process_csv` reads 16 rows, tags each with sentiment + concern.
4. Reviews saved to `reviews.json`; summary saved to `concern_stats.json`.
5. Dashboard fetches `/api/v1/stats` and draws charts.
6. `price` shows as the top concern with real customer quotes behind it.

That is the whole internal flow.
