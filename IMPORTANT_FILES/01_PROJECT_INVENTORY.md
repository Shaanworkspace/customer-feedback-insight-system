# Part 1 — Project Inventory (Q1-20)

## 1. Project name
**Customer Feedback Insight System** — VERIFIED FROM CODE (`README.md:1`, `src/cfa/api/main.py` title "Customer Feedback Insight System").

## 2. Exact purpose
Take a CSV of customer reviews and answer: what customers talk about (aspects), how they feel per aspect, overall feeling, and what to fix first. VERIFIED FROM CODE (`README.md:16-21`).

## 3. Main problem being solved
Businesses get thousands of reviews and cannot read them manually. They cannot answer: are customers happy, which aspect is the problem, which concern is most urgent. VERIFIED FROM CODE (`Customer_Feedback_Insight_System_Project_Plan.pdf`, pages 1-2).

## 4. Main user flow
Sign up / login → upload CSV (or paste one review in Analyzer) → backend analyzes → dashboard shows pie/bar charts + ranked concerns + proof quotes. VERIFIED FROM CODE (`frontend/src/App.jsx` views: landing, login, upload, dashboard, analyzer, explorer, profile).

## 5. All major folders
- `src/cfa/api/` — FastAPI app, routers, auth, schemas. VERIFIED FROM CODE.
- `src/cfa/analysis/` — preprocessing, aspect extraction, sentiment, ranking helpers, stats, retrieval. VERIFIED FROM CODE.
- `src/cfa/ml/` — only `bert_aste.py` (BERT load + inference). VERIFIED FROM CODE.
- `src/cfa/ranking/` — `priority.py` concern ranking. VERIFIED FROM CODE.
- `src/cfa/db/` — engine, models, repo (CRUD). VERIFIED FROM CODE.
- `src/cfa/core/` — only `config.py` (paths + SMTP names). No security code here. VERIFIED FROM CODE.
- `src/cfa/reporting/` — BROKEN: `__init__.py` imports `store.py` which does not exist. VERIFIED FROM CODE.
- `frontend/` — React 19 + Vite + Tailwind + Recharts. VERIFIED FROM CODE (`frontend/package.json`).
- `notebooks/` — `Final_Perfect_Model.ipynb` + `Final_Journal.ipynb` (training). VERIFIED FROM CODE.
- `bert_aste_final/` — trained model files. VERIFIED FROM CODE.
- `tests/`, `testing_csvs/`, `IMP_FILES/`, `data/` (only app.db/test.db, no CSVs). VERIFIED FROM CODE.

## 6. All important files
- `src/cfa/api/main.py` — app start, routers, rate limit, CORS. VERIFIED FROM CODE.
- `src/cfa/api/routers/auth.py`, `analyze.py`, `data.py` — all endpoints. VERIFIED FROM CODE.
- `src/cfa/api/auth.py` — password hash + hand-made JWT. VERIFIED FROM CODE.
- `src/cfa/api/pipeline.py` — CSV → stats flow. VERIFIED FROM CODE.
- `src/cfa/ml/bert_aste.py` — model load + `predict_review()`. VERIFIED FROM CODE.
- `src/cfa/analysis/extract.py`, `sentiment.py`, `concerns.py`, `preprocessing.py`, `aggregation.py`, `stats.py`, `rag.py`. VERIFIED FROM CODE.
- `src/cfa/ranking/priority.py` — `rank_concerns()`. VERIFIED FROM CODE.
- `src/cfa/db/models.py`, `core.py`, `repo.py`. VERIFIED FROM CODE.
- `notebooks/Final_Perfect_Model.ipynb` — training (60+ cells, never executed — outputs empty). VERIFIED FROM CODE.
- `bert_aste_final/config.json`, `tokenizer.json`, `model.safetensors`, `training_args.bin`. VERIFIED FROM CODE.
- `Dockerfile`, `render.yaml`, `frontend/vercel.json`, `.env.example`, `requirements.txt`. VERIFIED FROM CODE.
- `frontend/src/api.js` — all backend calls (fetch, no axios). VERIFIED FROM CODE.

## 7. Frontend technology
React 19.2.8 + Vite 8 + TailwindCSS 4 + Recharts 3.10. No axios, no react-router, no redux. VERIFIED FROM CODE (`frontend/package.json`).

## 8. Backend technology
FastAPI + Uvicorn + SQLAlchemy 2.0 + Pydantic. VERIFIED FROM CODE (`requirements.txt`, `pyproject.toml`).

## 9. ML/NLP technology
HuggingFace Transformers (BERT token classification) + PyTorch (CPU) + scikit-learn (only for stopword list, not for modeling). No LangChain, no OpenAI, no embeddings lib. VERIFIED FROM CODE (`src/cfa/ml/bert_aste.py`, grep for langchain/openai = zero hits).

## 10. Database
MySQL (Aiven) via pymysql when `DATABASE_URL` is set, else local SQLite `data/app.db`. Only 2 tables: `users`, `analyses`. VERIFIED FROM CODE (`src/cfa/db/core.py:37-53`, `src/cfa/db/models.py`).

## 11. Deployment platform
Frontend: Vercel (DOC CLAIM + `frontend/vercel.json` proxy to `http://3.109.121.85:8000`). Backend: AWS EC2 t3.small (DOC CLAIM in `README.md`, `IMP_FILES/cloud.md`). `render.yaml` exists but Render is NOT the live backend per docs. VERIFIED FROM CODE for files; live URLs are DOC CLAIMS.

## 12. Docker usage
Yes. `Dockerfile`: `python:3.11-slim`, CPU torch, `COPY src` only (model NOT in image, mounted read-only), port 8000, `uvicorn cfa.api.main:app`. VERIFIED FROM CODE (`Dockerfile:1-39`).

## 13. Authentication/security
Yes, hand-made: PBKDF2-SHA256 password hash (100k rounds) + manual HS256 JWT (1-hour expiry). VERIFIED FROM CODE (`src/cfa/api/auth.py:25-80`).

## 14. External APIs/services
None called by backend code. No HuggingFace API calls, no OpenAI, no email sending (SMTP vars defined but never used). VERIFIED FROM CODE (grep HF_TOKEN/SMTP in `src/` = zero consumers).

## 15. Model files/artifacts
`bert_aste_final/`: `config.json` (BertForTokenClassification, 5 generic labels), `tokenizer.json` (WordPiece 30,522), `model.safetensors` (~435MB), `training_args.bin`, `tokenizer_config.json`. No metrics.json. VERIFIED FROM CODE.

## 16. Configuration files
`src/cfa/core/config.py` (DATA_DIR, REVIEWS_PATH, SMTP names), `.env.example` (DATABASE_URL, HF_TOKEN, HF_MODEL, SMTP_*, MAIL_FROM — names only). VERIFIED FROM CODE.

## 17. Environment variables (names used by code)
`JWT_SECRET`, `DATABASE_URL`, `DATA_DIR`, `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`. `HF_TOKEN`, `HF_MODEL`, `MODELS_DIR` appear in docs/render.yaml but are NEVER read by `src/` code. VERIFIED FROM CODE.

## 18. Build/deployment files
`Dockerfile`, `render.yaml`, `frontend/vercel.json`, `requirements.txt`, `pyproject.toml`, `.dockerignore`, `.github/` workflows. VERIFIED FROM CODE.

## 19. Scripts/notebooks for training
`notebooks/Final_Perfect_Model.ipynb` (main) + `notebooks/Final_Journal.ipynb` (journal version). Both unexecuted (no outputs saved). VERIFIED FROM CODE.

## 20. Unused/dead code
- `src/cfa/reporting/` — broken import, no `store.py`. VERIFIED FROM CODE.
- `EmailReportRequest` schema — defined, never used. VERIFIED FROM CODE.
- `readUploadFileSafely()` — defined, never called. VERIFIED FROM CODE.
- `get_remaining()` rate-limit helper — never called. VERIFIED FROM CODE.
- SMTP config — defined, never consumed. VERIFIED FROM CODE.
- `getStats`, `sendReportEmail`, `setApiBase` in frontend `api.js` — defined, never called. VERIFIED FROM CODE.
- `test_mams_absa.py`, `test_mams_serve.py` — zero test functions, print-only. VERIFIED FROM CODE.
- Unused `import re` in `bert_aste.py` and `extract.py`. VERIFIED FROM CODE.
