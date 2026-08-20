# RAG — Proof Module (full detail)

This document is for the team member who builds RAG.
It shows HOW to implement RAG with a free vector database,
what to use, and the EXACT input and output Python needs.

The RAG module gives every concern its proof:
real review quotes from the data.

```text
AI finds the problem. RAG proves it with real evidence.
```

---

## PART 1 — WHAT WE USE (the stack)

```text
Embeddings:  sentence-transformers / all-MiniLM-L6-v2
Vector DB:   ChromaDB (free, local, no signup)
Search:      ChromaDB built-in cosine similarity
```

Everything is free and open source.
No API key, no credit card, no internet needed at runtime.

### 1.1 Install

```text
pip install chromadb sentence-transformers
```

The first time the embedding model is used,
it downloads about 80 MB. After that it runs offline.

### 1.2 Why ChromaDB

- Free and local (demo works even without internet).
- Python native (the team can use it easily).
- Persistent (data is saved on disk).
- It is a REAL vector database, so we can honestly
  say "we used a vector DB" in the interview.

---

## PART 2 — THE FULL RAG FLOW

```text
STEP 1  EMBED   every review -> vector
STEP 2  STORE   all vectors in ChromaDB
STEP 3  QUERY   every concern -> top 3 closest reviews
STEP 4  PROOF   show the real review texts
```

### 2.1 What goes into ChromaDB (the data)

After the upload + LLM analysis, we have reviews.json:

```json
[
  {"review_id": "r1", "text": "battery dies in 2 hours", "entity": "battery", "sentiment": "negative"},
  {"review_id": "r2", "text": "great camera quality", "entity": "camera", "sentiment": "positive"},
  {"review_id": "r3", "text": "battery drains very fast", "entity": "battery", "sentiment": "negative"}
]
```

RAG reads this file, embeds every text, and stores
each review in ChromaDB with:

```text
id:      the review_id (r1, r2, ...)
text:    the review text
metadata: {"entity": "battery", "sentiment": "negative"}
```

### 2.2 The EXACT Python code (build the index)

```python
from sentence_transformers import SentenceTransformer
import chromadb

# 1. Load the embedding model (free, local)
model = SentenceTransformer("all-MiniLM-L6-v2")

# 2. Start ChromaDB (local, persistent)
client = chromadb.PersistentClient(path="models/rag_db")
collection = client.get_or_create_collection("reviews")

# 3. Embed all reviews and store them
reviews = load_reviews_json()  # from reviews.json

ids = [r["review_id"] for r in reviews]
texts = [r["text"] for r in reviews]
metas = [{"entity": r["entity"], "sentiment": r["sentiment"]} for r in reviews]

collection.add(
    ids=ids,
    documents=texts,
    metadatas=metas,
    embeddings=model.encode(texts).tolist(),
)
```

This is done ONCE after the upload pipeline finishes.

### 2.3 The EXACT Python code (query for proof)

```python
# 3. For every concern, find the 3 closest reviews
def get_proof(concern_name: str, top_k: int = 3):
    query_vec = model.encode([concern_name]).tolist()
    result = collection.query(
        query_embeddings=query_vec,
        n_results=top_k,
    )
    return [
        {
            "review_id": result["ids"][0][i],
            "text": result["documents"][0][i],
            "similarity": round(result["distances"][0][i], 2),
        }
        for i in range(len(result["ids"][0]))
    ]
```

For the concern "battery", this returns:

```json
[
  {"review_id": "r1", "text": "battery dies in 2 hours",     "similarity": 0.92},
  {"review_id": "r3", "text": "battery drains very fast",    "similarity": 0.89},
  {"review_id": "r7", "text": "worst battery life ever",     "similarity": 0.85}
]
```

### 2.4 What the backend receives from RAG

For every kept concern, the backend gets up to 3 quotes:

```json
{
  "battery": [
    {"review_id": "r1", "text": "battery dies in 2 hours",  "similarity": 0.92},
    {"review_id": "r3", "text": "battery drains very fast", "similarity": 0.89},
    {"review_id": "r7", "text": "worst battery life ever",  "similarity": 0.85}
  ],
  "delivery": [
    {"review_id": "r9",  "text": "delivery was very late",   "similarity": 0.90},
    {"review_id": "r12", "text": "package came after 5 days", "similarity": 0.87}
  ]
}
```

The backend saves these as representative_reviews in
concern_stats.json:

```json
"representative_reviews": [
  {"review_id": "r1", "text": "battery dies in 2 hours", "sentiment": "negative"},
  {"review_id": "r2", "text": "great camera quality", "sentiment": "positive"}
]
```

---

## PART 3 — THE EXACT CONTRACT

### 3.1 Input (what RAG needs)

```json
[
  {"review_id": "r1", "text": "battery dies in 2 hours", "entity": "battery", "sentiment": "negative"}
]
```

A list of reviews with:
- review_id (string)
- text (string)
- entity (string, the detected concern)
- sentiment (string, positive or negative)

### 3.2 Output (what RAG returns)

```json
{
  "battery": [
    {"review_id": "r1", "text": "battery dies in 2 hours", "similarity": 0.92}
  ]
}
```

- key = concern name
- value = list of up to 3 reviews
- each item: review_id, text, similarity (0.0 to 1.0)

### 3.3 Field names (do not rename)

- review_id
- text
- similarity

---

## PART 4 — HOW IT CONNECTS IN THE PIPELINE

```text
CSV upload
  -> LLM extracts entities + sentiment
  -> analysis counts + filters (kept concerns)
  -> RAG:
       1. embed all reviews -> ChromaDB (once)
       2. for each kept concern, query top 3
  -> ranking sorts the concerns
  -> backend saves concern_stats.json
  -> dashboard shows the quotes as proof
```

RAG runs AFTER the analysis module (it needs the kept
concerns) and BEFORE the ranking module.

---

## PART 5 — WHEN THERE ARE NO RESULTS

IF a concern has no similar reviews
THEN the RAG module returns an empty list for it.

```json
{"screen": []}
```

The backend then shows only the numbers for that concern
without quotes. The page must not break.

---

## PART 6 — SCALE (for the interview)

```text
DEMO (1000 reviews):  ChromaDB local, in-memory. Instant.

PRODUCTION (1M):      ChromaDB can handle it locally,
                      but we would move to FAISS or Qdrant
                      (cloud) for faster search.
```

Interview answer:

> "We use ChromaDB, a free open-source vector database,
> with sentence-transformers for embeddings. Every review
> is embedded and stored once. For every concern we query
> the top 3 closest reviews by cosine similarity. The
> quotes are always real reviews from the data, so the
> LLM cannot hallucinate the proof."

---

## PART 7 — RULES FOR THE RAG PERSON

- Use ChromaDB + sentence-transformers. No other DB.
- Embed every review ONCE after the upload.
- Query top 3 per kept concern.
- Return the exact shape in PART 3.
- Never make up a quote. Every quote is a real review.
- The system must work without internet (ChromaDB is local).

---

END OF DOCUMENT