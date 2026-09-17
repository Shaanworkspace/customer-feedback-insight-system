# Parts 16-18 — Frontend + Docker + AWS (Q242-284)

## 242. Frontend framework/version/why
React 19.2.8 + react-dom 19.2.8 + Vite 8.2 + Tailwind 4.1 + Recharts 3.10. Why: DESIGN RATIONALE NOT DOCUMENTED in code, only versions. No react-router, no axios, no redux. VERIFIED FROM CODE (`frontend/package.json:13-24`, `vite.config.js:1-7`).

## 243. Pages/components/routing
Custom `?view=` router in `App.jsx:20-41` (landing default, guards signedIn). Pages: Landing (Hero/WhyUs/Features/HowItWorks/Stats), Login (login/signup modes), Upload (CSV div + spinner + role=alert error), Dashboard (965 lines: Pie inner60 outer90, Bar count, Rating/Trend/Countries bars, Top5+See more, history, delete via alert on fail), Analyzer (textarea -> analyzeReview, meter CSS, no recharts), Explorer (table), Profile. VERIFIED FROM CODE.

## 244. API client/auth/charts/errors
Native fetch, `API_BASE = VITE_API_BASE || localhost:8000 || ''` (Vercel same-origin proxy), `buildAuthHeader Bearer`, 401 clears localStorage + redirects. Token in localStorage `cfa_token/cfa_user` (no cookie). Charts via Recharts Pie/Bar. Loading via Skeleton/pulse/spinner, errors via boxes, no global boundary/toast/retry. If API fails: `Backend is not reachable` messages. If model returns []: Neutral + empty concerns. VERIFIED FROM CODE (`frontend/src/api.js:1-321`, Dashboard/Analyzer/Explorer/Upload/Profile/Login lines in audit).

## 245. Docker
`FROM python:3.11-slim`, WORKDIR /app, ENV PYTHONPATH=/app/src PORT=8000, build-essential, CPU torch via whl/cpu then `grep -v torch` to avoid CUDA, `COPY src` only (model NOT in image), `COPY .env.example`, EXPOSE 8000, HEALTHCHECK localhost:8000/health via urllib, CMD uvicorn cfa.api.main:app 0.0.0.0:8000. Model mounted `-v /opt/.../model:/app/bert_aste_final:ro`. No compose, single container. Size NOT VERIFIED (no build log). VERIFIED FROM CODE (`Dockerfile:1-39`, `.dockerignore:31-33`).

## 246. AWS deployment (code-verified only)
Region `ap-south-1`, ECR `customer-sentiment-analysis` linux/amd64, EC2 `i-010a45ed37176947b` via SSM `AWS-RunShellScript` (no SSH), container `--restart unless-stopped -p 8000:8000 -v model:ro -e DATABASE_URL/JWT/HF_TOKEN`, checks `config.json + model.safetensors ~416MB` + `curl -f health` + ping. Frontend proxy `frontend/vercel.json` `/api->http://3.109.121.85:8000`. CI `ci.yml` (pytest + npm build), CD `deploy.yml` (test->push->SSM). Render.yaml legacy (plan free, pip install -e ., NOT live). S3 sync command NOT VERIFIED (only echo string s3://...), IAM policies NOT VERIFIED (only OIDC debug), CloudWatch NOT FOUND in code (only docs claim /customer-sentiment...), instance type t3.small NOT VERIFIED in IaC (only Dockerfile comment + docs), SG/VPC NOT VERIFIED. VERIFIED FROM CODE (deploy.yml:15-184, vercel.json:1-12, Dockerfile).
