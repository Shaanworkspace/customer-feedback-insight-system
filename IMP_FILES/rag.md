# RAG Documentation — "Show me real proof"

RAG stands for **Retrieval-Augmented Generation**. In plain words: *before you answer, go fetch real facts and use them.*

In this project, RAG is used for one job: **when we say "battery is a top problem", we show the actual customer reviews that talk about battery.** Those reviews are the "retrieved" evidence.

This file explains (1) what RAG is, (2) exactly how we implemented it here, (3) why we chose this approach, and (4) the interview trap questions with answers.

---

## 1. What is RAG in normal terms?

Imagine you have to answer a question but you are not allowed to guess. So you first open a book, find the relevant pages, and then answer *using those pages*. That "open the book and find pages" step is **retrieval**. Answering with those pages is **augmented generation**.

In a fancy LLM system, RAG means: take the user's question → search a knowledge base → put the found texts into the prompt → let the model write the answer.

In our project we do **not** have a big language model generating text. We do the **retrieval** part only: we fetch the real reviews that match a concern and show them to the user as proof. That is a lightweight, honest version of RAG — perfect for a hackathon.

---

## 2. How RAG works in THIS project

File: `src/cfa/analysis/rag.py`

### The function

```python
def find_similar(text: str, top_k: int = 5) -> list:
    reviews = _load_reviews()              # read data/reviews.json
    if not reviews:
        return _EXAMPLE[:top_k]            # safe placeholder if empty
    scored = [
        (score, r) for r in reviews
        if (score := _overlap(text, r["text"])) > 0
    ]
    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {"review_id": r["review_id"], "text_preview": r["text"], "similarity": score}
        for score, r in scored[:top_k]
    ]
```

### The similarity math (_overlap)

We do **word-overlap** (a simple Jaccard-like score). No neural network, no embeddings.

```python
def _overlap(query: str, text: str) -> float:
    q = set(query.lower().split())
    t = set(text.lower().split())
    if not q:
        return 0.0
    return round(len(q & t) / len(q), 2)
```

Translation:
- Split the query and the review into words (sets, so duplicates ignored).
- Count how many query words also appear in the review.
- Divide by the number of query words.
- Result is between 0 and 1.

### Worked example

Query: `"battery"` → words = {battery}
Review A: `"Battery drains very fast, dies in 2 hours"` → words include battery
Overlap = 1 / 1 = **1.0**

Review B: `"Camera is blurry and screen cracked"` → no battery
Overlap = 0 / 1 = **0.0** → filtered out

Review C: `"Battery overheats while charging"` → has battery
Overlap = **1.0**

So `find_similar("battery")` returns Review A and Review C at the top, with similarity 1.0.

### Where it is called

During upload, for each concern we call:

```python
find_similar(name.replace("_", " "), top_k=5)
# e.g. concern "customer_service" -> query "customer service"
```

It finds the 5 real reviews whose text overlaps most with the concern name, and those become the "proof" quotes shown in the **View Comments** modal.

### The empty-case safety net

```python
_EXAMPLE = [{"review_id": "abc123", "text_preview": "battery dies in 2 hours, camera is fine", "similarity": 0.83}]
```

If `reviews.json` is empty (no upload yet), `find_similar` returns this placeholder so the UI never crashes. This is important on a fresh deploy where `data/` is empty.

---

## 3. Why we used THIS approach (design choices)

| Choice | Why we did it | Trade-off |
|--------|---------------|-----------|
| Word-overlap instead of embeddings | No model, no GPU, instant, easy to explain | Less "smart" than semantic search |
| Read from `reviews.json` (saved file) | Fast; no DB needed | Must upload first |
| Top-5 simple list | Enough for proof quotes | Not ranked by date/sentiment |
| Placeholder when empty | UI never breaks on fresh deploy | Shows dummy text until real data |

---

## 4. Interview trap questions (with answers)

### Q1. "Why RAG and not just fine-tuning a model?"
**A:** Fine-tuning changes the model's weights to memorize a task. RAG keeps the model fixed and feeds it fresh facts at runtime. For "show the real reviews about battery", we don't need the model to *know* battery reviews — we need to *fetch* them. RAG is cheaper, updatable (just change the data file), and explainable (you can show the source review). Fine-tuning would be overkill and would not let us show the exact source quote.

### Q2. "Why not use a vector database / embeddings?"
**A:** For a hackathon-scale dataset (thousands of reviews) and a proof-quote feature, word-overlap is instant and needs zero infrastructure. Embeddings + a vector DB (like FAISS or Pinecone) would be more semantically accurate ("battery" matches "power cell") but adds complexity, latency, and a service to maintain. We traded a little accuracy for simplicity and speed. If the dataset grew to millions, we would switch to embeddings.

### Q3. "Is this even RAG if there is no generator/LLM?"
**A:** It is the **Retrieval** half of RAG. Classic RAG = retrieve + generate. We retrieve real evidence and present it directly. The "generation" step is replaced by simply displaying the retrieved reviews. This is a common, valid pattern called "retrieval-augmented display" or "retrieval-only RAG". It is honest because the proof is the literal source text, not a model's paraphrase.

### Q4. "What is your similarity metric and why?"
**A:** Word-overlap = (query words ∩ review words) / (query words). It is a subset-overlap ratio. We chose it because the query is a single concern name (1-2 words), so we just need to know "does this review mention that word?" Cosine similarity over embeddings would be more robust to synonyms but heavier. For single-keyword queries, overlap is sufficient and transparent.

### Q5. "What happens when reviews.json is empty?"
**A:** `find_similar` returns a hardcoded `_EXAMPLE` placeholder so the frontend modal still renders. This prevents a crash on a fresh deploy where no CSV has been uploaded yet. Once a real upload happens, the placeholder is never used.

### Q6. "How would you scale this to millions of reviews?"
**A:** (a) Move storage to a database (Postgres / Elasticsearch). (b) Pre-compute embeddings and use a vector index (FAISS/Pinecone) for semantic search. (c) Index by concern so we don't scan every review. (d) Cache the top-5 per concern. The current code is intentionally simple; the retrieval interface (`find_similar`) would stay the same while the internals swap to embeddings.

### Q7. "Retrieval vs Generation — which did you do and why?"
**A:** Retrieval only. Because our goal is *evidence*, not *text generation*. Showing the exact customer quote is more trustworthy than asking a model to summarize and possibly hallucinate. Generation would add risk with no benefit here.

### Q8. "Why compute comments at upload time, not on click?"
**A:** During upload we already loop over all reviews once. Computing `comments_by_concern` then is O(rows) total. If we computed it on every "View Comments" click, we'd re-scan all reviews each time (slower for big files). Precomputing at upload makes the click instant.

### Q9. "What is a real weakness of word-overlap here?"
**A:** Synonyms and phrasing. "Battery" won't match "power cell" or "charge dies". Also it is language-specific (English only). Embeddings would fix that. This is the honest limitation to name in an interview.

### Q10. "Complete flow in one breath?"
**A:** Upload CSV -> analyze each row -> save reviews to reviews.json -> for each concern call find_similar(concern_name) -> pick top-5 overlapping reviews -> store as comments_by_concern -> Dashboard clicks a concern -> GET /api/v1/concern-comments?concern=battery -> modal shows those 5 real reviews as proof.

---

## 5. Quick interview one-liner

> "We use a retrieval-only RAG: we store analyzed reviews and, per concern, fetch the top-5 reviews with the highest word-overlap as real proof. We chose simple word-overlap over embeddings for speed and zero infra, with a placeholder fallback for empty data."
