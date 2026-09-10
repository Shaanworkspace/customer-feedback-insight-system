# Project Structure — Complete | Every Folder, Every File, Every Function | Customer Sentiment Analysis

> **Aim:** Open this file and you know where everything is. No guessing. Every folder → what it holds, every file → what it does, every Python file → what functions/classes inside. `Cognizant/` is the repo root (`customer-feedback-insight-system.git`).

---

## 1. Top-Level Tree (What You See First)

```
Cognizant/  (repo root, 42 files/folders, ~1.4K lines Python)
├── .github/workflows/           # CI/CD — GitHub Actions
├── src/cfa/                     # Backend + ML — FastAPI + BERT (1,421 lines Python)
├── frontend/                    # React — Vercel (Vite + Tailwind + Recharts)
├── notebooks/                   # Jupyter — Training (60 cells)
├── bert_aste_final/             # Trained BERT 415M (gitignored, S3 → EC2 /opt/.../model)
├── testing_csvs/                # Test data — any CSV (48/52/55 + 100+)
├── IMP_FILES/                   # Docs — Your reading files (model.md, cloud.md, etc.)
├── data/                        # SQLite fallback (app.db, test.db — gitignored)
├── output/                      # Previous run JSONs (not needed for deploy)
├── .dockerignore / Dockerfile   # Docker — CPU-only, no model in image
├── requirements.txt / pyproject.toml  # Deps — torch CPU, transformers, fastapi
├── README.md                    # Main project doc (36K)
├── render.yaml / vercel.json    # Old Render (now EC2) + Vercel proxy
└── *.csv (final.csv etc.)       # Demo CSVs at root for quick upload
```

**Why this layout?** `src/` holds code, `frontend/` holds UI, `notebooks/` holds training, `bert_aste_final/` holds model (outside git), `IMP_FILES/` holds reading docs — clean separation, no `src` inside `frontend`.

---

## 2. `.github/workflows/` — CI/CD (What Runs On Push)

| File | Lines | What It Does | When It Runs |
|------|-------|--------------|--------------|
| `deploy.yml` (184 lines) | **Main deploy:** `push main` on `src/**`, `requirements.txt`, `pyproject.toml`, `Dockerfile`, `.dockerignore` → `test-backend` (CPU torch `whl/cpu` + `pip cache`, `pytest`) → `build-and-push` (`linux/amd64`, `cache gha`, `ECR customer-sentiment-analysis ap-south-1`) → `deploy` (`SSM` to `i-010a45ed37176947b` `t3.small`, mount `-v /opt/.../model:/app/bert_aste_final:ro`, `curl -f http://localhost:8000/health`) | Only backend/model change, not frontend |
| `ci.yml` (34 lines) | **CI only:** `push/PR` on `src/**`, `requirements.txt`, `pyproject.toml` → `test-backend` + `build-frontend` (`npm ci`, `npm run build`) | Not on `frontend/**` alone (Vercel handles) |

**Functions inside?** No Python, just YAML jobs `test-backend`, `build-and-push`, `deploy`.

---

## 3. `src/cfa/` — Backend + ML (1,421 lines, 24 Python files)

### 3.1 `src/cfa/__init__.py` (0 lines)

- Empty — marks `src` as package.

### 3.2 `src/cfa/api/` — FastAPI (HTTP API)

| File | Lines | Functions / Classes | What It Does |
|------|-------|---------------------|--------------|
| `api/main.py` (82) | `is_health_check(path)`, `health()`, `ping()` + `app = FastAPI` + `limiter = RateLimiter(30/60, 200)`, `CORSMiddleware` | Entry `cfa.api.main:app` — `0.0.0.0:8000`, CORS `vercel.app`, rate limit, `500` handler |
| `api/auth.py` (80) | `hash_password()`, `verify_password()`, `add_user()`, `authenticate()`, `create_token()`, `decode_token()` | `pbkdf2` + `HS256` `JWT` 1h, `SECRET = JWT_SECRET` env |
| `api/deps.py` (18) | `get_current_user(authorization)` + `metrics` dict | Reads `Authorization: Bearer <JWT>`, calls `decode_token`, returns user or `401` |
| `api/schemas.py` (18) | `AnalyzeRequest`, `AuthRequest`, `EmailReportRequest` (`BaseModel`) | `pydantic` validation for `POST /analyze` `review_text` |
| `api/ratelimit.py` (67) | `class RateLimiter` `is_allowed(ip)`, `_clean_old_requests()` | In-memory 30/IP + 200 global per 60s, `429 Retry-After 60` |
| `api/pipeline.py` (153) | `extractMonthTrend()`, `buildSentimentDistribution()`, `buildReviewsForStorage()`, `buildProofByConcern()`, `buildCommentsByConcern()`, `process_csv(bytes)` | `CSV bytes → preprocess → analyze_reviews → rank → save` → `dashboardStats` |
| `api/routers/analyze.py` (105) | `buildRankedConcernsForSingleReview()`, `analyze_single_review()`, `readUploadFileSafely()`, `decodeCsvBytesToText()`, `processCsvBytesToStats()`, `upload_csv_file()` | `POST /api/v1/analyze` (1 review) + `POST /api/v1/upload` (CSV `file` multipart) |
| `api/routers/auth.py` (44) | `signup()`, `login()`, `me()` | `POST /auth/signup`, `/auth/login`, `GET /auth/me` |
| `api/routers/data.py` (43) | `stats()`, `reviews()`, `history()`, `history_report()`, `concern_comments()`, `delete_history()` | `GET /stats`, `/reviews`, `/history`, `/history/{id}`, `/concern-comments`, `DELETE /history/{id}` |

### 3.3 `src/cfa/analysis/` — Core Logic (CSV → Sentiment)

| File | Lines | Functions | What It Does |
|------|-------|-----------|--------------|
| `analysis/preprocessing.py` (96) | `detect_columns()`, `_norm()`, `_first()`, `clean_text()`, `parse_rating()`, `preprocess_csv()` | Finds `review_text` via substring `review_text`, `Review Text`, `comment` — any name, keeps `rating/date/country` in `attributes` |
| `analysis/extract.py` (55) | `_bert_aspects(text)`, `extract_aspects(texts)` | **BERT first** `cfa.ml.bert_aste.predict_review`, then LLM, then `[]` — **no lexicon** |
| `analysis/sentiment.py` (21) | `class SentimentClassifier` | Deterministic `get_overall()` `Pos+Neg→Mixed` counting, no second ML |
| `analysis/concerns.py` (42) | `analyze_review()`, `analyze_reviews()`, `_aspects_view()` | Glue: `extract_aspects` + `SentimentClassifier` → `concerns` + `aspects` |
| `analysis/aggregation.py` (29) | `class ConcernAggregator` `add()`, `stats()`, `proof()` | Counts `battery 6` + collects 5 texts per concern |
| `analysis/rag.py` (41) | `find_similar()`, `_overlap()`, `_load_reviews()` | Simple `overlap` 0-1, no vector DB, returns 5 similar |
| `analysis/stats.py` (80) | `_countries()`, `_time_trend()`, `_ratings()`, `get_stats()`, `get_reviews()` | For dashboard charts: `ratings`, `countries`, `time_trend YYYY-MM` |

### 3.4 `src/cfa/ml/` — ML Model

| File | Lines | Functions | What It Does |
|------|-------|-----------|--------------|
| `ml/bert_aste.py` (174) | `get_device()`, `load_tokenizer()`, `load_model()`, `is_trained()`, `clean_token()`, `find_span()`, `decode_predictions()`, `build_triplets()`, `get_overall()`, `predict_review()`, `extract_aspects_batch()` | **Perfect model** — `bert-base-uncased` 5 labels, `PROJECT_ROOT / "bert_aste_final"` → `/app/bert_aste_final` in container, `is_trained()` checks `config.json`, fallback `Neutral []` if no model |

### 3.5 `src/cfa/core/` — Config

| File | Lines | What It Does |
|------|-------|--------------|
| `core/config.py` (23) | `PROJECT_ROOT`, `DATA_DIR`, `BERT_ASTE_DIR = PROJECT_ROOT / "bert_aste_final"`, `SMTP_*`, `REVIEWS_PATH` | Central `Path` + env `DATA_DIR`, `BERT_ASTE_DIR` |

### 3.6 `src/cfa/db/` — Database

| File | Lines | Functions | What It Does |
|------|-------|-----------|--------------|
| `db/core.py` (77) | `_load_dotenv()`, `_build_url()`, `init_db()` | `DATABASE_URL` `mysql+pymysql://...aiven` → `engine` with `ssl`, else `sqlite:///data/app.db`, `create_all` + `ALTER TABLE` for `first_name/email` |
| `db/models.py` (28) | `class User`, `class Analysis` (`Base`) | `users(id, username, salt, hash, first_name, email)`, `analyses(id, user_id, filename, data JSON)` |
| `db/repo.py` (108) | `create_user()`, `get_user_by_username()`, `save_analysis()`, `get_latest_analysis()`, `list_history()`, `get_analysis_by_id()`, `delete_analysis()` | `SessionLocal` CRUD, `HISTORY_KEEP=3` per user |

### 3.7 `src/cfa/ranking/` — Ranking

| File | Lines | Functions | What It Does |
|------|-------|-----------|--------------|
| `ranking/priority.py` (28) | `rank_concerns(concern_stats)` | `impact = count * negative_pct` → sorted `priority 1..n` |

---

## 4. `frontend/` — React (Vercel)

| Folder/File | Lines | What It Does |
|-------------|-------|--------------|
| `frontend/package.json` | 552 | `react 19`, `vite`, `tailwind`, `recharts` |
| `frontend/vite.config.js` | 220 | `plugins: [react(), tailwindcss()]` |
| `frontend/src/main.jsx` | — | `ReactDOM.createRoot` |
| `frontend/src/App.jsx` (119) | `navigate()`, `handleLogin()`, `handleLogout()`, `handleUploadStart()` | Router via `?view=` query, `signedIn` + `view` state, `SiteHeader` + `Landing/Login/Upload/Dashboard` |
| `frontend/src/api.js` (322) | `logStep()`, `buildAuthHeader()`, `uploadReviews()`, `analyzeReview()`, `getHistory()` etc. | `API_BASE = VITE_API_BASE \|\| (localhost ? LOCAL_API : '')` + `''` means same-origin `/api` via `vercel.json` proxy to `http://3.109.121.85:8000` (avoids mixed-content) + `[CFA]` logs |
| `frontend/vercel.json` (12) | `rewrites /api/:path* → http://3.109.121.85:8000/api/:path*` | Proxy `https Vercel` → `http EC2` |
| `frontend/src/components/Dashboard.jsx` (900+) | `handleDashboardFile()`, `handleDashboardUpload()`, `openComments()` | Main dashboard: `Top 5 + See more`, `Review Explorer 10 + See more 55`, `Pie/Bar`, `×` delete |
| `frontend/src/components/upload/Upload.jsx` (258) | `validateCsvFile()`, `handleFileSelection()`, `uploadToBackend()` | Drag-drop `div` (not `button`), `POST /upload` |
| `frontend/src/components/Analyzer.jsx`, `Explorer.jsx`, `Profile.jsx` | — | One review, table, profile |
| `frontend/src/components/layout/` | `SiteHeader.jsx`, `AppHeader.jsx`, `SiteFooter.jsx` | Header `80%` `padding 0 10%`, logo |
| `frontend/dist/` | — | Built `index-*.js` `664K` (after `npm run build`) |

---

## 5. `notebooks/` — Training

| File | Cells | What It Does |
|------|-------|--------------|
| `Final_Perfect_Model.ipynb` (60 cells) | **Setup** 2 cells → **EDA** 8 cells (`DMASTE 7,524 → 28,233 → 16,288`, `POS 79%`) → **Cleaning** 2 cells → **Split** 3 cells (review-level 4055/1014/1268, leakage 0) → **Tokens** 6 cells (5 labels, `find_span`, `max_length 128`) → **Dataset** 3 cells → **Model** 2 cells (`bert-base-uncased` 5) → **Training** 4 cells (`eval_strategy="epoch"` fixed) → **Scores** 4 cells (`F1 weighted 0.875`, `gap`) → **Use** 5 cells (`predict_review`) → **Any CSV** 2 cells (`find_text_column`) | Trains `bert_aste_final/` 415M on Colab T4 |
| `Final_Journal.ipynb` (69 cells) | Same + humanized comments | Journal version |

---

## 6. `bert_aste_final/` — Trained Model (gitignored, S3 → EC2 `/opt/.../model`)

| File | Size | What It Is |
|------|------|------------|
| `config.json` | 994B | `5 labels`, `bert-base-uncased` |
| `model.safetensors` | 415M | Weights 110M params |
| `tokenizer.json` | 695K | Vocab 30k |
| `tokenizer_config.json` | 351B | `bert-base-uncased` |
| `training_args.bin` | 5.1K | `lr 2e-5`, `epochs 2` |

Loaded via `src/cfa/ml/bert_aste.py:19` `PROJECT_ROOT / "bert_aste_final"` → `/app/bert_aste_final` in container (mount `-v /opt/.../model:/app/bert_aste_final:ro`).

---

## 7. `testing_csvs/` + `IMP_FILES/sample_csvs/` + Root CSVs — Test Data

| File | Rows | Columns | Why |
|------|------|---------|-----|
| `testing_csvs/testing_1col_coffee_maker_105.csv` | 105 | `review_text` | 1-col `coffee maker` `brew/carafe` |
| `testing_csvs/testing_2col_running_shoes_102.csv` | 102 | `review_text, rating` | 2-col `shoes` `sole/cushion` |
| `testing_csvs/testing_3col_gaming_headset_108.csv` | 108 | `review_text, rating, date` | 3-col `headset` `microphone/battery` + `date` for Trend |
| `testing_csvs/bluetooth_speaker_reviews.csv` | 48 | `review_text, rating, date, country` | All 4 optional cols |
| `testing_csvs/office_chair_reviews.csv` | 52 | `review_text, rating, country` (no date) | Tests missing `date` → Trend empty |
| `testing_csvs/smartwatch_reviews.csv` | 55 | `review_text, rating, date, country, product` | Extra `product` in `attributes` |
| `final.csv` / `final_interview.csv` | 36 | `review_text, rating, date, country, product` | Interview showcase `battery 6` |
| `IMP_FILES/sample_csvs/1_soundbuds_pro_battery.csv` etc. | 6 files | Various | Sample per concern |

---

## 8. `IMP_FILES/` — Reading Docs (Your Important Files)

| File | Lines | What It Holds |
|------|-------|---------------|
| `model.md` (519) | BERT 110M 5 labels, DMASTE 16,288, fine-tune 2 epochs, `AutoModelForTokenClassification` deep dive, `F1` vs `accuracy`, lag `Neutral 58%` + fix |
| `frontend.md` (185) | React 19 + Vite + Tailwind + Recharts, why not Vue/Angular, `vercel.json` proxy `/api`, `App.jsx` router `?view=` |
| `backend.md` (174) | FastAPI + Uvicorn + MySQL Aiven hard-coded `deploy.yml:151`, JWT `pbkdf2`, `cfa.api.main:app`, `RateLimiter` |
| `cloud.md` (201) | `Vercel` → `EC2 t3.small` → `Docker` → `ECR` → `S3` 416M → `SSM`, why not `t3.micro`/`Lambda`/`SageMaker` |
| `ipynb.md` (602) | 60 cells theory+code+table `Before→After` per step |
| `pipeline.md` (11K) | 11-step best user flow table + Mermaid `graph TD` (error-free) + mandatory/optional/hard-coded |
| `user_flow.md` (8.8K) | Best user flow `Landing → Login → Upload → Dashboard` with `Drop CSV here` div |
| `ppt_8_slides.md` (12K) | `KIET Approach.pptx` 14 slides → 8 slides priority for marking |
| `project_structure.md` (this file) | Every folder/file/function |

**All MDs are 8th grade English, short first then full (`BERT (Bidirectional...)`, `POS (Positive)`). No push without ask.**

---

## 9. `Docker` + `AWS` — Deployment

| File | What It Does |
|------|--------------|
| `Dockerfile` (40) | `FROM python:3.11-slim`, `WORKDIR /app`, `ENV PYTHONPATH=/app/src`, `COPY requirements.txt` → `pip install --index-url https://download.pytorch.org/whl/cpu torch` + `grep -v torch`, `COPY src`, `COPY .env.example`, `EXPOSE 8000`, `HEALTHCHECK curl /health`, `CMD uvicorn cfa.api.main:app --host 0.0.0.0 --port 8000` — **no model, no `.env`, CPU-only** |
| `.dockerignore` (33) | `bert_aste_final/`, `.git`, `.venv`, `node_modules`, `data`, `*.log` — keeps image 400M not 800M |
| `render.yaml` | Old `Render` (now `EC2`), kept for reference |
| `.github/workflows/deploy.yml` (184) | `test-backend` (CPU torch + `cache: pip`), `build-and-push` (`linux/amd64`, `cache gha`, `ECR`), `deploy` (`SSM` `i-010a45ed37176947b`, mount, `curl -f localhost:8000/health`) |
| `frontend/vercel.json` (12) | `rewrites /api → http://3.109.121.85:8000` (avoids mixed-content) |

---

## 10. Root Config Files

| File | What It Does |
|------|--------------|
| `requirements.txt` (18) | `fastapi`, `uvicorn`, `torch>=2.0` (CPU via Dockerfile), `transformers>=4.40`, `sqlalchemy`, `pymysql`, `pytest` etc. |
| `pyproject.toml` (39) | `[project] name cfa`, `dependencies` same as `requirements`, `[tool.setuptools.packages.find] where = ["src"]`, `pytest` path `tests` |
| `.env` (gitignored, 242B) | `DATABASE_URL=mysql+pymysql://...aiven...`, `JWT_SECRET` |
| `.env.example` (579B) | Template `DATABASE_URL=...`, `HF_TOKEN` |
| `.gitignore` (53) | `bert_aste_final/`, `.env`, `data/`, `node_modules`, `*.log` |
| `README.md` (36K) | Main project doc (now EC2 `3.109.121.85:8000`, not Render) |

---

## 11. `tests/` — Tests (For `pytest -q`)

| File | What It Tests |
|------|---------------|
| `conftest.py` | Sets `DATABASE_URL=sqlite:///data/test.db`, creates `Base.metadata` |
| `test_api.py` | `test_health`, `test_auth_required`, `test_signup_login_flow`, `test_analyze_shape`, `test_stats_shape` |
| `test_ranking.py` | `rank_concerns` `impact = count × negative%` |
| `test_mams_absa.py` / `test_mams_serve.py` | `pytest.skip` if `models/mams_absa` not found (legacy) |

---

## 12. One-Line Summary

> **`Vercel React` → `vercel.json` proxy `/api` → `EC2 t3.small` `cfa.api.main:app` → `preprocessing` → `BERT 5 labels` → `Mixed` → `rank` → `MySQL Aiven` → `Dashboard Top 5/55`.**

---

*This `project_structure.md` is the complete map — every folder, every file, every function. Use it to answer "Where is X?" in interview. No push, local only.*
