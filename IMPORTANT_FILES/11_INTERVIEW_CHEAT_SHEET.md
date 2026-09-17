# Part 27 — Interview Cheat Sheet (30s/60s/2min/5min + Top Qs)

## 30-second
I built Customer Feedback Insight System for Use Case 7. Upload CSV, BERT 5-label finds aspects and feelings, Mixed when positive and negative both present, ranked concerns with proof quotes. React frontend, FastAPI backend, MySQL last 3. Evidence `src/cfa/ml/bert_aste.py:152`, `api/routers/analyze.py:78`.

## 60-second
Frontend React 19 Vercel proxies to FastAPI EC2. Preprocess finds any review_text name, cleans text. `bert-base-uncased` 110M with 5 labels O/ASPECT/OPINION_POS/NEG/NEU max 128 predicts per token, decode to triplets, Mixed rule, rank count×negative%, save JSON to analyses table keep 3. JWT 1h PBKDF2. Docker python:3.11-slim CPU torch, ECR ap-south-1, SSM to EC2 mount model ro.

## 2-minute
Add dataset: SilvioLima DMASTE 16288 rows POS79% NEG17% NEU608 after dropping -1 11945, review split leakage 0 random42. Tokenizer bert-base-uncased truncation 128. Training hyperparams batch16 lr2e-5 epochs2 (run not verified, scores example only). Inference torch.no_grad argmax, confidence 0.85 hard-coded (limitation), first-opinion flaw. Retrieval is word overlap first-5 not RAG. DB users+analyses. 13 endpoints. Rate limit 30/60. Tests via pytest.

## 5-minute deep
Walk files: api.js -> POST /upload -> pipeline.py process_csv -> preprocessing.py -> extract.py predict_review -> bert_aste decode/build/get_overall -> sentiment.py classify -> priority rank -> repo save -> Dashboard Pie/Bar. Then challenges: bias, OOM t3.micro->small, mixed-content proxy, signup/login inconsistency. Then limits: Neutral 58% on final.csv, NEU 0.57, no vector search, no class weights. Then future: augment NEU, nearest opinion, 3 epochs, HTTPS.

## Top 20 rapid (Q + short A + evidence)
1 What type? ABSA token classification 5 labels. bert_aste.py:14.
2 Labels? O/ASPECT/POS/NEG/NEU 0-4. bert_aste.py:14-16.
3 Tokenizer? bert-base-uncased max128. bert_aste.py:20,160.
4 Mixed? pos&neg->Mixed. bert_aste.py:140-149.
5 Dataset size? 16288 POS79%. dmaste_clean.csv.
6 Split? review-level random42 leakage0. simple_model.py:58-64.
7 Loss? default CE, no weights. NOT FOUND.
8 Metric? weighted F1 (example 0.875 NOT VERIFIED). cell41.
9 TF-IDF? NOT IMPLEMENTED. extract.py:43.
10 RAG? No, word overlap. rag.py:21-26.
11 DB tables? users/analyses JSON keep3. models.py repo.py:15.
12 Auth? PBKDF2 100k HS256 1h Bearer localStorage. auth.py.
13 Endpoints? 13 listed. routers/*.
14 Frontend? React19 Vite Recharts fetch. package.json api.js.
15 Docker? 3.11-slim CPU mount ro 8000. Dockerfile.
16 AWS? ECR ap-south-1 SSM i-... S3 string only. deploy.yml.
17 Error if model missing? Silent Neutral []. bert_aste.py:152-170.
18 Confidence? 0.85 hard-coded. extract.py.
19 Biggest flaw? First opinion for all aspects. bert_aste.py:127-137.
20 Scaling? Single worker 30/min limit, no LB. ratelimit.py main.py.
