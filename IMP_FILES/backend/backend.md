# BACKEND — What the backend needs and what it returns

This document shows what the BACKEND must do.
It connects every module and serves the frontend.

The backend is the middle man:

```text
frontend  <--->  backend  <--->  LLM + Analysis + RAG + Ranking
```

It receives the upload, calls the modules,
saves the result, and returns the exact data
the frontend expects.

The frontend expects the outputs written in frontend.md.
This document shows what the backend needs from each module
to build those outputs, with MOCK data for every input.

---

## PART 1 — THE 4 ENDPOINTS (what the backend serves)

The backend must serve exactly these 4 requests.
No more.

```text
1. POST /api/v1/upload   -> user uploads a CSV
2. GET  /api/v1/stats    -> the dashboard data
3. GET  /api/v1/reviews  -> the reviews list
4. GET  /api/v1/status   -> analysis progress
```

The rest of this document shows, for every endpoint,
what data the backend needs and what it returns.

---

## PART 2 — POST /api/v1/upload

### 2.1 What the backend receives

A CSV file from the frontend.

```text
review_text,rating,date
battery drains fast,1,2026-01-01
great camera quality,5,2026-01-02
delivery was very late,1,2026-01-03
screen is too dim,2,2026-01-04
price is too high for this,2,2026-01-05
battery life is terrible,1,2026-01-06
```

### 2.2 What the backend does first (validation + cleaning)

1. If the file is empty -> return error:
   {"error": "File is empty. Upload again."}

2. Remove empty reviews, very short reviews
   (less than 10 letters), and duplicates.

3. If 0 reviews are left -> return error:
   {"error": "No valid reviews found."}

4. Count the remaining reviews. This is total_reviews.

### 2.3 What the backend does next (runs the pipeline)

The backend calls the modules IN THIS ORDER.
Each module needs the output of the previous one.

```text
STEP A  LLM module      -> reads the reviews in batches
STEP B  Analysis module -> counts and filters the concerns
STEP C  RAG module      -> finds proof quotes
STEP D  Ranking module  -> sorts by priority
```

### 2.4 What the backend needs FROM EACH MODULE

#### From the LLM module (STEP A)

Input the backend gives:
the clean reviews, split into batches of 25 to 30.

MOCK input (what the backend sends to the LLM):

```json
{
  "batches": [
    ["battery drains fast", "great camera quality", "delivery was very late"],
    ["screen is too dim", "price is too high for this", "battery life is terrible"]
  ]
}
```

Output the backend expects back:

```json
[
  {"index": 0, "aspects": [{"entity": "battery", "sentiment": "negative", "confidence": 0.9}]},
  {"index": 1, "aspects": [{"entity": "camera", "sentiment": "positive", "confidence": 0.9}]},
  {"index": 2, "aspects": [{"entity": "delivery", "sentiment": "negative", "confidence": 0.85}]},
  {"index": 3, "aspects": [{"entity": "screen", "sentiment": "negative", "confidence": 0.8}]},
  {"index": 4, "aspects": [{"entity": "price", "sentiment": "negative", "confidence": 0.8}]},
  {"index": 5, "aspects": [{"entity": "battery", "sentiment": "negative", "confidence": 0.9}]}
]
```

#### From the Analysis module (STEP B)

Input the backend gives:
the LLM output (the list above).

Output the backend expects back:

```text
concern    | count | positive | negative | negative_pct
battery    | 48    | 10       | 38       | 79.2
camera     | 35    | 30       | 5        | 14.3
delivery   | 20    | 9        | 11       | 55.0
screen     | 12    | 3        | 9        | 75.0
price      | 10    | 7        | 3        | 30.0
```

Plus the total sentiment: 100 reviews, 61 positive, 39 negative.

The analysis module ALSO applies the two filters
(support >= 5 reviews, negative ratio > overall negative ratio).

```text
battery   79.2%  > 39%  -> KEEP
delivery  55.0%  > 39%  -> KEEP
screen    75.0%  > 39%  -> KEEP
camera    14.3%  < 39%  -> DROP
price     30.0%  < 39%  -> DROP
```

So the backend receives only the KEPT concerns:
battery, delivery, screen.

#### From the RAG module (STEP C)

Input the backend gives:
the kept concerns (battery, delivery, screen).

Output the backend expects back:

```text
battery quotes:
- {"review_id": "r1", "text": "battery dies in 2 hours", "similarity": 0.92}
- {"review_id": "r3", "text": "battery drains very fast", "similarity": 0.89}
- {"review_id": "r6", "text": "worst battery life ever", "similarity": 0.85}

delivery quotes:
- {"review_id": "r9", "text": "delivery was very late", "similarity": 0.90}
- {"review_id": "r12", "text": "package came after 5 days", "similarity": 0.87}
- {"review_id": "r14", "text": "delivery took too long", "similarity": 0.83}
```

#### From the Ranking module (STEP D)

Input the backend gives:
the kept concerns with their counts and negative_pct.

Output the backend expects back:

```json
[
  {"concern": "battery",  "count": 48, "negative_pct": 79.2, "impact": 100, "priority": 1},
  {"concern": "delivery", "count": 20, "negative_pct": 55.0, "impact": 29,  "priority": 2},
  {"concern": "screen",   "count": 12, "negative_pct": 75.0, "impact": 24,  "priority": 3}
]
```

### 2.5 What the backend saves

The backend saves everything into one file:
concern_stats.json

```json
{
  "total_reviews": 100,
  "sentiment_distribution": {"positive": 61, "negative": 39},
  "ranked_concerns": [
    {"concern": "battery",  "count": 48, "negative_pct": 79.2, "impact": 100, "priority": 1},
    {"concern": "delivery", "count": 20, "negative_pct": 55.0, "impact": 29,  "priority": 2},
    {"concern": "screen",   "count": 12, "negative_pct": 75.0, "impact": 24,  "priority": 3}
  ],
  "representative_reviews": [
    {"review_id": "r1", "text": "battery dies in 2 hours", "sentiment": "negative"},
    {"review_id": "r2", "text": "great camera quality", "sentiment": "positive"}
  ]
}
```

### 2.6 What the backend returns to the frontend

The same saved file is the response.
The frontend uses it to fill the dashboard.

---

## PART 3 — GET /api/v1/stats

### 3.1 What the backend does

The backend opens the saved file concern_stats.json.

IF the file exists
THEN it reads the summary from the file.
ELSE
THEN it uses a default summary (the page must not break).

### 3.2 What the backend returns (exact JSON)

```json
{
  "total_reviews": 100,
  "sentiment_distribution": {
    "positive": 61,
    "negative": 39
  },
  "ranked_concerns": [
    {"concern": "battery",  "count": 48, "negative_pct": 79.2, "impact": 100, "priority": 1},
    {"concern": "delivery", "count": 20, "negative_pct": 55.0, "impact": 29,  "priority": 2},
    {"concern": "screen",   "count": 12, "negative_pct": 75.0, "impact": 24,  "priority": 3}
  ],
  "representative_reviews": [
    {"review_id": "r1", "text": "battery dies in 2 hours", "sentiment": "negative"},
    {"review_id": "r2", "text": "great camera quality", "sentiment": "positive"}
  ]
}
```

This is exactly what frontend.md PART 6.2 expects.

---

## PART 4 — GET /api/v1/reviews

### 4.1 What the backend does

The backend keeps the reviews with their detected concern
and sentiment. It returns them as a list.

### 4.2 What the backend returns (exact JSON)

```json
[
  {"review_id": "r1", "text": "battery dies in 2 hours",     "concern": "battery",  "sentiment": "negative"},
  {"review_id": "r2", "text": "great camera quality",        "concern": "camera",   "sentiment": "positive"},
  {"review_id": "r3", "text": "battery drains very fast",    "concern": "battery",  "sentiment": "negative"},
  {"review_id": "r4", "text": "delivery was very late",      "concern": "delivery", "sentiment": "negative"},
  {"review_id": "r5", "text": "screen is too dim",           "concern": "screen",   "sentiment": "negative"},
  {"review_id": "r6", "text": "worst battery life ever",     "concern": "battery",  "sentiment": "negative"}
]
```

This is exactly what frontend.md PART 6.3 expects.
The frontend builds the Reviews table and filters from this list.

---

## PART 5 — GET /api/v1/status

### 5.1 What the backend does

While the upload pipeline is running, the backend tracks
how many reviews are done.

### 5.2 What the backend returns (exact JSON)

While processing:

```json
{
  "status": "processing",
  "done": 40,
  "total": 100
}
```

When finished:

```json
{
  "status": "done",
  "done": 100,
  "total": 100
}
```

This is exactly what frontend.md PART 6.4 expects.
The frontend sections poll this while they are loading.

---

## PART 6 — MOCK DATA SUMMARY (what the backend can test with)

The backend can build everything with MOCK data first.
Here is one full mock set, all in one place.

```json
{
  "total_reviews": 100,
  "sentiment_distribution": {"positive": 61, "negative": 39},
  "ranked_concerns": [
    {"concern": "battery",  "count": 48, "negative_pct": 79.2, "impact": 100, "priority": 1},
    {"concern": "delivery", "count": 20, "negative_pct": 55.0, "impact": 29,  "priority": 2},
    {"concern": "screen",   "count": 12, "negative_pct": 75.0, "impact": 24,  "priority": 3}
  ],
  "representative_reviews": [
    {"review_id": "r1", "text": "battery dies in 2 hours", "sentiment": "negative"},
    {"review_id": "r2", "text": "great camera quality", "sentiment": "positive"}
  ],
  "reviews": [
    {"review_id": "r1", "text": "battery dies in 2 hours", "concern": "battery", "sentiment": "negative"},
    {"review_id": "r2", "text": "great camera quality", "concern": "camera", "sentiment": "positive"},
    {"review_id": "r3", "text": "battery drains very fast", "concern": "battery", "sentiment": "negative"},
    {"review_id": "r4", "text": "delivery was very late", "concern": "delivery", "sentiment": "negative"},
    {"review_id": "r5", "text": "screen is too dim", "concern": "screen", "sentiment": "negative"},
    {"review_id": "r6", "text": "worst battery life ever", "concern": "battery", "sentiment": "negative"}
  ]
}
```

The backend person can use this mock set
to build all 4 endpoints and test them
before the real modules are ready.

---

## PART 7 — RULES FOR THE BACKEND

- Serve exactly the 4 endpoints in PART 1.
- Return exactly the JSON shapes shown in this document.
- Do not rename fields. Only add new fields if needed.
- The page must never break: if the stats file is missing,
  use a default summary.
- Count, ranking, and math stay in the backend.
- Never put fake numbers in the final demo.
  The mock data above is only for testing the shape.

---

END OF DOCUMENT