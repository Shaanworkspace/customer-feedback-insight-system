# MODULE CONTRACTS — Exact Input and Output

This document shows the EXACT data that every module
sends and returns.

It is written so that every team member can work at the same time
without waiting for others.

- The LLM person knows what to return.
- The RAG person knows what to return.
- The ranking person knows what to return.
- The backend person knows what to expect from all of them.
- The frontend person knows what to draw on the screen.

All examples in this document were run on the real code.
The shapes below are what the code actually produces today.
Do not change these field names. You may only add new fields.

---

## THE SEQUENCE (who does what, in what order)

One upload goes through these modules, in this order.
Every module takes the output of the one before it.

```text
1. Backend        -> receives the CSV, cleans it
2. LLM module     -> reads reviews, returns entities + sentiment
3. Analysis       -> counts, merges, filters -> real problems
4. RAG            -> proof quotes for each problem
5. Ranking        -> priority order
6. Backend        -> saves concern_stats.json
7. Frontend       -> shows dashboard + explorer
```

STEP 1 | Backend: input is the CSV file, output is a clean
list of reviews (empty/short/duplicate removed).

STEP 2 | LLM: input is the clean reviews split into batches,
output is entities + sentiment + confidence (PART 1).

STEP 3 | Analysis: input is the LLM output, output is
counted and filtered concerns (PART 2).

STEP 4 | RAG: input is the kept concerns, output is
real proof quotes (PART 3).

STEP 5 | Ranking: input is the concern counts, output is
priority order (PART 4).

STEP 6 | Backend: input is everything above, output is
concern_stats.json (PART 5).

STEP 7 | Frontend: input is GET /api/v1/stats, output is
the dashboard (charts + tables).

---

## PART 1 — LLM MODULE

### 1.1 Job

Read a batch of reviews and return, for every review,
the entities, the sentiment, and the confidence.
This replaces the old ML module (sentiment) and the old
entity extraction step. The LLM does both at once.

### 1.2 Input

A list of 25 to 30 reviews (batch size).
Never more than 30 in one call.
Never the whole dataset in one call.

```text
[
  "Camera is excellent but battery drains fast.",
  "Great battery life.",
  "Delivery was very late.",
  ...
]
```

### 1.3 The prompt (how the LLM is asked)

```text
"You are a review analysis system.
These are N reviews. For each review give the entities,
the sentiment (positive or negative), and the confidence
(0.0 to 1.0). Return only JSON. Use the index number
to identify each review."

Reviews:
0: Camera is excellent but battery drains fast.
1: Great battery life.
2: Delivery was very late.
```

### 1.4 Output (exact JSON)

```json
[
  {
    "index": 0,
    "aspects": [
      {"entity": "camera",  "sentiment": "positive", "confidence": 0.95},
      {"entity": "battery", "sentiment": "negative", "confidence": 0.90}
    ]
  },
  {
    "index": 1,
    "aspects": [
      {"entity": "battery", "sentiment": "positive", "confidence": 0.90}
    ]
  },
  {
    "index": 2,
    "aspects": [
      {"entity": "delivery", "sentiment": "negative", "confidence": 0.85}
    ]
  }
]
```

Rules of this output:

- "index" matches the review number given in the prompt.
- "entity" is the thing the review talks about.
- "sentiment" is only "positive" or "negative".
- "confidence" is from 0.0 to 1.0.
- If a review has no aspect, it still appears with "aspects": [].

### 1.5 Batching rules

- 25 to 30 reviews per call (never more).
- Several batches run in parallel to save time.
- If the JSON is broken, the batch is retried once.
- If it still fails, the fallback handles that review.

### 1.6 The fallback (rule-based, no internet)

If the LLM fails or is slow, this simple logic takes over:

```text
Count good words and bad words in the text.
If the count is 0, the confidence is 0.5.
Every extra word raises or lowers the confidence.
```

The fallback returns the same output shape:

```json
{"index": 0, "aspects": [{"entity": "battery", "sentiment": "negative", "confidence": 0.8}]}
```

The fallback is less smart than the LLM, but it always works.

### 1.7 Example (fallback, run on today's code)

```text
Input:   "great camera quality, best picture ever"

Output:
```
```json
[{"index": 0, "aspects": [{"entity": "camera", "sentiment": "positive", "confidence": 0.8}]}]
```

```text
Input:   "terrible battery life, worst purchase"

Output:
```
```json
[{"index": 0, "aspects": [{"entity": "battery", "sentiment": "negative", "confidence": 0.8}]}]
```

```text
Input:   "camera is excellent but battery drains fast"

Output:
```
```json
[{"index": 0, "aspects": [{"entity": "camera", "sentiment": "positive", "confidence": 0.5},
                          {"entity": "battery", "sentiment": "negative", "confidence": 0.5}]}]
```

```text
Input:   "love this product, easy to use"

Output:
```
```json
[{"index": 0, "aspects": [{"entity": "product", "sentiment": "positive", "confidence": 0.8}]}]
```

```text
Input:   "screen is terrible and sound is awful"

Output:
```
```json
[{"index": 0, "aspects": [{"entity": "screen", "sentiment": "negative", "confidence": 0.8},
                          {"entity": "sound", "sentiment": "negative", "confidence": 0.8}]}]
```

The OUTPUT SHAPE MUST STAY THE SAME.
Replace the fallback with the real LLM call
(Groq + Llama), but the batching and the JSON shape stay fixed.

---

## PART 2 — ANALYSIS MODULE

### 2.1 Job

Take the LLM results and turn them into real concerns:
count the entities, merge same-meaning phrases, and apply
the filters. The LLM already does the extraction (PART 1).
This module does the counting and filtering.

### 2.2 Input

The output of the LLM module (PART 1): one list with
index, entities, sentiment, and confidence for every review.

```json
[
  {"index": 0, "aspects": [{"entity": "camera", "sentiment": "positive", "confidence": 0.95},
                           {"entity": "battery", "sentiment": "negative", "confidence": 0.90}]},
  {"index": 1, "aspects": [{"entity": "battery", "sentiment": "positive", "confidence": 0.90}]}
]
```

The analysis module can also accept one review at a time
and call the fallback itself (for the demo without internet).
The output shape below stays the same either way.

### 2.3 Output (exact JSON)

```json
{
  "review_text": "the review text",
  "overall_sentiment": "positive" or "negative" or "mixed",
  "overall_confidence": 0.0 to 1.0,
  "concerns": [
    {
      "name": "concern name",
      "sentiment": "positive" or "negative",
      "matched_terms": ["the word that matched"],
      "confidence": 0.0 to 1.0
    }
  ],
  "similar_reviews": [
    {
      "review_id": "an id",
      "text_preview": "a short quote",
      "similarity": 0.0 to 1.0
    }
  ]
}
```

### 2.4 Real examples (run on today's code)

```text
Input:
"camera is excellent but battery drains fast and delivery was late"

Output:
```
```json
{
  "review_text": "camera is excellent but battery drains fast and delivery was late",
  "overall_sentiment": "positive",
  "overall_confidence": 0.5,
  "concerns": [
    {
      "name": "battery",
      "sentiment": "positive",
      "matched_terms": ["battery"],
      "confidence": 0.5
    },
    {
      "name": "camera",
      "sentiment": "positive",
      "matched_terms": ["camera"],
      "confidence": 0.5
    },
    {
      "name": "delivery",
      "sentiment": "positive",
      "matched_terms": ["delivery"],
      "confidence": 0.5
    },
    {
      "name": "performance",
      "sentiment": "positive",
      "matched_terms": ["speed"],
      "confidence": 0.5
    }
  ],
  "similar_reviews": [
    {
      "review_id": "abc123",
      "text_preview": "battery dies in 2 hours, camera is fine",
      "similarity": 0.83
    }
  ]
}
```

Note: "performance" matched because the word "fast" is inside
"drains fast". This is the MOCK matching.
will replace it with real entity extraction.

```text
Input:
"great camera quality, best picture ever"

Output:
```
```json
{
  "review_text": "great camera quality, best picture ever",
  "overall_sentiment": "positive",
  "overall_confidence": 0.8,
  "concerns": [
    {
      "name": "camera",
      "sentiment": "positive",
      "matched_terms": ["camera"],
      "confidence": 0.8
    }
  ],
  "similar_reviews": [
    {
      "review_id": "abc123",
      "text_preview": "battery dies in 2 hours, camera is fine",
      "similarity": 0.83
    }
  ]
}
```

```text
Input:
"terrible battery life, worst purchase"

Output:
```
```json
{
  "review_text": "terrible battery life, worst purchase",
  "overall_sentiment": "negative",
  "overall_confidence": 0.8,
  "concerns": [
    {
      "name": "battery",
      "sentiment": "negative",
      "matched_terms": ["battery"],
      "confidence": 0.8
    }
  ],
  "similar_reviews": [
    {
      "review_id": "abc123",
      "text_preview": "battery dies in 2 hours, camera is fine",
      "similarity": 0.83
    }
  ]
}
```

```text
Input:
"the speaker is good and price is cheap"

Output:
```
```json
{
  "review_text": "the speaker is good and price is cheap",
  "overall_sentiment": "positive",
  "overall_confidence": 0.65,
  "concerns": [
    {
      "name": "price",
      "sentiment": "positive",
      "matched_terms": ["price"],
      "confidence": 0.65
    },
    {
      "name": "sound",
      "sentiment": "positive",
      "matched_terms": ["sound"],
      "confidence": 0.65
    }
  ],
  "similar_reviews": [
    {
      "review_id": "abc123",
      "text_preview": "battery dies in 2 hours, camera is fine",
      "similarity": 0.83
    }
  ]
}
```

```text
Input:
"screen is terrible and sound is awful"

Output:
```
```json
{
  "review_text": "screen is terrible and sound is awful",
  "overall_sentiment": "negative",
  "overall_confidence": 0.8,
  "concerns": [
    {
      "name": "screen",
      "sentiment": "negative",
      "matched_terms": ["screen"],
      "confidence": 0.8
    },
    {
      "name": "sound",
      "sentiment": "negative",
      "matched_terms": ["sound"],
      "confidence": 0.8
    }
  ],
  "similar_reviews": [
    {
      "review_id": "abc123",
      "text_preview": "battery dies in 2 hours, camera is fine",
      "similarity": 0.83
    }
  ]
}
```

### 2.5 How concerns are found (no fixed list)

There is NO fixed seed list in this project.
The app finds concerns by itself from the reviews.

This happens in five steps (see FINAL_PROJECT.md, PART 3),
but STEP 1 is done by the LLM (see PART 1 of this file):

STEP 1 (extract): the LLM reads the reviews and pulls out
the entities (the things). No POS tagging code needed.

```text
"fingerprint sensor is bad"     -> one entity: fingerprint sensor
"fingerprint camera is bad"     -> two entities: fingerprint, camera
"battery drains fast"           -> one entity: battery
```

STEP 2 (merge): the app joins same-meaning phrases into one concern.

```text
"battery life"    ---similar---> "battery"      -> ONE concern: battery
"battery drains"  ---similar---> "battery"      -> ONE concern: battery
```

STEP 3 (filter): the app keeps only real problems.
Two filters decide this.

FILTER 1 (support):

IF the same entity appears in 5 or more reviews
THEN it is a real concern.
ELSE
THEN it is ignored for now.

FILTER 2 (discrimination):

IF the negative ratio of the entity is higher than the overall
negative ratio of all reviews
THEN it is a PROBLEM and is kept.
ELSE
THEN it is neutral or positive and is not kept as a problem.

STEP 4 (rank): the kept concerns go into the registry.
When a new concern is added, old reviews are scanned again,
so the global numbers are always correct.

STEP 5 (RAG): the app proves every concern with real review quotes.

For the analysis module, the output shape stays exactly as shown
in section 2.3. There is no seed list to match against.

---

## PART 3 — RAG MODULE

### 3.1 Job

Find the real reviews that talk about a concern,
and return them as proof quotes.

Stack: sentence-transformers (all-MiniLM-L6-v2) +
ChromaDB (free vector database). See IMP_FILES/rag/rag.md
for the full implementation.

### 3.2 Input

A list of the kept concerns.

```json
["battery", "delivery", "screen"]
```

The reviews to search are the stored reviews
(each with review_id, text, entity, sentiment).

### 3.3 Output (exact JSON)

For every concern, up to 3 quotes:

```json
{
  "battery": [
    {"review_id": "r1", "text": "battery dies in 2 hours", "similarity": 0.92},
    {"review_id": "r3", "text": "battery drains very fast", "similarity": 0.89}
  ],
  "delivery": [
    {"review_id": "r9", "text": "delivery was very late", "similarity": 0.90}
  ]
}
```

### 3.4 Real example

```text
Input:   ["battery", "delivery"]

Output:
```
```json
{
  "battery": [
    {"review_id": "r1", "text": "battery dies in 2 hours", "similarity": 0.92},
    {"review_id": "r3", "text": "battery drains very fast", "similarity": 0.89},
    {"review_id": "r7", "text": "worst battery life ever", "similarity": 0.85}
  ],
  "delivery": [
    {"review_id": "r9", "text": "delivery was very late", "similarity": 0.90},
    {"review_id": "r12", "text": "package came after 5 days", "similarity": 0.87}
  ]
}
```

This is the MOCK result. Build the real one with
ChromaDB as shown in IMP_FILES/rag/rag.md.

---

## PART 4 — RANKING MODULE

### 4.1 Job

Say which concern to fix first.

### 4.2 Input

A concern stats object like this:

```json
{
  "total_reviews": 20000,
  "total_mentions": 7900,
  "concerns": [
    {"name": "battery", "count": 3100, "positive": 682, "negative": 2418, "negative_pct": 78.0},
    {"name": "camera", "count": 2100, "positive": 1700, "negative": 400, "negative_pct": 19.0},
    {"name": "delivery", "count": 1500, "positive": 675, "negative": 825, "negative_pct": 55.0},
    {"name": "price", "count": 1200, "positive": 800, "negative": 400, "negative_pct": 33.3}
  ]
}
```

### 4.3 Output (exact JSON)

```json
[
  {
    "concern": "battery",
    "count": 3100,
    "negative_pct": 78.0,
    "impact": 100,
    "priority": 1
  },
  {
    "concern": "delivery",
    "count": 1500,
    "negative_pct": 55.0,
    "impact": 34,
    "priority": 2
  },
  {
    "concern": "price",
    "count": 1200,
    "negative_pct": 33.3,
    "impact": 17,
    "priority": 3
  },
  {
    "concern": "camera",
    "count": 2100,
    "negative_pct": 19.0,
    "impact": 17,
    "priority": 4
  }
]
```

### 4.4 How the numbers are made

For every concern:
`impact_score = count x negative_pct`

```text
battery:  3100 x 78   = 241800
delivery: 1500 x 55   = 82500
price:    1200 x 33.3 = 39960
camera:   2100 x 19   = 39900
```

The biggest score gets impact 100.
Every other score becomes a percentage of the biggest.

```text
battery:  241800 is the biggest -> impact 100
delivery: 82500 / 241800 = 0.34  -> impact 34
price:    39960 / 241800 = 0.17  -> impact 17
camera:   39900 / 241800 = 0.16  -> impact 17
```

`priority 1` = the highest impact.
`priority 2` = the second highest, and so on.

---

## PART 5 — BACKEND API

### 5.1 Endpoint 1: GET /api/v1/stats

What it does: returns the dashboard summary.

Exact output today:

```json
{
  "total_reviews": 20000,
  "sentiment_distribution": {
    "positive": 12400,
    "negative": 7600
  },
  "ranked_concerns": [
    {
      "concern": "battery",
      "count": 3100,
      "negative_pct": 78.0,
      "impact": 100,
      "priority": 1
    },
    {
      "concern": "delivery",
      "count": 1500,
      "negative_pct": 55.0,
      "impact": 34,
      "priority": 2
    },
    {
      "concern": "price",
      "count": 1200,
      "negative_pct": 33.3,
      "impact": 17,
      "priority": 3
    },
    {
      "concern": "camera",
      "count": 2100,
      "negative_pct": 19.0,
      "impact": 17,
      "priority": 4
    }
  ],
  "representative_reviews": [
    {
      "review_id": "r1",
      "text": "battery battery dies quickly",
      "sentiment": "negative"
    },
    {
      "review_id": "r2",
      "text": "great camera quality",
      "sentiment": "positive"
    }
  ]
}
```

Note: representative_reviews is a MOCK list. Fill it later with real reviews from the data.

NOTE on filters: this example is the MOCK output (20000 reviews),
BEFORE the filters are applied. In the real flow the two
filters run first (see PART 6). Price (33.3% negative)
and camera (19% negative) are LOWER than the overall
negative ratio (38%), so they would be DROPPED.
Only the real problems appear in the final ranked list.

### 5.2 Endpoint 2: POST /api/v1/upload

What it does: receives a CSV file with many reviews,
runs the full pipeline (LLM batches, analysis, RAG,
ranking), saves the stats, and returns the result.

Input: a CSV file (multipart upload).

CSV columns:

```text
review_text,rating,date
battery drains fast,1,2026-01-01
great camera quality,5,2026-01-02
delivery was very late,1,2026-01-03
```

Exact output (same shape as GET /api/v1/stats):

```json
{
  "total_reviews": 20000,
  "sentiment_distribution": {
    "positive": 12400,
    "negative": 7600
  },
  "ranked_concerns": [
    {
      "concern": "battery",
      "count": 3100,
      "negative_pct": 78.0,
      "impact": 100,
      "priority": 1
    },
    {
      "concern": "delivery",
      "count": 1500,
      "negative_pct": 55.0,
      "impact": 34,
      "priority": 2
    },
    {
      "concern": "price",
      "count": 1200,
      "negative_pct": 33.3,
      "impact": 17,
      "priority": 3
    },
    {
      "concern": "camera",
      "count": 2100,
      "negative_pct": 19.0,
      "impact": 17,
      "priority": 4
    }
  ],
  "representative_reviews": [
    {
      "review_id": "r1",
      "text": "battery battery dies quickly",
      "sentiment": "negative"
    },
    {
      "review_id": "r2",
      "text": "great camera quality",
      "sentiment": "positive"
    }
  ]
}
```

The pipeline runs the LLM in batches of 25 to 30 reviews
(see PART 1). The whole upload returns this one result,
and the same result is saved for GET /api/v1/stats.

### 5.3 Endpoint 3: GET /health

What it does: tells if the server is alive.

Exact output:

```json
{
  "status": "ok",
  "reviews_analyzed": 0,
  "avg_latency_ms": 0.0
}
```

---

## PART 6 — EXAMPLE: WHAT 100 REVIEWS PRODUCE

Imagine a company uploads 100 reviews.
Here is what the flow produces, step by step.

### 6.1 After the LLM module

The LLM reads the reviews in batches and returns,
for every review, the entities and the sentiment.

Total sentiment for the batch:

```json
{
  "positive": 61,
  "negative": 39
}
```

### 6.2 After the analysis module

The analysis module counts the entities into one table:

```text
concern    | count | positive | negative | negative_pct
battery    | 48    | 10       | 38       | 79.2
camera     | 35    | 30       | 5        | 14.3
delivery   | 20    | 9        | 11       | 55.0
screen     | 12    | 3        | 9        | 75.0
price      | 10    | 7        | 3        | 30.0
```

Then it applies the two filters.
Overall negative ratio = 39%.

```text
battery   79.2%  > 39%  -> KEEP
delivery  55.0%  > 39%  -> KEEP
screen    75.0%  > 39%  -> KEEP
camera    14.3%  < 39%  -> DROP
price     30.0%  < 39%  -> DROP
```

Kept problems: battery, delivery, screen.
Camera and price are not problems (customers like them).

Note: these counts are an EXAMPLE to show the shape.
The real numbers will come from the uploaded file.

### 6.3 After the RAG module

For every kept concern, the module keeps the best 3 real quotes.

```text
battery quotes:
- "battery dies in 2 hours"     (92% similar)
- "battery drains very fast"    (89% similar)
- "worst battery life ever"     (85% similar)

delivery quotes:
- "delivery was very late"      (90% similar)
- "package came after 5 days"   (87% similar)
- "delivery took too long"      (83% similar)
```

### 6.4 After the ranking module

`impact_score = count x negative_pct`

Only the kept problems are ranked:

```text
battery:  48 x 79.2 = 3801.6
delivery: 20 x 55.0 = 1100.0
screen:   12 x 75.0 = 900.0
```

The list is sorted from the biggest score to the smallest.
The biggest score gets impact 100.
Every other score becomes a percentage of the biggest.

```text
battery:  3801.6 is the biggest -> impact 100
delivery: 1100.0 / 3801.6 = 0.29 -> impact 29
screen:   900.0 / 3801.6 = 0.24 -> impact 24
```

`priority 1` = the highest impact.
`priority 2` = the second highest, and so on.

```text
priority 1: battery  (impact 100)
priority 2: delivery (impact 29)
priority 3: screen   (impact 24)
```

### 6.5 Final output saved in concern_stats.json

```json
{
  "total_reviews": 100,
  "sentiment_distribution": {
    "positive": 61,
    "negative": 39
  },
  "ranked_concerns": [
    {"concern": "battery", "count": 48, "negative_pct": 79.2, "impact": 100, "priority": 1},
    {"concern": "delivery", "count": 20, "negative_pct": 55.0, "impact": 29, "priority": 2},
    {"concern": "screen", "count": 12, "negative_pct": 75.0, "impact": 24, "priority": 3}
  ]
}
```

### 6.6 What the dashboard shows after this upload

```text
- Total reviews: 100
- Positive: 61, Negative: 39
- Top concern to fix: battery (79.2% negative)
  Proof: the 3 real battery reviews
- Second to fix: delivery (55% negative)
  Proof: the 3 real delivery reviews
- Third: screen (75% negative)
  Proof: the 3 real screen reviews
- Camera and price are not shown as problems
  (customers mostly like them)
```

---

## PART 7 — RULES FOR EVERYONE

- Do not rename any field shown in this document.
- You may add new fields, but never remove or rename these.
- Every module works on its own. The shape is fixed,
  so nobody has to wait for anybody.
- When you build your real logic, keep the SAME output shape.
- Never put fake numbers in the final demo.
  The 100-review example above is only to show the shape.

---

END OF DOCUMENT