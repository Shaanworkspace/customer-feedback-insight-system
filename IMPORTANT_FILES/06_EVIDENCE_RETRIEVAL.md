# Part 12 — Evidence Retrieval (Q171-188)

## 171. Is there evidence retrieval
Yes, but word-overlap stub, NOT vector/RAG. VERIFIED FROM CODE (`src/cfa/analysis/rag.py:1-42`).

## 172. How it works
`find_similar(text, top_k=5, reviews=None)`: loads `DATA_DIR/reviews.json` if exists else hardcoded `_EXAMPLE`; `_overlap = len(query_words & candidate_words)/len(query_words)` rounded 2 decimals; returns top_k sorted. No TF-IDF, no embeddings, no cosine from vectors, no FAISS/Pinecone/Chroma, no LLM, no generation. VERIFIED FROM CODE.

## 173. Is this RAG
No. THIS IS WORD-OVERLAP RETRIEVAL, NOT GENERATIVE RAG. No vector DB, no LLM generation. VERIFIED FROM CODE.

## 174. Is it used in production
Mostly bypassed. CSV path uses `buildCommentsByConcern` (first 5 texts per concern, similarity 1.0 hard-coded, `no RAG, just first 5`). Single-review path sets `similar_reviews=[]` with comment `No RAG — just empty similar`. Only `concerns.analyze_review:22` calls `find_similar`, then router discards it. VERIFIED FROM CODE (`pipeline.py:80-107`, `routers/analyze.py:45-46`, `aggregation.py:22-26`).

## 175. Quotes verbatim or generated
Verbatim first 5 review texts per concern. Stored in `analyses.data.comments_by_concern` + `proof_by_concern`, displayed in Dashboard proof section + `GET /api/v1/concern-comments?concern=`. VERIFIED FROM CODE (`stats.py:78-80`, `Dashboard.jsx` proof).

## 176. Semantic similarity
NOT IMPLEMENTED. No embedding model, no cosine similarity library, no distance metric. Overlap ratio is not semantic. Say NOT IMPLEMENTED.

## 177. Example
Query `battery drains fast` vs corpus `battery dies quickly` -> overlap `battery/3=0.33`. Returns `{id, text, score}`. VERIFIED FROM CODE logic.
