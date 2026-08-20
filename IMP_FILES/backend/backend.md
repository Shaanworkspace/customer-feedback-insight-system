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

### 2.5 THE LLM MODULE — full detail (how it works)

This is the most important part of the backend.
This section shows EXACTLY how the LLM is used:
what we send, what we get back, where we save it,
and what happens if the LLM fails.

#### 2.5.1 Which LLM we use

We use an open-source LLM through the Groq API:
Llama 3.3 70B.

- Free API (free tier: about 30 calls per minute).
- Fast: one batch replies in 1-2 seconds.
- No GPU needed. It is just an API call.
- It is a real open-source model (Meta's Llama),
  not a closed paid model.

Only this LLM is used. We do NOT train our own model.
The LLM does two jobs at once:
entity extraction + sentiment.

#### 2.5.2 How we send a batch (the call)

For every batch of 25 to 30 reviews,
the backend calls the Groq API.

The call has 3 parts:
1. The system message (who the LLM is).
2. The user message (the reviews + the known entities).
3. The response (JSON).

The library we use: the Groq SDK, which works
like the OpenAI SDK.

```python
from groq import Groq

client = Groq(api_key="your-groq-key")

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": batch_prompt},
    ],
    response_format={"type": "json_object"},
    temperature=0,
)
result = response.choices[0].message.content
```

#### 2.5.3 The SYSTEM prompt (fixed, never changes)

```text
"You are a review analysis system.
You read customer reviews and find the problems.
For every review you return the entities (the things
the review talks about), the sentiment (positive or
negative), and a confidence from 0.0 to 1.0.
You only output JSON. No other text."
```

#### 2.5.4 The BATCH prompt (changes with every batch)

This is the prompt that carries the reviews.
It also carries the GLOBAL registry (the entities
already known). This is how we stop duplicates.

```text
"These are N reviews. For each review return the entities,
the sentiment, and the confidence. Use the index number
to identify each review.

Entities already known (use these EXACT names if the
review talks about one of them):
battery, delivery, screen

Only give a NEW name for something not in this list.

Reviews:
0: Camera is excellent but battery drains fast.
1: Great battery life.
2: Delivery was very late.
..."

Return only JSON in this shape:
{"results": [{"index": 0, "aspects": [{"entity": "...",
"sentiment": "positive or negative", "confidence": 0.0}]}]}
```

#### 2.5.5 The exact response the backend receives

For the batch above, the LLM returns:

```json
{
  "results": [
    {
      "index": 0,
      "aspects": [
        {"entity": "camera", "sentiment": "positive", "confidence": 0.95},
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
}
```

How the backend reads this:

1. Loop over "results".
2. "index" matches the review number given in the prompt.
3. "aspects" is the list of entities for that review.
4. "entity" is the thing the review talks about.
5. "sentiment" is only "positive" or "negative".
6. "confidence" is from 0.0 to 1.0.

#### 2.5.6 The global registry (where everything is saved)

The backend keeps ONE global file: concern_registry.json.
All batches add to the same file.

This file is the single source of truth.
Every batch result is merged into it.

```json
{
  "battery": {"count": 48, "positive": 10, "negative": 38, "negative_pct": 79.2},
  "delivery": {"count": 20, "positive": 9, "negative": 11, "negative_pct": 55.0},
  "screen": {"count": 12, "positive": 3, "negative": 9, "negative_pct": 75.0},
  "camera": {"count": 35, "positive": 30, "negative": 5, "negative_pct": 14.3},
  "price": {"count": 10, "positive": 7, "negative": 3, "negative_pct": 30.0}
}
```

How the backend merges one batch:

```text
for each result in the batch:
  for each aspect in result.aspects:
    name = aspect.entity
    if name is already in the registry:
        registry[name].count += 1
        if aspect.sentiment == "negative":
            registry[name].negative += 1
        else:
            registry[name].positive += 1
    else:
        # new entity -> add a new entry
        registry[name] = {"count": 1, "positive": 0, "negative": 0}
        if aspect.sentiment == "negative":
            registry[name]["negative"] = 1
        else:
            registry[name]["positive"] = 1
```

After every batch, negative_pct is recalculated:

```text
negative_pct = (negative / count) * 100
```

The registry grows batch after batch.
The next batch's prompt uses the updated registry
as the "Entities already known" list.
This is how the LLM reuses the same names
and only new things get new names.

A second file, reviews.json, saves every review
with its entity and sentiment. This is for the
Explorer page (PART 4 of this document).

```json
[
  {"review_id": "r1", "text": "battery dies in 2 hours", "entity": "battery", "sentiment": "negative"},
  {"review_id": "r2", "text": "great camera quality", "entity": "camera", "sentiment": "positive"}
]
```

#### 2.5.7 What happens if a batch fails (fallback)

The LLM can fail:
- broken JSON in the reply,
- network error,
- rate limit (free tier: 30 calls per minute).

The rule is simple:

```text
STEP 1  Send the batch to the LLM.
STEP 2  If the reply is broken or the call fails,
        retry the SAME batch once.
STEP 3  If it still fails, SKIP that batch
        and move to the NEXT batch.
STEP 4  The system never stops for one batch.
```

If a batch fails, the backend does NOT count any
review from that batch. It keeps a note instead.

```json
{"skipped_batches": 1, "skipped_reviews": 27}
```

At the end, this note is shown to the user:

```text
"Note: 27 reviews could not be processed (LLM error)."
```

The rest of the upload still finishes normally.

#### 2.5.8 The rule-based fallback (works without any LLM)

If the Groq API is completely down, or there is
no internet, the backend has a small rule-based
logic that works offline.

It does the SAME two jobs (entity + sentiment),
but with simple keyword matching:

```text
sentiment: count good words and bad words in the text.
           more good words -> positive
           more bad words -> negative
           if the count is 0 -> confidence 0.5

entity:    find the concern keywords in the text.
           for example "battery", "camera", "delivery"
```

The fallback returns the SAME output shape:

```json
{
  "results": [
    {"index": 0, "aspects": [{"entity": "battery", "sentiment": "negative", "confidence": 0.8}]}
  ]
}
```

So the backend code does not change.
Only the source of the result changes.

```text
NORMAL day:  LLM does the work (accurate).
BAD day:     rule-based does the work (less smart, still works).
```

The system ALWAYS works, even without internet.

#### 2.5.9 The LLM lifecycle (batch by batch)

```text
Batch 1 (reviews 0-29):
  registry before: (empty)
  prompt known entities: (none)
  LLM returns: battery, camera, delivery, screen, price
  registry after: battery, camera, delivery, screen, price

Batch 2 (reviews 30-59):
  registry before: battery, camera, delivery, screen, price
  prompt known entities: battery, camera, delivery, screen, price
  LLM sees "battery life" -> knows battery is known -> returns battery
  LLM sees a NEW thing -> gives a new name -> added to registry
  registry after: updated counts + any new names
```

This is why duplicates almost never happen:
the LLM sees the known list every time.

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

### 2.6 What the backend saves

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

### 2.7 What the backend returns to the frontend

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

## PART 8 — RULES FOR THE LLM (do not break these)

- Use Groq + Llama 3.3 70B. One model, no changes.
- Batch size: 25 to 30 reviews. NEVER more than 30.
- Send the SYSTEM prompt and the BATCH prompt exactly
  as shown in section 2.5.3 and 2.5.4.
- Always include the "Entities already known" list
  (the global registry) in the batch prompt.
- Always use "index" to match reviews.
- Never trust the LLM blindly: if the JSON is broken,
  retry the batch ONCE.
- If the batch still fails, SKIP it and move on.
  Never stop the whole upload for one batch.
- Keep the rule-based fallback. The system must work
  even if the LLM is down.
- Save everything into concern_registry.json and
  reviews.json. These are the single source of truth.
- Do NOT train any ML model. The LLM + rule-based
  fallback is the whole ML part.

---

END OF DOCUMENT