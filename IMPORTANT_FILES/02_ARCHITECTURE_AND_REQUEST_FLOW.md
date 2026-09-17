# Parts 2-3 — Architecture + End-to-End Request (Q21-49)

## 21. Overall architecture
Layered monolith (NOT microservices): `Vercel React → FastAPI → BERT → MySQL`. One deployable app. VERIFIED FROM CODE (`README.md:35-43` + `src/` layout).

## 22. Frontend components
`App.jsx` (?view= router), `Dashboard.jsx` (charts + history), `Analyzer.jsx` (single review), `Explorer.jsx` (review list), `Upload.jsx` (CSV), `Login.jsx`, `Profile.jsx`, landing + header/footer. VERIFIED FROM CODE (`frontend/src/` listing).

## 23. Backend components
`main.py` (app + middleware) → 3 routers (`auth`, `analyze`, `data`) → `pipeline.py` (CSV flow) → `analysis/` (extract/sentiment/rank) → `ml/bert_aste.py` (inference) → `db/repo.py` (storage). VERIFIED FROM CODE.

## 24. Where is the ML model located?
Folder `bert_aste_final/` at project root; code resolves it as `PROJECT_ROOT / "bert_aste_final"`. VERIFIED FROM CODE (`src/cfa/ml/bert_aste.py:18-19`).

## 25. Where is the database located?
Aiven MySQL in cloud when `DATABASE_URL` set, else `data/app.db` SQLite file next to code. VERIFIED FROM CODE (`src/cfa/db/core.py:37-48`).

## 26. Where is the model artifact stored?
In git: NOT (dockerignore + gitignore exclude it; EC2 host path `/opt/.../model` mounted read-only). DOC CLAIM (`Dockerfile:29`, `.dockerignore`, `IMP_FILES/cloud.md`). On disk here: `bert_aste_final/model.safetensors` (~435MB). VERIFIED FROM CODE.

## 27. Where does inference happen?
Inside the FastAPI process: `predict_review()` in `src/cfa/ml/bert_aste.py:152-170`, called per review from `extract_aspects()` loop. VERIFIED FROM CODE.

## 28. Where does preprocessing happen?
Two places: CSV cleaning in `src/cfa/analysis/preprocessing.py:51-96` (`clean_text`, column detect); tokenization at inference in `bert_aste.py:160`. VERIFIED FROM CODE.

## 29. Where does post-processing happen?
`decode_predictions()` + `build_triplets()` + `get_overall()` in `bert_aste.py:67-149`, then `SentimentClassifier.classify()` in `sentiment.py:7-21`, then `rank_concerns()` in `ranking/priority.py:7-28`. VERIFIED FROM CODE.

## 30. Frontend ↔ backend
`fetch()` JSON + `Authorization: Bearer <token>` header; base URL from `VITE_API_BASE` or localhost:8000 or same-origin `/api` on Vercel. VERIFIED FROM CODE (`frontend/src/api.js:1-62`).

## 31. Backend ↔ model
Direct in-process Python call (no HTTP, no queue): `analyze.py` → `concerns.py` → `extract.py` → `bert_aste.predict_review()`. Model object cached in module globals `_model/_tokenizer`. VERIFIED FROM CODE.

## 32. Backend ↔ database
SQLAlchemy ORM session (`SessionLocal`), `repo.py` functions. No handwritten SQL except one `ALTER TABLE` migration. VERIFIED FROM CODE.

## 33. Exact data flow (code names, not generic words)
User types/uploads → `api.js analyzeReview()/uploadReviews()` → `POST /api/v1/analyze` (`analyze_single_review`) or `POST /api/v1/upload` (`upload_csv_file`) → `clean_text()`/`decodeCsvBytesToText()` → `extract_aspects()` → `predict_review()` (BERT 5-label, max_length 128) → `decode_predictions()` → `build_triplets()` → `SentimentClassifier.classify()` (Mixed rule) → `rank_concerns()` (impact = normalized count×negative%) → `save_analysis()` (MySQL `analyses.data`) → JSON back → Recharts pie/bar + tables. VERIFIED FROM CODE.

## Part 3 — One real request: "The battery life is excellent but the camera quality is poor."

## 34. Which frontend component receives the text?
`frontend/src/components/Analyzer.jsx` textarea → `analyzeReview(text)`. VERIFIED FROM CODE.

## 35-37. Endpoint, method, body
`POST /api/v1/analyze` with JSON `{"review_text": "The battery life is excellent but the camera quality is poor."}`. VERIFIED FROM CODE (`routers/analyze.py:31-33`, `schemas.py:6-7`).

## 38. Which backend function receives it?
`analyze_single_review()` in `src/cfa/api/routers/analyze.py:31-49`. Requires JWT (`Depends(get_current_user)`). VERIFIED FROM CODE.

## 39. What validation happens?
`(request.review_text or "").strip()`; empty → HTTP 400. VERIFIED FROM CODE (line 33-34).

## 40. What preprocessing happens?
For single review: none besides strip (no clean_text call on this path — clean_text is CSV-path only). Tokenizer lowercases internally (bert-base-uncased). VERIFIED FROM CODE.

## 41-42. Tokenizer/model call + inside inference
`AutoTokenizer` from `bert_aste_final/` (else `bert-base-uncased`), `truncation=True, max_length=128`, `torch.no_grad()`, `AutoModelForTokenClassification` forward, `argmax` over 5 labels per token. VERIFIED FROM CODE (`bert_aste.py:152-170`).

## 43. What output does the model produce?
Per-token label ids → decoded to aspect spans + opinion spans (`decode_predictions`). VERIFIED FROM CODE.

## 44. Converted to human-readable sentiment?
`build_triplets()` pairs each aspect with first opinion's sentiment, mapping POS→Positive, NEG→Negative, NEU→Neutral. VERIFIED FROM CODE (`bert_aste.py:120-149`).

## 45. Aspects/opinions/sentiments extracted?
`extract_aspects()` returns `[{"name": aspect.lower(), "sentiment": ..., "matched_terms": [aspect], "confidence": 0.85}]` — confidence is HARD-CODED 0.85, not from model. VERIFIED FROM CODE (`extract.py:14-37`).

## 46-47. Stored? Which table?
Single-review path does NOT save to DB (no `save_analysis` call on this path — only `metrics` counters). Only CSV upload saves to `analyses` table. VERIFIED FROM CODE (analyze.py:31-49 has no save call).

## 48. JSON response returned?
`{review_text, overall_sentiment, sentiment, overall_confidence, concerns, aspects, ranked_concerns, similar_reviews: []}`. Note `similar_reviews` is FORCED to `[]`. VERIFIED FROM CODE (analyze.py:42-48).

## 49. How does frontend display it?
`Analyzer.jsx` shows `overall_sentiment`, `overall_confidence`, and `concerns[].name/matched_terms/confidence/sentiment`. VERIFIED FROM CODE.
