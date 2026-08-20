# FINAL PROJECT — Customer Feedback Insight System

This document explains the whole project step by step.
It is written in simple words so that every team member
(frontend, backend, ML, ranking, and the team lead)
can understand their job clearly.

---

## PART 1 — OUR AIM

### 1.1 What are we building?

We are building a web application that reads customer reviews
and tells a company what to fix in their product.

Example:
A phone company has 50,000 reviews.
Our app reads all of them and says:

- "Your battery is your biggest problem. 78% of people
  who talk about the battery are angry. Fix battery first."
- "Your camera is fine. 19% of people who talk about the
  camera are angry. Do not change the camera."

### 1.2 Why is this useful?

A company cannot read 50,000 reviews by hand.
Our app reads all reviews in minutes and gives one clear answer:
"Fix this first, then this, then this."

### 1.3 Who uses it?

| Person | What they do with our app |
|---|---|
| Data Engineer | Uploads a big CSV file with many reviews |
| CEO / Founder | Opens the dashboard and reads the summary |
| Analyst | Opens the explorer to read specific reviews |

---

## PART 2 — HOW WE ARE DIFFERENT FROM OTHER TOOLS

There are three kinds of tools in the market.
We must be able to explain why we are different.

### 2.1 Type 1: Review Websites (they ask people for reviews)

Example: Yotpo, Bazaarvoice, Judge.me.

What they do:
- They put a review box on a shop's website.
- Customers type their review and give a star rating.
- The website shows the review and the star rating.

Where they are weak:
- They only show the star rating (like 4 stars).
- They do NOT read the words in the review.
- They do NOT tell the company "your battery is the problem".

### 2.2 Type 2: Toolkit Services (they give you parts, not a product)

Example: MonkeyLearn, AWS Comprehend.

What they do:
- They give you a small piece of software (an API).
- The API can tell you "this sentence is positive" or "this sentence is negative".
- They give you only this one small job.

Where they are weak:
- You need an engineer to build the rest yourself.
- You need to store the data yourself.
- You need to make the charts yourself.
- A normal manager cannot use this. Only programmers can.

Simple way to say it:
A toolkit is like giving someone wood and nails.
They still have to build the house.
We give a finished house.

### 2.3 Type 3: Big Company Tools (too expensive)

Example: Qualtrics, Medallia.

What they do:
- They analyze customer feedback for very big companies.
- They cost a lot of money (lakhs of rupees per year).

Where they are weak:
- Too expensive for small and medium brands.
- Too complicated to set up.

### 2.4 Our difference (the final answer)

Our app gives the finished result, ready to use:

- The company uploads reviews.
- The app reads every review.
- The app finds every problem in the reviews.
- The app says which problem to fix first.
- The app shows real review quotes as proof.

One line summary:
Other tools tell you what customers are saying.
We tell you what to do about it, with proof, in priority order.

---

## PART 3 — HOW WE FIND PROBLEMS WITHOUT A FIXED LIST

Other tools use a fixed list of concerns.
They write down "battery, camera, delivery" before they start,
and they only look for those.

We do NOT do this. We do not give any list before we start.
The app makes its OWN list from the reviews themselves.

Think about a new product that no one has written about yet.
Nobody can give a starting list, because nobody knows the problems yet.
So the app must find the list by itself.

The OPTIMIZED way has five steps.
Each step cleans the list so that only real problems survive.

### 3.1 Step 1 — Extract the candidate phrases

The app reads the grammar of the text (POS tagging)
and pulls out the noun phrases (the things).

IF the text has compound words like "fingerprint sensor"
THEN they stay together as ONE entity: "fingerprint sensor".
ELSE IF the text has a list like "fingerprint, camera"
THEN they become TWO entities: "fingerprint" and "camera".

Examples:
```text
"fingerprint sensor is bad"
-> one candidate: fingerprint sensor

"fingerprint camera is bad"
-> two candidates: fingerprint, camera

"battery drains fast"
-> one candidate: battery  (the word "drains" is a verb, so it is skipped)
```

### 3.2 Step 2 — Merge the same thing said in different words

Customers say the same problem in many ways.
"battery life", "battery drains", and "battery" all mean the same thing.
If we count them separately, the numbers become wrong.

So the app groups similar phrases into ONE concern.

The app changes every phrase into a TF-IDF vector (a number pattern)
and measures how similar two phrases are.

IF two phrases have a similarity higher than 0.7
THEN they are the SAME concern.
ELSE
THEN they stay as different concerns.

```text
"battery life"    ---similar---> "battery"      -> ONE concern: battery
"battery drains"  ---similar---> "battery"      -> ONE concern: battery
"battery"         ---similar---> "battery"      -> ONE concern: battery
```

This merging is what makes the list clean.
Without it, the registry would be full of nearly-identical entries.

### 3.3 Step 3 — Keep only the real problems (two filters)

Two filters decide whether a phrase becomes a concern.

#### 3.3.1 Filter 1: Support (how often it appears)

IF the phrase appears in 5 or more reviews
THEN it is a real concern.
ELSE
THEN it is too rare and is ignored for now.

```text
"screen protector" appears 12 times  -> passes
"heating" appears 2 times            -> ignored
```

#### 3.3.2 Filter 2: Discrimination (is it a problem or just talk?)

A common word is not a problem by itself.
The word "great" may appear in 200 reviews, but that is good talk,
not a problem.

So the app checks: does this phrase appear mostly in negative reviews?

IF the negative ratio of the phrase is higher than the overall
negative ratio of all reviews
THEN the phrase is a PROBLEM and becomes a concern.
ELSE
THEN it is neutral or positive and is NOT kept as a problem.

```text
Overall negative ratio of all reviews:     39%
"battery" negative ratio:                  78%  -> 78 > 39, KEEP as problem
"camera"  negative ratio:                  19%  -> 19 < 39, NOT a problem
"great"   negative ratio:                   2%  -> 2  < 39, NOT a problem
```

This filter removes the noise.
It keeps only the phrases that customers are angry about.

### 3.4 Step 4 — Rank and grow the registry

The phrases that pass both filters become concerns.
They are added to the registry (the list of all known concerns).

```text
First batch:  camera (35 reviews, 14% negative)   -> kept (a positive aspect)
              screen protector (12, 75% negative) -> kept (a problem)
Second batch: fingerprint sensor (7, 80% negative) -> added
              heating (2, 60% negative)            -> too rare, ignored

Registry now = {camera, screen protector, fingerprint sensor}
```

When a new concern is added, the app scans the old reviews again
for that concern. So the global numbers are always correct.

```text
First batch:  only camera and screen protector were counted.
Second batch: fingerprint sensor is new.
              All old reviews are scanned again.
              Now fingerprint sensor has its own numbers too.
```

### 3.5 Step 5 — RAG gives proof (not detection)

RAG does NOT find concerns. RAG finds proof.

After a concern is found, RAG searches old reviews
that talk about the same concern, and returns real quotes.

IF similar reviews are found
THEN the best 3 are saved as proof for the concern.
ELSE
THEN the concern shows numbers only, without quotes.

Example proof for screen protector:
```text
- "screen protector cracked in one week"    (91% similar)
- "screen protector has bubbles everywhere" (88% similar)
- "screen protector does not fit the glass" (86% similar)
```

### 3.6 How we stay fast (optimization)

We do not scan all reviews from the start every time.

1. The registry and the counts are saved to a file.
2. Every new batch only processes the NEW reviews.
3. Old counts are loaded from the saved file and updated.
4. Merging and filtering run only on the changed parts.

```text
Batch 1: 100 reviews processed from zero.  Registry saved.
Batch 2: 50 new reviews.  Only these 50 are processed.
         Old counts are loaded and updated.
         Result is the same as scanning all 150 from scratch.
```

So a company with 1,000,000 reviews is processed in minutes,
and every new upload takes even less time.

### 3.7 Hidden problems (NMF fallback)

Some problems are not a single noun phrase.
For example, "the device gets hot when charging and the screen dims".
No single noun carries the whole problem.

To catch these, the app also runs a topic model (NMF)
over the batch. It groups reviews into hidden topics.

IF a topic carries mostly negative reviews and is new
THEN the app adds it as a new concern with a generated name.
ELSE
THEN the topic is not kept.

This is the safety net. Even when phrases fail,
hidden topics are still found.

### 3.8 The five steps together

```text
STEP 1 (extract)   -> pull out the candidate phrases
STEP 2 (merge)     -> join same-meaning phrases into one
STEP 3 (filter)    -> keep only frequent + negative phrases
STEP 4 (rank)      -> grow the registry, update the counts
STEP 5 (RAG)       -> prove every concern with real quotes
```

There is no seed, no fixed list, and no hardcoding.
Every concern comes from the reviews themselves.
This is the honest answer to "how will you handle a new product?"

HOW WE RUN THIS: we do not build extraction and merging
with complex NLP code. An open-source LLM does the thinking
for us. Read PART 4 to see how (batching, parallel, retry,
fallback). PART 3 is the concept, PART 4 is the machine.

---

## PART 4 — THE LLM PIPELINE (how we process at scale)

The five steps in PART 3 are the concept.
But we do not build all of them from scratch with complex NLP.
We use an open-source LLM to do the hard thinking for us.

The LLM reads reviews and returns the entities, the sentiment,
and the confidence for each one. It understands language,
so it can do extraction and merging by itself.

But we cannot send all reviews at once.
An LLM has a memory limit and it can fail on long outputs.
So we use BATCHING.

### 4.1 Batching (divide the reviews into small groups)

We split the reviews into small batches of 25 to 30 reviews each.

```text
1000 reviews
  -> batch 1 (reviews 0-29)
  -> batch 2 (reviews 30-59)
  -> batch 3 (reviews 60-89)
  -> ... and so on
  -> about 35 batches in total
```

We do NOT send 1000 reviews in one call.

WHY:
- The LLM has a memory limit (context window).
- One huge call would cut off the end and lose reviews.
- One huge JSON output would break (syntax errors).
- One huge call is slow and may hit the rate limit.

A batch of 25 to 30 reviews is small enough to stay
inside the limits and big enough to be fast.

### 4.2 The batch prompt

Every batch is sent to the LLM with a clear prompt.

The prompt says:
"You are a review analysis system. Here are 25 reviews.
For every review, give the entities, the sentiment, and the confidence.
Return only JSON, with an index number for every review."

```text
Prompt:
"You are a review analysis system.
These are 25 reviews. For each review give the entities,
the sentiment (positive or negative), and the confidence.
Return only JSON. Use the index number to identify each review.

Reviews:
0: Camera is excellent but battery drains fast.
1: Great battery life.
2: Delivery was very late.
..."

Expected output:
[
  {"index": 0, "aspects": [{"entity": "camera", "sentiment": "positive", "confidence": 0.95},
                           {"entity": "battery", "sentiment": "negative", "confidence": 0.9}]},
  {"index": 1, "aspects": [{"entity": "battery", "sentiment": "positive", "confidence": 0.9}]},
  {"index": 2, "aspects": [{"entity": "delivery", "sentiment": "negative", "confidence": 0.85}]}
]
```

The index number lets us match the result back to the right review,
even if the LLM returns them in a different order.

### 4.3 Parallel calls (run batches at the same time)

If we send 35 batches one after another, it takes long.
So we run several batches at the SAME time.

```text
Group 1:  batches 1 to 10  (run together)
Group 2:  batches 11 to 20 (run together)
Group 3:  batches 21 to 30 (run together)
Group 4:  batches 31 to 35 (run together)
```

This makes the whole job much faster.

1000 reviews alone would take 2-3 minutes one by one.
With parallel calls it takes about 30 seconds.

### 4.4 Retry (try again when a batch fails)

Sometimes the LLM returns broken JSON, or stops early.

IF the JSON is broken
THEN the app sends that batch one more time.
ELSE
THEN the batch is used as it is.

A batch is only retried once.
If it still fails, the fallback handles it (see 4.5).

### 4.5 Fallback (the safety net)

The app never depends on the LLM alone.

A small rule-based logic is also built.
It works without any internet or LLM.

IF the LLM call works
THEN the LLM result is used.
ELSE IF the LLM fails or is slow
THEN the rule-based logic handles that review.

```text
Normal day:   LLM does everything, fast and accurate.
Bad day:      LLM is down. The rule-based logic still
              returns entities and sentiment, less smart
              but still working.
```

This means the app always works, even during the demo
when the internet is weak.

### 4.6 What the LLM does NOT do

The LLM only reads text and returns JSON.
It does NOT:

- Count the concerns.
- Compute the impact score.
- Rank the priorities.
- Save the stats.
- Draw the charts.

All of that stays in normal Python code.
This is good because counting and math are simple,
and the LLM can make mistakes in math.

### 4.7 The LLM pipeline in one picture

```text
CSV reviews (1000)
  -> split into batches of 25-30
  -> run batches in parallel (LLM)
  -> each batch returns JSON with index + aspects
  -> merge all JSON into one list
  -> count concerns (Python)
  -> filter by support and discrimination (Python)
  -> rank by impact (Python)
  -> RAG proof (Python)
  -> save and show on dashboard
```

---

## PART 5 — TECH DECISIONS (finalized) + INTERVIEW TRAPS

This part is the most important for the interview.
It stores every decision we made and the answer
to every question we expect.

### 5.1 The final tech stack

```text
LLM:            Groq + Llama 3.3 70B (open source, free)
                does entity extraction + sentiment

Python:         counting, filters, ranking, RAG, saving

Fallback:       rule-based (keywords), works without LLM

No trained model. The LLM + fallback is the whole ML part.
```

### 5.2 What the LLM does vs what Python does

```text
LLM (Groq + Llama):
  - reads reviews in batches of 25-30
  - returns entities + sentiment + confidence
  - merges same-meaning entities (battery life -> battery)

Python (our code):
  - splits reviews into batches
  - counts concerns in the global registry
  - filters (support >= 5, negative ratio > overall)
  - RAG proof quotes
  - ranking (impact = count x negative_pct)
  - saving JSON files
```

### 5.3 Why we did NOT train a model

Training a model takes time (10-15 days), needs data and GPU.
The LLM does the same job faster (4-5 days) and better.
The trained model is only useful for 1M reviews in production.

### 5.4 The global registry (how duplicates are stopped)

We keep ONE file: concern_registry.json.

```json
{
  "battery": {"count": 48, "positive": 10, "negative": 38, "negative_pct": 79.2},
  "delivery": {"count": 20, "positive": 9, "negative": 11, "negative_pct": 55.0}
}
```

Every batch adds to this file.
The known entities are sent to the LLM with every prompt,
so the LLM reuses the same names and only new things
get new names. That is how "battery life" and "battery"
both become "battery".

### 5.5 Why RAG exists (LLM cannot prove quotes)

The LLM is generative: it can answer but it can
also make things up (hallucination).

So RAG searches the STORED reviews (TF-IDF + cosine
similarity) and returns REAL review quotes as proof.

```text
AI finds the problem. RAG proves it with real evidence.
```

### 5.6 The batch rules (never break these)

- 25 to 30 reviews per call. Never more than 30.
- Never send the whole dataset in one call.
- Run batches in parallel to save time.
- If a batch fails, retry once.
- If it still fails, skip it and move on.
- Keep the rule-based fallback for when the LLM is down.

### 5.7 The fallback chain

```text
Batch -> LLM
  -> broken JSON or network fail
  -> retry once
  -> still fails
  -> skip that batch, continue
  -> at the end show: "N reviews skipped (LLM error)"
```

The app always works, even without the LLM.

---

## INTERVIEW TRAPS AND ANSWERS

These are the questions we expect and our exact answers.

### TRAP 1: "You just used an LLM. Where is the ML?"

Answer:

> "The ML core is our own Python: counting, filters,
> ranking, and stats. For entity extraction and sentiment
> we use an open-source LLM, because dynamic concerns
> would be missed by fixed code. The fallback is
> rule-based, so the system works even without the LLM."

### TRAP 2: "Why RAG? The LLM can find quotes too."

Answer:

> "The LLM is generative and can hallucinate. RAG searches
> the stored reviews with TF-IDF and cosine similarity, so
> every quote shown is a REAL review from the data.
> AI finds the problem, RAG proves it with evidence."

### TRAP 3: "Why didn't you train your own sentiment model?"

Answer:

> "A trained model needs time, data, and GPU (10-15 days).
> The LLM does it faster and better. For 1M reviews in
> production we have a hybrid design: LLM for dynamic
> entities, a trained model for cost-efficient sentiment."

### TRAP 4: "How do you handle 1 million reviews?"

Answer:

> "Reviews are processed in batches of 25-30, in parallel.
> Batch one is not sent in one call. We use incremental
> processing: only new reviews are processed, old counts
> stay saved. Entities are merged in a global registry."

### TRAP 5: "What if the LLM API fails or is slow?"

Answer:

> "Every batch is retried once. If it still fails, that
> batch is skipped and the system moves on. A rule-based
> fallback runs when the LLM is completely down, so the
> app never stops and works even without internet."

### TRAP 6: "How do you handle duplicates like 'battery'
vs 'battery life'?"

Answer:

> "Every batch prompt includes the entities already known
> from the global registry. The LLM reuses those exact
> names, so 'battery life' becomes 'battery'. Only truly
> new things get new names."

### TRAP 7: "Is the demo using real or fake numbers?"

Answer:

> "All demo numbers are computed from the uploaded CSV
> on the spot. Nothing is hardcoded. Proof quotes are
> real reviews from the file. We never show fake numbers."

### TRAP 8: "Why open-source LLM and not a paid one?"

Answer:

> "Open source is free, auditable, and we can run it
> anywhere. We use Llama 3.3 through Groq's free tier.
> It is a real open-source model, not a closed paid one."

### TRAP 9: "How fast is the analysis?"

Answer:

> "1000 reviews become about 35 batches. Batches run in
> parallel, so the full analysis takes about 30 seconds.
> The dashboard shows section-level loading, so the page
> opens immediately and fills in as data arrives."

### TRAP 10: "What is your differentiator from other tools?"

Answer:

> "Other tools show what customers said. We say what to
> DO: ranked priorities with real proof quotes. We are
> action-first, evidence-backed, and work for any product
> because there is no fixed lexicon."

---

## PART 6 — THE FULL USER FLOW (step by step)

Our app has ONE main way of working:
the user uploads MANY reviews at once (a CSV file).
The five steps from PART 3 run inside this flow.

---

## STEP 1 — THE USER OPENS THE APP

### 1.1 What the user does

The user opens our website in a browser (for example Chrome).
The user sees the first page, called the "Landing Page".

### 1.2 What the user sees on the screen

The user sees the app name: "Customer Feedback Insight System".
Below the name the user sees two buttons (tabs):

1. Dashboard
2. Explorer

IF the user is a CEO or a manager
THEN the user will most likely click "Dashboard".
ELSE IF the user is an analyst who wants to read specific reviews
THEN the user will most likely click "Explorer".

At this point, NO backend is used yet.
The page is only showing buttons. This is the frontend's job.

---

## STEP 2 — THE USER UPLOADS REVIEWS

### 2.1 What the user does

The user clicks the "Upload" button on the page.
The user chooses a CSV file from their computer.
The CSV file has many customer reviews.

The CSV looks like this:

```text
review_text,rating,date
battery drains fast,1,2026-01-01
great camera quality,5,2026-01-02
delivery was very late,1,2026-01-03
```

### 2.2 What happens on the frontend

The frontend reads the file.
The frontend sends the file to the backend with this request:
POST /api/v1/upload

This means: "Please read all these reviews."

### 2.3 What happens on the backend (validation)

The backend receives the file.

IF the file is empty
THEN the backend returns an error: "File is empty. Upload again."
ELSE
THEN the backend continues to the next step.

### 2.4 What happens on the backend (cleaning)

The backend cleans the reviews:

1. Empty reviews are removed.
2. Very short reviews (less than 10 letters) are removed.
3. Duplicate reviews are removed.

The backend counts how many reviews are left.

IF 0 reviews are left
THEN the backend returns an error: "No valid reviews found."
ELSE
THEN the backend continues to the next step.

---

## STEP 3 — THE ANALYSIS MODULE FINDS THE PROBLEMS

This is where the LLM pipeline from PART 4 runs.

### 3.0 The LLM processes the reviews

The reviews are split into batches of 25 to 30.
Each batch goes to the LLM, which returns the entities,
the sentiment, and the confidence for every review
(see PART 4 for batching, parallel calls, retry, and fallback).

The LLM does the thinking: it extracts and merges entities.
After that, normal Python does the counting and filtering.

### 3.1 Extract

For every review, the module pulls out the noun phrases.
For this review:
"Camera is excellent but battery drains fast and delivery was late."

The entities are:
- camera
- battery
- delivery

So this review talks about 3 things.

### 3.2 Merge

The module checks each phrase against the concern registry.
This is where subsumption works too: a short mention like "fingerprint"
merges into the longer registered phrase "fingerprint sensor".

IF the phrase is already a known concern
THEN it is marked as known.
ELSE
THEN it becomes a candidate for the filters.

### 3.3 Filter

For every candidate, the module applies the two filters
(Support and Discrimination) from PART 3.

IF the candidate passes both filters
THEN it becomes a NEW concern and is added to the registry.
ELSE
THEN it is ignored for now.

When a new concern is added, old reviews are scanned again,
so the counts stay correct.

### 3.4 Give each entity a confidence score

Every entity gets a confidence score from 0 to 1.
A score of 1.0 means "we are very sure this is the right concern".

### 3.5 What the Analysis module returns

For the whole batch, the module counts:

- How many reviews talk about each concern.
- Of those, how many are positive and how many are negative.
- The negative percent for each concern.

Example:
battery: 3100 reviews, 682 positive, 2418 negative, 78% negative
camera:  2100 reviews, 1700 positive, 400 negative, 19% negative

---

## STEP 4 — THE SENTIMENT IS COUNTED

### 4.1 Where the sentiment comes from

The LLM already gave the sentiment for every review in STEP 3
(see PART 4). Each review has a label and a confidence.
So there is no separate ML model.

### 4.2 What this step does

The backend counts the labels:

- How many reviews are positive.
- How many reviews are negative.

These two numbers go to the dashboard later.

---

## STEP 5 — THE RAG MODULE FINDS PROOF (similar reviews)

### 5.1 What the RAG module does

For every concern, the RAG module searches old reviews
that talk about the same concern.

IF similar reviews are found
THEN the best 3 are saved for each concern as proof.
ELSE
THEN the concern has no proof and only numbers are shown.

Example for battery, RAG returns:
- "battery dies in 2 hours" (92% similar)
- "battery drains very fast" (89% similar)
- "worst battery life ever" (85% similar)

### 5.2 What the RAG module returns

For every concern: up to 3 real review quotes
with a similarity score.

This is the proof that the numbers are real.

---

## STEP 6 — THE RANKING MODULE SAYS WHAT TO FIX FIRST

### 6.1 What the Ranking module does

The ranking module receives the concern list.
For every concern, it calculates the impact score.

Impact score = number of reviews that talk about this concern
multiplied by the percentage of negative reviews about it.

Example for battery:
Count = 3100 reviews.
Negative percent = 78%.
Impact = 3100 x 78% = 2418.

The ranking module sorts all concerns from highest impact to lowest.
The first one becomes Priority 1.

### 6.2 What the Ranking module returns

A list of concerns sorted by priority:

- Priority 1: battery (impact 100)
- Priority 2: delivery (impact 34)
- Priority 3: price (impact 17)
- Priority 4: camera (impact 17)

---

## STEP 7 — THE BACKEND SAVES THE RESULT

### 7.1 What the backend does

The backend saves all the numbers in a file called
concern_stats.json.

This file holds the latest summary of all reviews.
The next time the dashboard is opened, this file is read.

### 7.2 What happens if the file is missing

IF the file does not exist
THEN the backend uses a small default summary
so that the page does not break.

---

## STEP 8 — THE USER OPENS THE DASHBOARD

### 8.1 What the user does

The user clicks the "Dashboard" button.

### 8.2 What happens on the frontend

The frontend (React) sends a request to the backend:
GET /api/v1/stats

This means: "Please give me the summary of all the reviews."

### 8.3 What happens on the backend

The backend opens the saved file concern_stats.json.

IF the file exists
THEN the backend reads the summary from the file.
ELSE
THEN the backend uses the default summary.

### 8.4 What the backend sends back

The backend sends this data to the frontend:

- Total number of reviews.
- How many are positive and how many are negative.
- The ranked list of concerns (priority order).
- Three example reviews for the main concerns (proof).

### 8.5 What the user sees now

The user sees:

- Big number: Total reviews.
- A bar chart: Positive vs Negative.
- A list: Top concerns from priority 1 to priority 5.
- Example reviews as proof below each concern.

The user now understands the product health in one glance.

---

## STEP 9 — THE USER OPENS THE EXPLORER

### 9.1 What the user does

The user clicks the "Explorer" button.

### 9.2 What the user sees

The user sees a list of reviews in a table.
The user can filter the reviews.

IF the user clicks the filter "battery"
THEN the table shows only reviews that talk about the battery.

The user can read real reviews to understand the problem deeply.

### 9.3 What the backend does

The backend returns the stored reviews
with the detected concerns and sentiments.
The frontend filters them in the browser.

---

## PART 7 — A REAL BATCH FROM START TO FINISH

This part shows ONE full upload, step by step,
with REAL data at every step.

Who does what, what every module gives, and in what order.
This is the same flow as PART 5, but with real numbers.

The example uses 100 reviews from one company.

---

### 7.1 The input (100 reviews)

The user uploads a CSV file with 100 reviews.
A few of them look like this:

```text
review_text,rating,date
battery drains fast,1,2026-01-01
great camera quality,5,2026-01-02
delivery was very late,1,2026-01-03
screen is too dim,2,2026-01-04
price is too high for this,2,2026-01-05
battery life is terrible,1,2026-01-06
...
```

After cleaning (empty, short, duplicate removed):
100 reviews remain.

---

### 7.2 Step 1 — LLM module reads the reviews

WHO: the LLM module.

The 100 reviews are split into batches of 25 to 30.
That makes 4 batches.

Every batch goes to the LLM.
The LLM returns, for every review, the entities,
the sentiment, and the confidence.

REAL output for the first 5 reviews:

```json
[
  {"index": 0, "aspects": [{"entity": "battery", "sentiment": "negative", "confidence": 0.9}]},
  {"index": 1, "aspects": [{"entity": "camera", "sentiment": "positive", "confidence": 0.9}]},
  {"index": 2, "aspects": [{"entity": "delivery", "sentiment": "negative", "confidence": 0.85}]},
  {"index": 3, "aspects": [{"entity": "screen", "sentiment": "negative", "confidence": 0.8}]},
  {"index": 4, "aspects": [{"entity": "price", "sentiment": "negative", "confidence": 0.8}]}
]
```

This is where the LLM's job ENDS.
From here, everything is normal Python.

---

### 7.3 Step 2 — Analysis module counts the concerns

WHO: the analysis module.

The analysis module takes all the LLM results
and counts how many reviews talk about each entity.

It also merges same-meaning phrases:
"battery life" and "battery drains" both count as "battery".

REAL result (the full 100 reviews):

```text
concern    | count | positive | negative | negative_pct
battery    | 48    | 10       | 38       | 79.2
camera     | 35    | 30       | 5        | 14.3
delivery   | 20    | 9        | 11       | 55.0
screen     | 12    | 3        | 9        | 75.0
price      | 10    | 7        | 3        | 30.0
```

Plus the total sentiment:
100 reviews, 61 positive, 39 negative.

---

### 7.4 Step 3 — Analysis module filters the real problems

WHO: the analysis module.

Two filters decide which concerns are real problems.

FILTER 1 (support): the concern must appear in
5 or more reviews. All five pass here.

FILTER 2 (discrimination): the negative ratio of the concern
must be HIGHER than the overall negative ratio.

Overall negative ratio = 39%.
(39 negative reviews out of 100.)

```text
battery   79.2%  > 39%  -> KEEP  (a real problem)
delivery  55.0%  > 39%  -> KEEP  (a real problem)
screen    75.0%  > 39%  -> KEEP  (a real problem)
camera    14.3%  < 39%  -> DROP  (customers like it)
price     30.0%  < 39%  -> DROP  (not a big problem)
```

So 3 problems stay:
battery, delivery, screen.

Camera and price are NOT problems.
Customers mostly like them.

---

### 7.5 Step 4 — RAG module finds proof

WHO: the RAG module.

For every kept concern, the RAG module finds
the 3 most similar real reviews.

REAL proof for battery:

```text
- "battery dies in 2 hours"      (92% similar)
- "battery drains very fast"     (89% similar)
- "worst battery life ever"      (85% similar)
```

REAL proof for delivery:

```text
- "delivery was very late"       (90% similar)
- "package came after 5 days"    (87% similar)
- "delivery took too long"       (83% similar)
```

This is the proof. The numbers are not made up.
These are real reviews from the upload.

---

### 7.6 Step 5 — Ranking module says what to fix first

WHO: the ranking module.

Impact score = count x negative percent.

```text
battery:  48 x 79.2 = 3801.6
delivery: 20 x 55.0 = 1100.0
screen:   12 x 75.0 = 900.0
```

Sort from the biggest to the smallest.
The biggest gets impact 100.
The rest become a percentage of the biggest.

```text
battery:  3801.6 is the biggest -> impact 100 -> priority 1
delivery: 1100.0 / 3801.6 = 0.29 -> impact 29 -> priority 2
screen:   900.0 / 3801.6 = 0.24 -> impact 24 -> priority 3
```

REAL result:

```text
priority 1: battery  (impact 100)
priority 2: delivery (impact 29)
priority 3: screen   (impact 24)
```

---

### 7.7 Step 6 — Backend saves the result

WHO: the backend module.

The backend saves everything into one file:
concern_stats.json

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
  ],
  "representative_reviews": [
    {
      "review_id": "r1",
      "text": "battery dies in 2 hours",
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

---

### 7.8 Step 7 — Frontend shows the dashboard

WHO: the frontend module.

The frontend asks GET /api/v1/stats.
The backend returns the saved file.

What the user sees:

```text
- Total reviews: 100
- Positive: 61, Negative: 39 (bar chart)
- Top problem: battery (79.2% negative, priority 1)
  Proof: 3 real battery reviews
- Second: delivery (55% negative, priority 2)
  Proof: 3 real delivery reviews
- Third: screen (75% negative, priority 3)
  Proof: 3 real screen reviews
```

The user can click any concern and read the real reviews
in the Explorer.

---

### 7.9 The whole sequence in one table

```text
STEP | WHO                | WHAT IT GIVES
1    | LLM module         | entities + sentiment + confidence
2    | Analysis module    | counts + merge
3    | Analysis module    | filters -> real problems
4    | RAG module         | proof quotes for each concern
5    | Ranking module     | priority order
6    | Backend            | saves concern_stats.json
7    | Frontend           | dashboard + explorer
```

---

## PART 8 — WHAT THE USER SEES AFTER A FULL BATCH

When the whole flow is finished, the user has:

1. Total review count and positive/negative split.
2. Top concerns in priority order.
3. The negative percent for every concern.
4. Real review quotes as proof for every concern.
5. The ability to read and filter all reviews.

All of this comes from ONE CSV upload.

---

## PART 9 — WHO DOES WHAT (for every module)

### 9.1 Frontend

Job: Show pages and send user actions to the backend.

- Show the landing page with the buttons.
- Read the CSV file and send it with POST /api/v1/upload.
- On Dashboard, request GET /api/v1/stats and draw charts.
- On Explorer, show and filter reviews.
- Show the "new concern found" message.

Demand from frontend:
The backend must always return the exact fields
written in the contract.

### 9.2 Backend

Job: Receive requests, connect all modules, return results.

- Receives POST /api/v1/upload (the CSV file).
- Receives GET /api/v1/stats.
- Validates and cleans the reviews.
- Calls analysis, LLM, RAG, and ranking modules.
- Saves and reads concern_stats.json.
- Handles the case when the stats file is missing.

Demand from backend:
The other modules must return the exact fields
written in the contract.

### 9.3 LLM module

Job: Read text and return entities + sentiment + confidence.

- Calls the open-source LLM (Groq + Llama).
- Splits reviews into batches of 25 to 30.
- Runs batches in parallel.
- Retries a batch once if the JSON is broken.
- Uses the rule-based fallback when the LLM fails.
- Returns one JSON list with index, entities,
  sentiment, and confidence.

Demand from LLM:
Return one list of:
{"index": 0, "aspects": [{"entity", "sentiment", "confidence"}]}

### 9.4 Analysis module

Job: Turn the LLM results into real concerns.

- Merge same-meaning phrases into one concern.
- Filter by support (5 or more reviews) and discrimination
  (negative ratio above overall).
- Grow the registry with new concerns.
- Re-scan old reviews when a new concern is added.
- Count the entities across all reviews.

Demand from analysis:
Return the list of aspects with name, sentiment,
confidence, and known flag.

### 9.5 RAG module

Job: Find similar old reviews as proof.

- Search old reviews using TF-IDF + cosine similarity.
- Return the best 3 for every concern with similarity scores.

### 9.6 Ranking module

Job: Say which problem to fix first.

- Impact score = count x negative percent.
- Sort from highest to lowest.
- Give priority numbers.

Demand from ranking:
Return concern, count, negative_pct, impact, priority.

### 9.7 Team lead

Job: Make sure all modules connect, write the demo,
and prepare the presentation.

---

## PART 10 — THE CONTRACT (what every module must return)

These fields are fixed. Do not rename or remove them.
You may only add new fields.

For exact sample outputs, read the separate file:
MODULE_CONTRACTS.md

### 10.1 Stats result (dashboard)

- total_reviews (number)
- sentiment_distribution (positive, negative)
- ranked_concerns (list)
- representative_reviews (list)

### 10.2 Concern registry (discovery)

- one entry per concern
- each entry has: canonical (final name) and terms (matching words)

### 10.3 Ranking result (per concern)

- concern (string)
- count (number)
- negative_pct (number)
- impact (number)
- priority (number)

---

## PART 11 — WORK FLOW FOR THE TEAM

### 11.1 Finish the core modules

1. Build the LLM module (Groq + Llama), batching, parallel calls,
   retry, and the rule-based fallback.
2. Build the analysis logic (merge, filter, registry, counting)
   and the real RAG index.
3. Make sure ranking works with real data.
4. Build the upload endpoint, connect everything in the backend,
   deploy on Render, get a live URL.
5. Build the upload button, remove sample data, connect the live URL.

### 11.2 Test everything

Every module must be tested:

- LLM: does the batch JSON come back clean? Does the fallback
  work when the LLM is down?
- Analysis: how many concerns did we find correctly?
  (precision and recall on a small labeled set)
- Ranking: is the priority order sensible?
- API: do all endpoints return the contract fields?

### 11.3 Final demo

1. Show the landing page.
2. Upload a CSV file with many reviews.
3. Wait for the batch to finish.
4. Show the dashboard summary (numbers + charts).
5. Show the ranked concerns in priority order.
6. Show real review quotes as proof.
7. Show a new concern being discovered.

---

## PART 12 — THINGS WE MUST REMEMBER

- No extra code. Every line must be used.
- No extra styling. Keep it simple.
- Do not rename contract fields.
- Every claim must have proof (real review quotes).
- Never say a number unless it is real. No fake numbers.
- Never send more than 30 reviews to the LLM in one call.
- Always keep the fallback. The app must work without the LLM.
- Counting, ranking, and math stay in Python. Not the LLM.
- No trained model. The LLM + rule-based fallback is the ML part.
- RAG is not optional: it proves every number with real quotes.
- Interview answers are in PART 5. Read them before the demo.

---

END OF DOCUMENT