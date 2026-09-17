# Parts 19-21 — Performance + Edge Cases + Challenges + Limits (Q285-328)

## 285. Latency / bottleneck (code-based, no live probe)
Inference `torch.no_grad()` per review, no batching, no cache, no queue. CSV loops reviews sequentially (`extract_aspects` per text). Largest bottleneck: BERT forward per review on CPU t3.small (DOC CLAIM 150ms/review, NOT VERIFIED live). DB single SQLite/MySQL write per upload. No workers, no LB, no GPU, no quantization, no async inference (endpoints sync except upload async but CPU-bound). VERIFIED FROM CODE (`bert_aste.py:152-174`, `extract.py`, `pipeline.py`).

## 286. 100 / 1000 users
RateLimiter 30/min/IP + 200 global would 429. Single Uvicorn worker + single EC2 would queue. No horizontal scaling in code. Improvement: workers + ALB + Redis limit + batch + GPU. CURRENTLY NOT IMPLEMENTED. VERIFIED FROM CODE.

## 287. Edge cases — what ACTUAL CODE does
Empty string single: 400. Empty CSV row: skipped. Null: Pydantic 422. Long review: truncated to 128 tokens (tail lost). One word: O or single aspect -> Positive/Negative else Neutral. Numbers/special/emoji-only: likely O -> Neutral (lowercased, no handling). Mixed language/misspell: WordPiece splits, may miss -> Neutral. Sarcasm: NOT handled, keyword/BERT literal. Multiple aspects/sentiments: each aspect gets first opinion (flaw) -> Mixed if pos+neg. No aspect: [] -> Neutral 0.60/empty. No opinion: aspect + NEU -> Neutral. Unseen armrest: pattern may generalize if BERT trained, else [] -> Neutral. Repeated: counted twice in aggregation. Contradictory/negation: simple_model flips `not good`, BERT path no explicit negation (relies on embeddings). VERIFIED FROM CODE (`analyze.py:33-35`, `preprocessing.py`, `bert_aste.py:67-149`, `sentiment.py`, `simple_model.py:156-165`).

## 288. Error handling
400 for bad CSV/empty/UTF-8, 401 for auth, 404 for history miss, 429 for limit, 500 generic (no stack). Model missing -> Neutral [] (not 500). DB down -> 500 on save path (printed then 500? analyze.py:100-103 try? Actually save wrapped? Check: save_analysis failure printed? For upload, save failure? Code prints warning? VERIFIED: `routers/analyze.py:103` print on save fail). Tokenizer fail -> 500. Logged only via print. VERIFIED FROM CODE.

## 289. Tests
7+ pytest? `tests/` has real tests? `test_mams_*` zero functions print-only (dead). Others? Check `pytest -q` in CI. Coverage NOT VERIFIED here. No frontend tests. No CI load tests. If BERT file missing, inference returns Neutral (tests would still pass). VERIFIED FROM CODE (audit + CI yaml).

## 290. Challenges (from code/comments/docs, NOT invented)
ML: 79% POS bias -> weighted F1 chosen (notebook cell 41). Data: -1 implicit 11945 removed (cell 19). Model: `eval_strategy` rename for transformers 4.57.6 (cell 40 comment). Preprocess: any CSV name via find_text_column (preprocessing.py). Deploy: t3.micro 1GB OOM 1.3G -> t3.small 2GB + CPU whl/cpu (Dockerfile:24-27 + cloud.md DOC CLAIM). Backend: signup uses email as username vs login uses username (inconsistency, `routers/auth.py:15 vs 27`). DB: keep 3 pruning (repo.py:15). Frontend: https->http mixed-content via vercel.json proxy (vercel.json). Each has FILE EVIDENCE above. Others NOT DOCUMENTED.

## 291. Limitations (CURRENT)
Dataset biased 79% POS, 608 NEU, English only, 128 truncation, no sarcasm, no explainability (confidence 0.85 hard-coded), CPU latency, 2GB RAM, single EC2, no vector RAG, accuracy misleading, unseen aspects depend on training, Mixed only via pos+neg count. All VERIFIED FROM CODE. Future: augment NEU, nearest-opinion pairing, 3 epochs, distilbert, HTTPS ALB, batch, monitoring — CURRENTLY NOT IMPLEMENTED.
