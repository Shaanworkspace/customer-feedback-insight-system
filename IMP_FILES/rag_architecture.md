> **Updated 2026-09-10 — Perfect BERT model (5 labels, no hard-coded list), flexible Any-CSV (ENGLISH_STOP_WORDS + dynamic 10%), online Aiven MySQL (no re-register), dashboard 80% + delete + timing + See more 5/10/55.**

# RAG Architecture — Local vs Deployed (Online)

> Dedicated note on how Retrieval-Augmented Generation (RAG) works in this project, how it runs **locally** vs **online (deployed)**, the exact differences, and why we use no Vector DB. Companion to `rag.md` (module internals) and `backend.md` (deployment).

---

## 1. What "RAG" means here

RAG = **Retrieval-Augmented Generation**. The classic idea: before answering, *retrieve* real evidence, then *generate* an answer grounded in it.

In this project we do the **Retrieval half only** (retrieval-only RAG):

- We **retrieve** the actual customer reviews that talk about a concern (e.g. `battery`).
- We **show the real source quote** as proof — we do **not** use an LLM to "generate" a summary.

This is deliberate and honest: the proof the user sees is the *exact text a customer wrote*, not a model's paraphrase. The "augmentation" is that the dashboard answer ("fix battery first") is backed by real, clickable evidence.

> File: `src/cfa/analysis/rag.py` → `find_similar(text, top_k=5, reviews=None)`.

---

## 2. Why RAG is in the product

Sentiment alone tells you *happy/sad*. Businesses need *why* and *proof*:

- "Battery is the #1 problem (impact 100)."
- "Show me the actual reviews that say this." → RAG answers that.

Without RAG, the system would only output labels. With RAG, every concern comes with **real customer quotes** — the differentiator for a hackathon evaluator.

---

## 3. Where the data lives (storage)

All results are persisted in a **relational database** through `src/cfa/db/`:

- `users` table — accounts (pbkdf2-hashed passwords), created at signup.
- `analyses` table — one row per upload, storing the full computed result as JSON (`reviews`, `ranked_concerns`, `comments_by_concern`, …).

Per user, **only the last 3 analyses are kept** (`HISTORY_KEEP = 3` in `repo.save_analysis` prunes older rows). The dashboard always reads the user's **latest** analysis.

Connection is `DATABASE_URL`:

| Mode | `DATABASE_URL` | Backend |
|------|----------------|---------|
| Online (deployed) | `mysql+pymysql://…@aivencloud.com:…/cfa` (SSL) | Aiven MySQL — persistent across restarts/re-deploys |
| Local (no env set) | unset | SQLite fallback `data/app.db` (gitignored) |

The RAG **algorithm is identical** in both modes — only the database host differs.

---

## 4. Local RAG architecture

```
 Browser (localhost:5173)
        │  click concern "battery"
        ▼
 Backend (localhost:8000)
        │  GET /api/v1/concern-comments?concern=battery
        ▼
 stats.get_concern_comments(concern, user_id)
        │  reads user's latest analysis from DB (SQLite fallback)
        │  returns comments_by_concern[concern]   ← real quotes
        ▼
 Dashboard shows the proof quotes
```

Key local facts:
- Reviews are stored per-user in the database (`analyses.data["reviews"]`), not a flat file.
- With no `DATABASE_URL`, the SQLite fallback (`data/app.db`) is used — same schema, fully local, no network.
- Retrieval is **instant** (thousands of reviews, pure Python set math).
- No external service, no Vector DB, no network call for RAG itself.
- `find_similar` still returns a safe `_EXAMPLE` placeholder if no reviews exist yet, so the UI never breaks.

---

## 5. Deployed / Online RAG architecture

```
 Browser (Vercel: customer-feedback-insight-system.vercel.app)
        │  click concern "battery"
        ▼
 Backend (EC2: 3.109.121.85:8000)   ← SAME code as local
        │  GET /api/v1/concern-comments?concern=battery
        ▼
 stats.get_concern_comments(concern, user_id)
        │  reads user's latest analysis from Aiven MySQL
        │  returns comments_by_concern[concern]   ← real quotes
        ▼
 Dashboard shows the proof quotes
```

Key online facts:
- The **algorithm and data model are identical** to local — same `find_similar`, same `get_concern_comments`, same database code. Only the database *host* (`DATABASE_URL`) differs.
- The trained model is **committed** to the repo (`models/*.joblib`), so local and online load the **exact same model**.
- CORS allows both `localhost:5173` and `*.vercel.app`, so the Vercel frontend can call the EC2 backend.
- Auth (JWT) protects every data endpoint, including RAG endpoints.
- Results persist in Aiven MySQL → they survive EC2 restarts and re-deploys (no ephemeral `data/` loss).
- **EC2 free tier cold-starts**: after idle, the first request (model load) is slower. Subsequent requests are fast.

---

## 6. Local vs Deployed — exact differences

| Aspect | Local | Deployed (Online) |
|--------|-------|-------------------|
| Backend URL | `http://localhost:8000` | `http://3.109.121.85:8000` |
| Frontend URL | `http://localhost:5173` | `https://…vercel.app` |
| RAG **algorithm** | word-overlap (`find_similar`) | word-overlap (`find_similar`) — **same** |
| Model used | committed `models/*.joblib` | committed `models/*.joblib` — **same** |
| Database | SQLite (`data/app.db`) fallback | Aiven MySQL (`cfa` DB) — persistent |
| Reviews survive restart? | yes (local file) | yes (MySQL) |
| User accounts | MySQL-backed (`users` table) | MySQL-backed (`users` table) — same |
| History per user | last 3 analyses | last 3 analyses |
| First-request latency | instant (already running) | cold-start delay on idle (free tier) |
| Internet needed | no | yes |
| CORS | allows localhost + vercel | allows localhost + vercel |
| Scale / traffic | single user dev | public internet, multi-user |

**Bottom line:** the RAG *logic* and data model are 100% the same online and offline. The only real difference is the **database host** (`DATABASE_URL`): local SQLite vs Aiven MySQL. Both persist results per user with a 3-analysis history.

---

## 7. RAG internals (the algorithm)

```python
def _overlap(query, text):
    q = set(query.lower().split())
    t = set(text.lower().split())
    if not q:
        return 0.0
    return round(len(q & t) / len(q), 2)   # query-coverage of shared words

def find_similar(text, top_k=5, reviews=None):
    if reviews is None:
        reviews = _load_reviews()          # data/reviews.json fallback
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
- During upload: `comments_by_concern` is built by calling `find_similar(concern, reviews=reviews)` per concern → saved inside the analysis row.
- On demand: `GET /api/v1/concern-comments?concern=...` returns the saved quotes (no recompute needed).
- Single review: `POST /api/v1/analyze` returns `similar_reviews` via `find_similar(review_text, reviews=db_reviews)`.

---

## 8. Why NO Vector DB / embeddings (locally or online)

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

**Trade-off:** word-overlap misses paraphrases ("the charge doesn't last" ≠ "battery"). That is a known limitation (see §10).

**Swap path (future):** the interface `find_similar(text, top_k, reviews=None)` stays the same. We can later replace the body with embedding search over a Vector DB without touching the API or frontend.

---

## 9. End-to-end RAG data flow (both modes)

```
1. Sign up  →  users row created (MySQL / SQLite)
2. Upload CSV
      └─ pipeline analyzes each row → sentiment + concerns
      └─ rank_concerns → builds comments_by_concern via find_similar(reviews=...)
      └─ save_analysis(user_id, file, stats)  ← one analyses row (last 3 kept)
3. User opens Dashboard
      └─ GET /stats, GET /reviews → read latest analyses row from DB
4. User clicks a concern (e.g. battery)
      └─ GET /concern-comments?concern=battery
      └─ returns real quotes from the saved analysis row
5. User pastes one review in Analyzer
      └─ POST /analyze → sentiment + concerns + similar_reviews(find_similar over DB reviews)
```

Local vs deployed: the **only** difference is which database hosts the `analyses`/`users` rows (`DATABASE_URL`).

---

## 10. Limitations & roadmap

**Limitations**
- Word-overlap misses synonyms/paraphrases (semantic gap).
- English-only.
- Only the last 3 analyses per user are retained (by design, for a clean history).

**Roadmap**
- **Embeddings + Vector DB** (semantic retrieval) when data grows to millions of rows or synonym matching matters.
- **Longer history** if needed (raise `HISTORY_KEEP` in `repo.py`).
- **Multilingual** embeddings.
- Keep `find_similar` signature stable so the swap is drop-in.

---

## 11. How to verify

- Local: see `user_flow.md` + run backend (`uvicorn cfa.api.main:app --port 8000`) and frontend (`npm run dev`); sign up, upload a CSV, click a concern, see real quotes. Set `DATABASE_URL` in `.env` to use Aiven MySQL locally too.
- Online: the deployed backend (`3.109.121.85:8000`, with `DATABASE_URL` set to Aiven MySQL in the EC2 dashboard) runs the **same** code; sign up, upload, click a concern — identical proof quotes, now persistent.
- Unit-level: `find_similar` is pure and testable; `tests/` covers the API + DB layer.
