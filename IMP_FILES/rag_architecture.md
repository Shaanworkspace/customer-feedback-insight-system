# RAG Architecture — Local vs Deployed (Online)

> Dedicated note on how Retrieval-Augmented Generation (RAG) works in this project, how it runs **locally** vs **online (deployed)**, the exact differences, and why we use no Vector DB. Companion to `rag.md` (module internals) and `backend.md` (deployment).

---

## 1. What "RAG" means here

RAG = **Retrieval-Augmented Generation**. The classic idea: before answering, *retrieve* real evidence, then *generate* an answer grounded in it.

In this project we do the **Retrieval half only** (retrieval-only RAG):

- We **retrieve** the actual customer reviews that talk about a concern (e.g. `battery`).
- We **show the real source quote** as proof — we do **not** use an LLM to "generate" a summary.

This is deliberate and honest: the proof the user sees is the *exact text a customer wrote*, not a model's paraphrase. The "augmentation" is that the dashboard answer ("fix battery first") is backed by real, clickable evidence.

> File: `src/cfa/analysis/rag.py` → `find_similar(text, top_k=5)`.

---

## 2. Why RAG is in the product

Sentiment alone tells you *happy/sad*. Businesses need *why* and *proof*:

- "Battery is the #1 problem (impact 100)."
- "Show me the actual reviews that say this." → RAG answers that.

Without RAG, the system would only output labels. With RAG, every concern comes with **real customer quotes** — the differentiator for a hackathon evaluator.

---

## 3. Local RAG architecture

```
 Browser (localhost:5173)
        │  click concern "battery"
        ▼
 Backend (localhost:8000)
        │  GET /api/v1/concern-comments?concern=battery
        ▼
 pipeline / rag.find_similar("battery")
        │  1. load data/reviews.json   (saved during upload)
        │  2. score each review by word-overlap with "battery"
        │  3. keep top 5 matches
        ▼
 returns [{review_id, text_preview, similarity}, ...]   ← real quotes
        ▼
 Dashboard shows the proof quotes
```

Key local facts:
- `data/reviews.json` lives on your **local disk** (gitignored). It persists across runs on the same machine.
- Retrieval is **instant** (thousands of reviews, pure Python set math).
- No external service, no database, no network call for RAG itself.
- If no reviews are saved yet, `find_similar` returns a safe `_EXAMPLE` placeholder so the UI never breaks.

---

## 4. Deployed / Online RAG architecture

```
 Browser (Vercel: customer-feedback-insight-system.vercel.app)
        │  click concern "battery"
        ▼
 Backend (Render: cfa-api.onrender.com)   ← SAME code as local
        │  GET /api/v1/concern-comments?concern=battery
        ▼
 rag.find_similar("battery")
        │  1. load data/reviews.json on the RENDER CONTAINER filesystem
        │  2. word-overlap scoring (identical algorithm)
        │  3. top 5 matches
        ▼
 returns real quotes (same shape as local)
```

Key online facts:
- The **algorithm is identical** to local — same `find_similar`, same word-overlap. Only the *hosting* differs.
- The trained model is **committed** to the repo (`models/*.joblib`), so local and online load the **exact same model**.
- CORS on the backend allows both `localhost:5173` and `*.vercel.app`, so the Vercel frontend can call the Render backend.
- Auth (JWT) protects every data endpoint, including RAG endpoints.
- **Render free tier cold-starts**: after idle, the first request (model load + reviews load) is slower. Subsequent requests are fast.

---

## 5. Local vs Deployed — exact differences

| Aspect | Local | Deployed (Online) |
|--------|-------|-------------------|
| Backend URL | `http://localhost:8000` | `https://cfa-api.onrender.com` |
| Frontend URL | `http://localhost:5173` | `https://…vercel.app` |
| RAG **algorithm** | word-overlap (`find_similar`) | word-overlap (`find_similar`) — **same** |
| Model used | committed `models/*.joblib` | committed `models/*.joblib` — **same** |
| `reviews.json` storage | local disk (persists on that machine) | Render container filesystem (**ephemeral**) |
| Reviews survive restart? | yes (same machine) | **no** — lost on Render restart/cold start until re-upload |
| User accounts | in-memory, reset on restart | in-memory, reset on restart (Render restarts more often) |
| First-request latency | instant (already running) | cold-start delay on idle (free tier) |
| Internet needed | no | yes |
| CORS | allows localhost + vercel | allows localhost + vercel |
| Scale / traffic | single user dev | public internet, multi-user |

**Bottom line:** the RAG *logic* is 100% the same online and offline. The only real differences are **where `reviews.json` lives** (local disk vs ephemeral Render filesystem) and **runtime lifecycle** (in-memory users + cold starts reset more often online).

---

## 6. RAG internals (the algorithm)

```python
def _overlap(query, text):
    q = set(query.lower().split())
    t = set(text.lower().split())
    if not q:
        return 0.0
    return round(len(q & t) / len(q), 2)   # query-coverage of shared words

def find_similar(text, top_k=5):
    reviews = _load_reviews()              # from data/reviews.json
    if not reviews:
        return _EXAMPLE[:top_k]            # safe placeholder
    scored = [(score, r) for r in reviews
              if (score := _overlap(text, r["text"])) > 0]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [{"review_id": r["review_id"],
             "text_preview": r["text"],
             "similarity": score} for score, r in scored[:top_k]]
```

- **Input:** a concern name (e.g. `battery`) or a review's text (for `analyze`).
- **Score:** how many of the query's words also appear in the review, divided by the number of query words (range `0.0–1.0`).
- **Output:** top-`top_k` (default 5) saved reviews with their real text + a similarity score.
- **No embeddings, no neural network, no Vector DB.** Just token sets.

Where it is called:
- During upload: `comments_by_concern` is built by calling `find_similar(concern)` per concern → saved in `concern_stats.json`.
- On demand: `GET /api/v1/concern-comments?concern=...` returns the saved quotes.
- Single review: `POST /api/v1/analyze` also returns `similar_reviews` via `find_similar`.

---

## 7. Why NO Vector DB / embeddings (locally or online)

A Vector DB (FAISS, Pinecone, Chroma, Qdrant) + embeddings (sentence-transformers, OpenAI) is the "standard" RAG stack. We **intentionally skipped it**:

| Concern | Word-overlap (ours) | Vector DB + embeddings |
|---------|---------------------|------------------------|
| Infra | none (pure Python) | extra service / paid API |
| Cost | $0 | compute + possibly $ |
| Latency | microseconds (thousands of rows) | index build + query |
| Semantic match | ❌ misses synonyms | ✅ understands meaning |
| Fit at our scale | ✅ great | ⚠️ overkill |

We chose word-overlap because:
1. Our data is **thousands of reviews**, not millions.
2. Concern names are short and keyword-like (`battery`, `camera`, `delivery`) → exact word match is already strong.
3. Zero infra = easy to deploy, demo, and explain (no black box).

**Trade-off:** word-overlap misses paraphrases ("the charge doesn't last" ≠ "battery"). That is a known limitation (see §9).

**Swap path (future):** the interface `find_similar(text, top_k)` stays the same. We can later replace the body with embedding search over a Vector DB without touching the API or frontend.

---

## 8. End-to-end RAG data flow (both modes)

```
1. Upload CSV
     └─ pipeline analyzes each row → sentiment + concerns
     └─ saves data/reviews.json
     └─ rank_concerns → builds comments_by_concern via find_similar()
     └─ saves data/concern_stats.json

2. User opens Dashboard
     └─ GET /stats, GET /reviews → charts + list

3. User clicks a concern (e.g. battery)
     └─ GET /concern-comments?concern=battery
     └─ returns real quotes retrieved by find_similar()

4. User pastes one review in Analyzer
     └─ POST /analyze → sentiment + concerns + similar_reviews (find_similar)
```

Online vs local: the **only** difference is which machine `data/reviews.json` is read from.

---

## 9. Limitations & roadmap

**Limitations**
- Word-overlap misses synonyms/paraphrases (semantic gap).
- On Render, `data/` is ephemeral → after a restart the saved reviews are gone until a new upload.
- User accounts are in-memory (temporary, by design).
- English-only.

**Roadmap**
- **Embeddings + Vector DB** (semantic retrieval) when data grows to millions of rows or synonym matching matters.
- **Persistent database** (Postgres / Render Disk) so uploaded reviews survive restarts online.
- **Persistent user store** (replace in-memory users) for real multi-user use.
- **Multilingual** embeddings.
- Keep `find_similar` signature stable so the swap is drop-in.

---

## 10. How to verify

- Local: see `user_flow.md` + run backend (`uvicorn cfa.api.main:app --port 8000`) and frontend (`npm run dev`); upload a CSV, click a concern, see real quotes.
- Online: the deployed backend (`cfa-api.onrender.com`) runs the **same** RAG code; sign up, upload, click a concern — identical proof quotes (modulo the ephemeral `data/` reset on restart).
- Unit-level: `find_similar` is pure and testable; add a small test in `tests/` if needed.
