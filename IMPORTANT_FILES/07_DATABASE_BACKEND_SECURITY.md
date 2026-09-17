# Parts 13-15 — Database + FastAPI + JWT (Q189-241)

## 189. Which database, why
MySQL (Aiven) via pymysql when DATABASE_URL set, else SQLite `data/app.db`. Why: DOC CLAIM (persist history), code only implements fallback. DESIGN RATIONALE NOT DOCUMENTED in code. VERIFIED FROM CODE (`db/core.py:37-53`).

## 190. ORM / driver / connection
SQLAlchemy 2.0 + pymysql, `create_engine(URL, pool_pre_ping True, future True)`, `scoped_session(sessionmaker)`, `Base.metadata.create_all` on startup + idempotent ALTER for first_name/email. VERIFIED FROM CODE (`db/core.py:55-76`, `api/main.py:12`).

## 191. Tables (ACTUAL ER)
users(id PK auto, username String64 unique not-null indexed, salt String64 not-null, hash String128 not-null, first_name String64 nullable, email String255 nullable, created_at DateTime default utcnow)
analyses(id PK auto, user_id FK users.id not-null indexed, filename String255 nullable, created_at DateTime, data JSON not-null)
No relationships, no other tables, no migrations. VERIFIED FROM CODE (`db/models.py:11-28`).

## 192. What is stored where
Reviews/predictions/aspects/sentiments/evidence all inside `analyses.data` JSON (not separate tables). Users/auth in `users`. VERIFIED FROM CODE (`repo.py:35-54`, `pipeline.py:142-152`).

## 193. CRUD
create_user, get_user_by_username, save_analysis (insert + prune to keep 3, delete older), get_latest, list_history (max 3, top_concerns[:3]), get_by_id, delete. No updates. Transactions via commit per function. Errors: IntegrityError->None, save failure printed not raised. VERIFIED FROM CODE (`repo.py:1-108`, `routers/analyze.py:103`).

## 194. Every endpoint (13)
GET /health (no auth, metrics), GET /api/v1/ping, POST /api/v1/auth/signup (AuthRequest, creates user + token), POST /api/v1/auth/login (username+password -> token), GET /api/v1/auth/me (Bearer), POST /api/v1/analyze (AnalyzeRequest review_text, 400 if empty, no DB save), POST /api/v1/upload (multipart file CSV, validations extension/empty/UTF-8, saves to analyses), GET /api/v1/stats, GET /api/v1/reviews, GET /api/v1/history (max3), GET /api/v1/history/{id} (404 if missing), GET /api/v1/concern-comments?concern=, DELETE /api/v1/history/{id}. No response_model anywhere. VERIFIED FROM CODE (main.py:69-77, routers/auth.py:11,25,37, routers/analyze.py:31,78, routers/data.py:10,15,20,25,33,38).

## 195. FastAPI features actually used
Pydantic BaseModel (2 schemas + 1 unused), Depends for auth, UploadFile/File, Header, HTTPException, CORSMiddleware, http middleware (rate limit), exception_handler for 500, OpenAPI/Swagger auto (no custom), Uvicorn serve. NOT USED: BackgroundTasks, startup/shutdown events, GZip/TrustedHost, custom validators, multiple workers/Gunicorn, model load once? Yes model cached in globals `_model/_tokenizer` loaded on first predict (lazy, once per process). VERIFIED FROM CODE.

## 196. CORS / rate limit / logging
CORS origins localhost:5173/4173 + vercel.app + regex *.vercel.app, credentials True. RateLimiter 30/60s per-IP + global 200, 429 + Retry-After 60, health exempt. Logging NOT IMPLEMENTED (only one print). VERIFIED FROM CODE (`main.py:17-66`, `ratelimit.py:21-66`).

## 197. JWT details
Hand-made, no PyJWT: pbkdf2_hmac sha256 100k + 16-byte salt, HS256 manual base64url + HMAC-SHA256, payload sub/iat/exp, expiry 3600s, header `Authorization: Bearer`. Signed not encrypted. No refresh, no roles, 401 on missing/invalid/expired/unknown user. Frontend stores in localStorage `cfa_token/cfa_user`, 401 clears + redirects to login. VERIFIED FROM CODE (`api/auth.py:12-80`, `api/deps.py:9-18`, `frontend/src/api.js:26-87`).

## 198. Security posture
Secrets via env (JWT_SECRET default dev-secret-change-me insecure fallback), DATABASE_URL hard-coded in deploy.yml:151 (flag), MySQL ssl verify_mode False (flag), SQL injection protected via ORM, input validation via strip + Pydantic + CSV checks, no stack trace to user (generic 500), SG/HTTPS NOT VERIFIED in code (docs claim). VERIFIED FROM CODE.
