> **Updated 2026-09-10 — Perfect BERT model (5 labels, no hard-coded list), flexible Any-CSV (ENGLISH_STOP_WORDS + dynamic 10%), online Aiven MySQL (no re-register), dashboard 80% + delete + timing + See more 5/10/55.**

# Internal Flow — How the pieces talk (simple version)

> This is for someone who wants to understand the **inside**: what each part of the code does, how the website talks to the server, what data goes back and forth, and how the smart parts (ML + RAG) work. Read `user_flow.md` first.

We will follow **one CSV upload** from the browser all the way to the charts.

---

## Part A — The frontend (website) side

### A1. Where the server address lives (`frontend/src/api.js`)

The website keeps a variable for the server address and switches it when you click LOCAL / DEPLOYED. Every call also sends your **token** (the digital pass from login) so the server knows who you are.

Helper functions wrap the network calls:
- `getStats()` → `GET .../stats`
- `getReviews()` → `GET .../reviews`
- `getConcernComments(concern)` → `GET .../concern-comments?concern=...`
- `analyzeReview(text)` → `POST .../analyze`
- `uploadReviews(file)` → `POST .../upload` (sends the file)
- `login(username, password)` / `signup(username, password)` → get a token

Auth helpers:
- `setToken(token)` / `getToken()` — save/read the token in the browser.

### A2. The Upload screen (`upload/Upload.jsx`)

When you click a button:
1. Check a file is chosen.
2. Set the server address (LOCAL or DEPLOYED).
3. Send the file: `await uploadReviews(file)`.
4. **Only if it succeeds**, open the Dashboard and refresh it.
5. If it fails, stay on the Upload page and show an error (we do NOT silently move on).

Order: **send file → on success show dashboard → fill with data.**

### A3. The Dashboard (`Dashboard.jsx`)

When loading finishes, it runs two calls together:
- `getStats()` → all numbers/charts
- `getReviews()` → the review list

Clicking **View Comments** on a concern calls `getConcernComments(concern)` and opens a popup with the real quotes.

---

## Part B — What goes over the network

**Request (browser → server), upload:**
```
POST https://cfa-api.onrender.com/api/v1/upload
Authorization: Bearer <your token>
file: <the CSV bytes>
```

**Response (server → browser)** is a JSON object (a tagged text box of data). Example:
```json
{
  "total_reviews": 30,
  "sentiment_distribution": {"positive": 20, "negative": 10},
  "ranked_concerns": [
    {"concern": "battery", "count": 11, "negative_pct": 36.4, "impact": 100, "priority": 1}
  ],
  "ratings":    {"1": 10, "2": 8, "4": 2, "5": 10},
  "countries":  {"US": 5, "GB": 5},
  "time_trend": [{"year": "2024", "count": 30}],
  "comments_by_concern": {
    "battery": [ {"reviewer":"User3","text":"Battery drains fast","rating":1,"country":"US","date":"2024-...","sentiment":"negative","similarity":0.83} ]
  }
}
```
The Dashboard reads fields like `ranked_concerns`, `ratings`, `countries`, `time_trend` and draws charts.

---

## Part C — The backend (server) side (`api/main.py`)

| Endpoint | What it does | Calls |
|----------|--------------|-------|
| `POST /api/v1/auth/signup` | create account, return token | auth |
| `POST /api/v1/auth/login` | verify password, return token | auth |
| `GET /api/v1/auth/me` | who am I (needs token) | auth |
| `POST /api/v1/upload` | analyze the CSV | `process_csv` |
| `GET /api/v1/stats` | all numbers + charts data | stats readers |
| `GET /api/v1/reviews` | the review list | `get_reviews` |
| `POST /api/v1/analyze` | analyze one review | `analyze_review` + `rank_concerns` |
| `GET /api/v1/concern-comments?concern=x` | proof quotes for a concern | saved stats |
| `GET /api/v1/ping` / `/health` | is server alive / counters | — |

CORS lets the Vercel website (and your laptop) talk to the Render server. All data endpoints except `/health` and `/ping` **require the token**.

---

## Part D — The upload pipeline (`api/pipeline.py`)

`process_csv(content)` does this, row by row:

1. **Find the columns by name** (flexible): text, rating, country, date, reviewer. This is why both the Kaggle format and a simple `review_text,rating,date` format work.
2. For each row with text:
   - `analyze_review(text)` → sentiment + list of concerns.
   - Convert sentiment to `positive` / `negative`.
   - Parse the rating: `"Rated 1 out of 5 stars"` → `1`.
   - Save one review object (id, text, sentiment, rating, country, date, reviewer).
3. Count how many times each concern appears, and how many are negative.
4. **Save** all reviews to `data/reviews.json`.
5. `rank_concerns(...)` → compute impact scores.
6. Build `comments_by_concern` (real reviews found by RAG — Part E).
7. **Save** the summary to `data/concern_stats.json`.
8. Return the stats object to the browser.

> Why do we skip per-row similarity during upload? Running the "find similar" step for every row of a big file is slow. So during bulk upload we compute the proof quotes **once at the end** — much faster.

---

## Part E — RAG: "show me real proof" (`analysis/rag.py`)

When you click a concern (e.g. `battery`), the server already saved `comments_by_concern["battery"]` during upload. That list was built by `find_similar("battery", top_k=5)`.

`find_similar` measures **word-overlap** between the concern name and each saved review, keeps the top 5 matches, and returns them as proof quotes. No neural network, no database — just simple word matching over the saved reviews. (Full detail + questions in `rag.md`.)

If no reviews are saved yet, it returns a safe placeholder so the popup never crashes.

---

## Part F — Ranking (`ranking/priority.py`)

Impact = what to fix first.
```
impact = (count × negative_pct) / max(count × negative_pct) × 100
```
Example: battery count 11, negative 36% → 11×36 = 396 (the max) → impact **100** (priority 1). Screen count 5, negative 20% → 100/396 → impact **25**. Simple, explainable, no black box.

---

## Part G — Sentiment ML (`ml/serve.py` + `ml/train.py`)

For each review, `predict_sentiment(text)` returns `{label, confidence}`.

We use a **hybrid** (two methods working together):
- **Trained model** (TF-IDF + Logistic Regression) for long, confident reviews.
- **Keyword fallback** (count good vs bad words) for very short or unsure reviews.

The trained model files are **committed to the repo**, so both your laptop and the cloud use the smart model. (Full detail in `ml.md`.)

---

## Part H — Reading results (`analysis/stats.py`)

The Dashboard never recomputes. It just reads the saved files:
- `get_stats()` → `concern_stats.json`
- `get_reviews()` → `reviews.json`
- `get_countries()` → top 10 countries
- `get_time_trend()` → year from each date
- `get_ratings()` → star counts

Because it only reads saved data, the numbers are always the real ones from your CSV.

---

## End-to-end in one breath

User uploads CSV → server analyzes each row (sentiment + concerns) → saves reviews.json + concern_stats.json → Dashboard fetches stats → charts draw → click a concern → see the real customer quotes. That is the whole flow.
