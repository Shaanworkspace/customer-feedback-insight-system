# 5-10 Minute Spoken Presentation — Memorize This (Easy English)

## 1. What our project does (30 sec)
Our project is Customer Feedback Insight System for Use Case 7. Companies get thousands of reviews. We take a CSV, find what customers talk about, how they feel for each part, overall feeling, and what to fix first with proof quotes. Example: `The product is excellent but delivery was terrible` gives product Positive, delivery Negative, overall Mixed, delivery ranked first.

## 2. What was the problem (1 min)
Businesses cannot read thousands of reviews manually. One review has many feelings, so single Positive/Negative fails. Key concerns unknown: which aspect how often how negative. CSV names differ: Review Text, comment, feedback. Hard-coded list fails for new product like armrest. Manager sees Positive 80% but delivery 40% Negative hidden inside Mixed.

## 3. How we solved it — parts (3 min, say one by one and connect)
Part 1 Frontend: React 19 Vercel. User clicks Upload CSV. File goes via vercel.json proxy /api to EC2 http to avoid mixed-content block. Evidence `frontend/src/api.js:248`, `frontend/vercel.json:5`.
Part 2 Backend: FastAPI EC2 t3.small. POST /upload with JWT Bearer, CORS vercel.app, rate limit 30 per minute. Evidence `src/cfa/api/routers/analyze.py:78`, `main.py:17,55`.
Part 3 Preprocess: find_text_column accepts any name, clean_text normalizes whitespace, keep rating/date/country. Evidence `src/cfa/analysis/preprocessing.py:38-96`.
Part 4 Model: Two things merged. English BERT bert-base-uncased 110M 12 layers 768 hidden knows grammar, plus DMASTE 7524 human reviews flattened 28233 minus implicit -1 11945 gives 16288 explicit POS79% NEG17% NEU4%. Fine-tune 5-label head Linear 768->5 for 2 epochs batch16 lr2e-5 max128. Pattern learned: X is wobbly -> X is ASPECT. No list. Evidence `src/cfa/ml/bert_aste.py:20,52`, `cognizant1/data/dmaste_clean.csv`.
Part 5 Decide: decode per-token argmax -> triplets (first opinion flaw) -> Mixed if pos and neg -> rank impact count×negative% -> proof first 5 verbatim. Evidence `bert_aste.py:78-149`, `ranking/priority.py`, `analysis/sentiment.py:7-21`.
Part 6 Store and show: Save JSON to MySQL analyses table keep last 3, show Pie Bar Trend Top5 in Dashboard. Evidence `src/cfa/db/repo.py:35-54`, `frontend/src/components/Dashboard.jsx:678`.
Connect line to say: CSV -> Vercel proxy -> EC2 FastAPI -> preprocess -> BERT 128 -> triplets -> Mixed -> rank -> MySQL -> Dashboard. Model 60%, our logic 40%.

## 4. Honest limits + future (1 min)
Data biased POS79% so accuracy lies, we use weighted F1. Training scores example only, no metrics file. Confidence 0.85 hard-coded. First opinion for all aspects is wrong for Mixed. Retrieval is word overlap not RAG. t3.micro OOM so t3.small. Next: NEU 608->2k, nearest opinion, 3 epochs, HTTPS.

## 5. Close (30 sec)
Reuse same model for any product, no code change. Monitoring via healthcheck. Links: frontend vercel.app, backend 3.109.121.85:8000/health, datasets huggingface SilvioLima + kaggle Amazon demo, GitHub Shaanworkspace. Team 8: Shaan Lead Model+Deploy, Reekal Training, Shikhar Visual, Sharad Preprocess, Rohan/Sachchidanand FastAPI, Shivang/Ram Frontend. Thank you, ready for demo and questions.
