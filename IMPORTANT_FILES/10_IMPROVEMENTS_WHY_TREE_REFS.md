# Parts 22-26 — Improvements + Why + Alternatives + Resume Check + Fact Check (Q329-360+)

## 329. Future improvements (each: CURRENTLY IMPLEMENTED? NO unless noted)
Better balanced data (NEU 608->2k): NO. Better model (3 epochs, nearest opinion, class weights): NO. Better eval (real scores, confusion matrix, CV): NO. Embeddings/vector DB/true RAG/LLM/Groq/Llama: NO (only word overlap). Explainability (real confidence): NO (0.85 hard-coded). Monitoring (CloudWatch agent): NOT VERIFIED in code. CI/CD scaling/security/quant/GPU/batch: NO. Auth refresh/roles: NO. Email report: NO (schema dead). YES only: basic CI pytest + npm build, Docker healthcheck, rate limit in-memory, JWT 1h.

## 330. Why this tech (DOCUMENTED vs INTERPRETATION vs NOT DOCUMENTED)
Python: code uses it, reason NOT DOCUMENTED. BERT: code uses bert-base-uncased, reason DOC CLAIM (pattern not list) in model.md, not in code. HuggingFace/PyTorch/token-classification: code uses, reason NOT DOCUMENTED. FastAPI: code uses, reason NOT DOCUMENTED (assumed auto-docs, but do not claim). React: versions only, NOT DOCUMENTED. MySQL: fallback code, NOT DOCUMENTED. Docker/AWS/EC2/TF-IDF/metrics/dataset/architecture/schema/deployment: code shows what, why is DOC CLAIM in IMP_FILES/cloud.md/pipeline.md or NOT DOCUMENTED. Never fabricate.

## 331. Alternatives (TESTED vs NOT TESTED)
BERT vs TF-IDF+LogReg vs LSTM vs other transformers: NOT TESTED in code (no TF-IDF file, no LSTM). Only `simple_model.py` lexicon demo exists (not ML baseline). DistilBERT mentioned in docs (250M backup F1 0.66 DOC CLAIM) but no code. Say NOT TESTED.

## 332. Interview follow-up tree (sample)
BERT -> Q What is BERT? A 12-layer bidirectional encoder, base uncased 110M, we add 5-label head. Evidence bert_aste.py:52 config.json. Follow-up Why not TF-IDF? A TF-IDF not in code, BERT learns order/pattern.
FastAPI -> Q Why FastAPI? A Code uses FastAPI+Uvicorn, reason not documented, features used: Pydantic/Depends/CORS/middleware. Evidence main.py.
MySQL -> Q Schema? A users+analyses JSON. Evidence models.py.
JWT -> Q How? A manual HS256 pbkdf2 100k 1h localStorage. Evidence auth.py:25-80.
Docker/AWS/EC2 -> Q How deployed? A python:3.11-slim CPU torch, ECR amd64, SSM to i-..., mount model ro. Evidence Dockerfile deploy.yml.
Retrieval -> Q RAG? A No, word overlap first-5, similarity 1.0 hard-coded. Evidence rag.py pipeline.py:81.

## 333. What-if (CURRENT vs IMPROVED)
Wrong prediction: CURRENT returns it with 0.85 fake confidence, no flag. Improve: threshold + human review.
Empty: CURRENT 400. Long 10k: CURRENT truncates to 128. 1000 users: CURRENT 429 + queue. EC2 crash: CURRENT restart unless-stopped, no LB (docs claim). DB down: CURRENT 500. Model corrupted/missing: CURRENT Neutral [] (silent). New aspect: CURRENT pattern or Neutral. Mixed: CURRENT pos&neg->Mixed. Same review twice: CURRENT duplicate counts + new history row (prune 3). JWT expiry: CURRENT 401 -> login. Malicious input: CURRENT strip/Pydantic/ORM, no WAF. RAM exceed: CURRENT OOM kill (t3.micro) -> t3.small. Slow: CURRENT sequential, improve batch/GPU. 10x data: CURRENT slow + history prune, improve queue/pagination.

## 334. Resume claim validation (use this table)
BERT: EVIDENCE bert_aste.py:52 config.json -> PARTIALLY VERIFIED (code loads, training not verified).
16K reviews: EVIDENCE dmaste_clean.csv 16288 -> FULLY VERIFIED for rows, PARTIALLY for 7524 reviews (6337 verified).
Weighted F1 0.875: EVIDENCE only example print cell 45 -> NOT VERIFIED (no metrics file).
TF-IDF F1 0.45: EVIDENCE none -> NOT IMPLEMENTED.
FastAPI/MySQL/React/Docker/AWS EC2: EVIDENCE files above -> FULLY VERIFIED for existence, PARTIALLY for live URLs.
Evidence retrieval: EVIDENCE rag.py word overlap -> PARTIALLY VERIFIED, MISLEADING if called RAG/vector.
Aspect sentiment: EVIDENCE 5 labels + Mixed -> FULLY VERIFIED.
RAG/GenAI/Groq/Llama/Redis: EVIDENCE zero hits -> NOT IMPLEMENTED, remove from resume.

## 335. FINAL FACT CHECK
IMPLEMENTED: CSV upload/analyze, 5-label BERT load/infer, Mixed rule, count×neg ranking, first-5 proof, 13 endpoints, PBKDF2+HS256 JWT 1h, 2-table DB keep-3, React dashboard, Docker CPU, ECR+SSM deploy, rate limit, CORS proxy.
NOT IMPLEMENTED: TF-IDF baseline/model, vector RAG/FAISS/embeddings/LLM, class weights/SMOTE, real confidence, email send, refresh token, Redis, GPU/batch/quant, CloudWatch agent in code, migrations.
NOT VERIFIED: training run/scores/duration, 7524 count, live URLs/scaling numbers, S3 sync/IAM policies in code.
DOCUMENTED BUT UNUSED: SMTP vars, HF_TOKEN/MODEL, EmailReportRequest, reporting/store, render.yaml Render path, distilbert backup.
MUST MEMORIZE: bert-base-uncased 110M 12x768x12, 5 labels O/ASPECT/OPINION_*, label2id 0-4, max_length 128, lr 2e-5 batch16 epochs2, 16288 POS79% NEG17% NEU4%, leakage 0 via review split random42, Mixed pos&neg, confidence 0.85 hard-coded, first-opinion flaw, JWT 3600 pbkdf2 100k, tables users/analyses JSON keep3, endpoints list, Docker python:3.11-slim CPU mount ro, ECR ap-south-1 SSM i-..., word-overlap NOT RAG.
DANGEROUS Qs: Show F1 0.875 proof? (no file) Is this RAG? (no) Where is TF-IDF? (nowhere) Why 5 labels saved as LABEL_0? (mapping in code) What if model missing? (silent Neutral) Why accuracy not used? (79% bias).
