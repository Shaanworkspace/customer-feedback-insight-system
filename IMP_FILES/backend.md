# Backend.md — Complete FastAPI Backend Knowledge | Sequential Long Form | 8th Grade English | Best Examples | No Push

> **How to read:** Start at Heading 1, go down to 12. Every heading has `Why`, `Why Not Others`, `Example`, `What We Did vs What FastAPI Did`. Same pattern as `model.md` + `frontend.md`.

---

## 1. What Is Our Backend? (One Line)

Our backend is **`FastAPI (FastAPI - Python Web Framework) + Uvicorn (Uvicorn - ASGI Server) + Python (Python - Programming Language) 3.11 + SQLAlchemy (SQLAlchemy - ORM) + MySQL (My Structured Query Language) (Aiven) / SQLite (SQLite - File DB) + JWT (JSON Web Token) + BERT (Bidirectional Encoder Representations from Transformers)`** — runs on `EC2 (Elastic Compute Cloud) t3.small` `0.0.0.0:8000`, entry `cfa.api.main:app` (`src/cfa/api/main.py:14`).

- **Job:** Take `CSV` or `one review` + `JWT` token → run BERT → return `ranked_concerns` + `proof quotes` → save to `MySQL`.
- **Host:** `http://3.109.121.85:8000` (EC2), `http://localhost:8000` local, `https://cfa-api.onrender.com` old EC2 (now deleted).

---

## 2. Why FastAPI? Why Not Flask, Django, Express?

### Why FastAPI?

- **Auto docs:** `http://localhost:8000/docs` Swagger UI auto from `Pydantic (Pydantic - Data Validation)` `AnalyzeRequest` — no manual `swagger.json`.
- **Speed:** `FastAPI` + `Uvicorn` `ASGI (Asynchronous Server Gateway Interface)` handles `async` `upload_csv_file` (file read non-blocking) — `Flask` `WSGI` blocks.
- **Simple:** `APIRouter` `post("/api/v1/upload")` 5 lines, `Depends(get_current_user)` for `JWT` in 1 line.

### Why Not Flask?

Flask needs `flask-jwt-extended` + manual `request.get_json()` + no auto `docs`. FastAPI does `pydantic` validation auto `if not review_text: raise 400`.

### Why Not Django?

Django is **full** (`Admin`, `ORM`, `Templates`) — overkill for 5 endpoints (`/health`, `/ping`, `/auth/*`, `/upload`, `/analyze`). FastAPI is **micro** — 82 lines `main.py`.

### Why Not Express (Node)?

Our ML is `Python` `torch` + `transformers` — `Express` is `Node.js` (JavaScript), would need `child_process` to call Python BERT → slow. FastAPI is Python, so `from cfa.ml.bert_aste import predict_review` direct import, no bridge.

**Example where FastAPI wins:**
```python
# FastAPI: 3 lines
@router.post("/api/v1/analyze")
def analyze_single_review(request: AnalyzeRequest, currentUser=Depends(get_current_user)):
    return analyze_review(request.review_text)

# Flask: 10 lines manual
@app.route("/api/v1/analyze", methods=["POST"])
def analyze():
    token = request.headers.get("Authorization")  # manual
    data = request.get_json()
    if not data.get("review_text"): return {"detail":"..."}, 400
```

---

## 3. Why Uvicorn? Why Not Gunicorn Alone?

`Uvicorn` is `ASGI` server for `async` `FastAPI`. `Gunicorn` is `WSGI` (sync). We run `uvicorn cfa.api.main:app --host 0.0.0.0 --port 8000` (see `Dockerfile:40`). For `t3.small` 2GB, `Uvicorn` single worker is enough (10-day demo). Production would use `Gunicorn` + `Uvicorn workers` (`gunicorn -k uvicorn.workers`).

---

## 4. Why MySQL (Aiven) + SQLite Fallback? Why Not Only SQLite or Only MySQL?

### Why Both?

- **MySQL (Aiven) `mysql+pymysql://...aivencloud.com:14273/cfa`:** **Persistent** — `EC2` `docker rm` does not delete `users`/`analyses` (external). Hard-coded in `deploy.yml:151` so every deploy keeps `Your analyses` 3.
- **SQLite `sqlite:///data/app.db`:** **Fallback** when `DATABASE_URL` not set (local `pytest`, `CI` without secret). `src/cfa/db/core.py:16` `DEFAULT_SQLITE` + `os.makedirs("data")`.

### Why Not Only SQLite?

`SQLite` file `data/app.db` lives **inside container** `/app/data/app.db` — `docker rm` deletes it (ephemeral) → every deploy `reviews_analyzed 0` + need new ID (you saw). MySQL is **outside** container, survives.

### Why Not Only MySQL?

Local `pytest` + `CI` without `DATABASE_URL` would fail `pymysql` connect. Fallback `SQLite` lets `pytest -q` run without `Aiven` (see `tests/conftest.py` `DATABASE_URL=sqlite:///data/test.db`).

**Example:**
- Local `DATABASE_URL` set → `engine` `mysql` with `ssl verify False` → `users` table persists.
- CI `DATABASE_URL=""` → `engine` `sqlite` → `data/test.db` created for test, deleted after.

---

## 5. Why JWT (JSON Web Token) + `pbkdf2`? Why Not Sessions or Plain Password?

### Why JWT?

- **Stateless:** `create_token(username)` → `header.payload.signature` (`HS256` `hmac` + `SECRET` `JWT_SECRET` env) — no server session table. `decode_token()` checks `hmac` + `exp` 1h.
- **Why not Sessions?** Sessions need `Redis`/`DB` table for `session_id` → extra infra for 10-day demo. `JWT` is 1 string in `localStorage cfa_token`.

### Why `pbkdf2` Not Plain?

`hash_password()` `salt 16 bytes` + `pbkdf2_hmac sha256 100k` → `salt.hex` + `digest.hex` stored. `verify_password()` uses `hmac.compare_digest`. Plain `password` in DB → if DB leaked, all passwords leak. `pbkdf2` is one-way.

**Example:**
```python
# signup: add_user("a@a.com","secret123") → salt `a1b2...`, hash `c3d4...` → save
# login: authenticate("a@a.com","secret123") → pbkdf2 with saved salt → compare → True → create_token("a@a.com") → `eyJhbGci...`
```

---

## 6. What Are The Main Backend Files? What Does Each Do? (Sequence)

### 6.1 `src/cfa/api/main.py` (82 lines) — App Entry `cfa.api.main:app`

**Why this file?** `FastAPI` app, `CORSMiddleware` (`Vercel` `https://customer-feedback-insight-system.vercel.app` + `*.vercel.app`), `RateLimiter` `30 req/IP/60s` + `200 global`, `is_health_check` skip for `/health`, `unhandled_exception_handler` `500`.

**What we did:** `app = FastAPI(title="...")`, `app.add_middleware(CORSMiddleware, allow_origins=[...])`, `app.include_router(auth)`, `analyze`, `data`.

### 6.2 `src/cfa/api/routers/auth.py` + `api/auth.py` — Signup/Login

`AuthRequest` `username, password, first_name, email` → `add_user()` → `create_token()` → `{"token": "eyJ..."}`. `login` → `authenticate()` → `token`.

### 6.3 `src/cfa/api/routers/analyze.py` (105 lines) — Two Endpoints

- `POST /api/v1/analyze` → `AnalyzeRequest` `review_text` → `analyze_review(text)` → `ranked_concerns` → `similar_reviews = []` → `metrics`.
- `POST /api/v1/upload` → `UploadFile file` → `readUploadFileSafely` → `decodeCsvBytesToText` → `processCsvBytesToStats` → `save_analysis(user_id, filename, stats)` → return `dashboardStats`.

**What we did:** Split `read/decode/process/save` into 4 `try` each with `400`/`500` + clear message (not one big `try`).

### 6.4 `src/cfa/api/pipeline.py` (153 lines) — CSV → Dashboard

`process_csv(bytes)` → `preprocess_csv` (find column) → `analyze_reviews(texts)` → `buildReviewsForStorage` + `ConcernAggregator` → `rank_concerns` → `proof_by_concern` 3 + `comments_by_concern` 5 → `ratings` `countries` `time_trend` → return.

### 6.5 `src/cfa/analysis/*` — Core Logic

- `preprocessing.py:15` `find_text_column()` substring (`review_text` in `Review Text`) — **no hard-code**.
- `extract.py:14` `_bert_aspects()` → `cfa.ml.bert_aste.predict_review` first, then LLM, then `[]` — **no lexicon**.
- `sentiment.py:12` `get_overall()` `Pos+Neg→Mixed` counting — **no second classifier**.
- `concerns.py:12` `analyze_review()` glue.
- `ranking/priority.py:7` `rank_concerns` `impact = count × negative%`.

### 6.6 `src/cfa/db/*` — DB

`core.py:16` `DEFAULT_SQLITE` + `ssl` for `mysql`, `SessionLocal`, `init_db()` creates `users` + `analyses` + `ALTER TABLE` for `first_name/email`.

---

## 7. Why Not Use `Flask-SQLAlchemy`, Raw SQL, or Other ORMs?

| Option | Why Not |
|--------|---------|
| `Flask-SQLAlchemy` | Tied to `Flask`, we use `FastAPI` → `SQLAlchemy` standalone is correct. |
| Raw `pymysql` `cursor.execute("SELECT...")` | Need manual `commit`, `close`, SQL injection risk `f"SELECT {user_input}"`. `SQLAlchemy` `scoped_session` + `Base.metadata.create_all` auto handles. |
| `Pydantic` vs no validation | Without `Pydantic` `AnalyzeRequest`, `request.review_text` could be `None` → `500`. With `Pydantic` → auto `400` if missing. |

---

## 8. Where Is Backend Lagging Now? How To Fix?

| Lag | Why | Fix Approach |
|-----|-----|--------------|
| **`Neutral 21/36` too much** | `bert_aste` misses `ASPECT` → `[]` → `Neutral` (see `model.md:9.1`) | See `model.md` — retrain 3 epochs, `class_weight`, `nearest opinion` fix |
| **`DATABASE_URL` hard-coded in `deploy.yml:151`** | Public in git history (you asked hardcode) → security risk | After demo, `git history` clean + `Aiven` rotate password + move back to `secrets.DATABASE_URL` |
| **`t3.small` 2GB slow for 55 rows** | `BERT` `150ms × 55 = 8 sec` + `health` 15 sec `sleep` | Keep `t3.small` or use `distilbert` 250M (1GB) for `t3.micro` |
| **No `HTTPS` on EC2** | `http://3.109.121.85:8000` → `Vercel https → http` needs `vercel.json` proxy (we did) | Future: `ALB + ACM` + `Route53` `https://api.yourdomain.com` → remove proxy |

---

## 9. Future Scopes For Backend

- **Split `Dashboard.jsx` 900 lines** → `PriorityConcerns.jsx`, `ReviewExplorer.jsx` + `lazy` load `Recharts` (664K → 300K).
- **Add `Redis` for `RateLimiter`** (now in-memory `RateLimiter` resets on restart) + `JWT` refresh token.
- **Add `HTTPS` `ALB` + `CloudFront` + `WAF` for `EC2`.
- **Add `Alembic` for DB migrations** (now `inspect` + `ALTER TABLE` manual).

---

## 10. How To Present Backend In Interview (What FastAPI Is Not Doing)

> "FastAPI does **not** find aspects — it **calls** `predict_review()` and **saves** to `MySQL`. **We did:** `FastAPI` routing + `CORS` + `RateLimiter` + `JWT` + `pipeline` + `Docker` `PYTHONPATH=/app/src` `ECR` `SSM` mount. **FastAPI did:** `auto docs` + `pydantic` validation + `Depends(get_current_user)`."

**One-line for PPT:** `FastAPI 0.110 + Uvicorn 0.0.0.0:8000 + SQLAlchemy + MySQL Aiven (hard-coded persist) + JWT pbkdf2 + BERT mount`.

---

*This `backend.md` is long form, headings not tables, short first then full (FastAPI (FastAPI...), JWT (JSON...), MySQL (My Structured...), EC2 (Elastic...), etc.), sequential, with best examples, no push.*
