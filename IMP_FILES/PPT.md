> **Updated 2026-09-10 — Perfect BERT model (5 labels, no hard-coded list), flexible Any-CSV (ENGLISH_STOP_WORDS + dynamic 10%), online Aiven MySQL (no re-register), dashboard 80% + delete + timing + See more 5/10/55.**

# PPT.md — 8-Slide Presentation Plan (for KIET Hackathon Evaluators)

> **How to use this file:** Give this whole file to an AI slide generator (or use it to build the deck yourself). It contains, slide by slide:
> 1. **Title** of the slide
> 2. **What to show** (visuals / bullets)
> 3. **What to say** (a spoken script)
> 4. **Evaluator questions for this slide** + short answers
>
> After the 8 slides there is one big **"Comprehensive Evaluator Q&A"** section that answers EVERY common judge question, including the specific ones you asked (competitor, why this use case, architecture choices + what we rejected, model choice, data source, accuracy deep-dive, which regression/types, flow, Python version, etc.). Paste that section into the speaker notes.

---

## Slide 1 — Title + Use Case & Problem

**What to show**
- Project title: **Customer Feedback Insight System**
- Team name + KIET Hackathon Aug 2026
- Use Case badge: **#7 — Sentiment Analysis of Customer Reviews** (Amazon Reviews Dataset)
- One-line problem: *"Businesses get thousands of reviews but cannot read them all. We turn them into a ranked, proven fix-it list."*

**What to say**
> "We picked Use Case 7 from the KIET list: Sentiment Analysis of Customer Reviews. The problem is simple — companies drown in feedback and miss what customers actually hate. Our system reads the reviews, classifies sentiment, finds key concerns, and shows real customer quotes as proof."

**Evaluator questions**
- *"Kaun sa use case choose kiya aur kyon?"* → Use Case #7 (Sentiment Analysis of Customer Reviews). Because it has clear business value, is fully demonstrable end-to-end, and the data (Amazon reviews) is readily available.
- *"Competitor kaun hai / doosre use cases kya the?"* → The other 13 KIET use cases (Root Cause Analysis, Product Comparison, Recommenders, Churn, Fraud, etc.). We chose #7 because it shows the full ML pipeline (data → model → insight) in a way a judge can see instantly.
- *"Tumne yeh kyon choose kiya?"* → Highest clarity + demonstrability + real business impact (actionable "what to fix first").

---

## Slide 2 — Solution Overview / Architecture ("the rack")

**What to show** — a simple block diagram:
```
Browser (React, Vercel)
        │  HTTPS + token
        ▼
Backend (FastAPI, EC2)
   ├─ api/       (endpoints + auth)
   ├─ analysis/  (concerns, rag, stats)
   ├─ ml/        (sentiment model)
   ├─ ranking/   (priority)
   └─ core/      (config)
        │ reads/writes
        ▼
data/ (reviews.json, concern_stats.json)  •  models/ (trained model)
```
Mention: CI/CD via GitHub Actions; modular layers; no black box.

**What to say**
> "The architecture is three clean layers: a React frontend on Vercel, a FastAPI backend on EC2, and a modular Python backend split into api / analysis / ml / ranking / core. Data flows in as a CSV, gets analyzed, and the results are saved as simple JSON the dashboard reads. We also have CI/CD (GitHub Actions) that runs tests and builds on every push."

**Evaluator questions**
- *"Architecture mein kya choose kiya aur kyon?"* → Layered, modular design (api/analysis/ml/ranking/core). Easy to read, test, and extend; each module has one job.
- *"Doosri cheezein kyon nahi choose kiye?"* → We rejected a single "god file" (hard to maintain) and heavy microservices (overkill for this scale). Layers are the right balance.
- *"Kya flow chuna?"* → Upload → analyze each row (hybrid sentiment + concern detection) → save JSON → dashboard reads → RAG proof per concern. Simple, stateless, deployable.
- *"Python version kya hai?"* → **Python 3.11** (also used in CI and on EC2).
- *"Tech stack kyon?"* → React+Vite+Tailwind (fast UI), FastAPI (auto docs, simple), scikit-learn (no GPU needed), Vercel+EC2 (free, one-click).

---

## Slide 3 — Data

**What to show**
- Source: our curated **Amazon reviews** + the public **amazon_polarity** dataset.
- Total: **79,498** training reviews.
- Label rule: star rating 1–2 → negative, 4–5 → positive, 3 dropped.
- Split: 80% train (63,598) / 20% test (15,900), stratified.
- Note: no fake/generated text; labels come from real star ratings.

**What to say**
> "We trained on 79,498 real Amazon reviews — our set merged with the public amazon_polarity dataset. Labels are taken from the star ratings people actually gave (1–2 stars negative, 4–5 positive). We split 80/20 with stratification so the test set looks like the training set."

**Evaluator questions**
- *"Data kahan se liya?"* → Our Amazon review CSV + the public `amazon_polarity` dataset (HuggingFace). All real, labelled by star rating.
- *"Data clean kaise kiya / class balance?"* → Dropped neutral (3-star), used `class_weight="balanced"` in training, stratified split. Counts: ~43k negative / ~36k positive — reasonably balanced.
- *"Kyun 79k?"* → More data → better, more robust model; we merged a public set with ours to increase variety.
- *"Bias kahan se aa sakta hai?"* → Labels come from ratings, so rating bias carries over. We name this as a limitation and suggest human-reviewed labels as future work.

---

## Slide 4 — ML Model (the core)

**What to show**
- Model: **BERT token classification** (`bert-base-uncased`, 5 labels: O/ASPECT/OPINION_*) — no hard-coded list.
- Tokenizer: `AutoTokenizer.from_pretrained("bert-base-uncased")` + `offset_mapping` → 5 labels.
- Classifier: `LogisticRegression(max_iter=2000, C=1.0, class_weight="balanced")`.
- **Hybrid**: trained model for long/confident reviews; keyword fallback for short/unsure ones.
- Flow diagram: text → TF-IDF numbers → Logistic Regression → probability → label + confidence.

**What to say**
> "Our model turns a review into numbers with TF-IDF, then classifies it as positive or negative with Logistic Regression, returning a confidence score. We use a hybrid: the trained model handles normal reviews; a fast keyword method handles very short or tricky ones. This makes it reliable at every input length."

**Evaluator questions**
- *"Model mein kya choose kiya?"* → TF-IDF + Logistic Regression (a classic, strong baseline).
- *"Kaun sa regression use kiya, kaun se types use kiye?"* → **Logistic Regression** (a linear classifier for two classes). We compared approaches conceptually: keyword counting (too weak), Logistic Regression (chosen), and transformers like DistilBERT (more accurate but heavy).
- *"TF-IDF kya hai?"* → A method that turns text into a row of numbers counting important words (Term Frequency × Inverse Document Frequency).
- *"Kyon Logistic Regression, kyon nahi neural net / BERT?"* → Small, fast, no GPU, fully explainable ("this word pushed it negative"). At this scale it is strong enough; a neural net adds cost with little gain.
- *"Flow kya tha?"* → Supervised: show labelled reviews → learn word weights → predict on new reviews.

---

## Slide 5 — Model Performance / Accuracy

**What to show** — a results table:
| Metric | Score | Plain meaning |
|--------|-------|---------------|
| Accuracy | **88.4%** | 88 of 100 reviews labelled correctly |
| Precision | **86.0%** | when it says "positive", right 86% of the time |
| Recall | **89.0%** | catches 89% of truly negative reviews |
| F1 | **87.5%** | balanced overall score |

Tested on **15,900 unseen reviews**.

**What to say**
> "On 15,900 reviews the model never saw during training, it scores 88.4% accuracy, 86% precision, 89% recall, and 87.5% F1. These numbers are honest — measured on held-out data, saved in metrics.json."

**Evaluator questions**
- *"Accuracy itni kaise hai (itni achhi kaise aayi)?"* → Large training data (79k), good features (word pairs/bigrams capture "not good"), balanced classes, and a stratified split.
- *"Kyon nahi zyada badhi (e.g. 95%)?"* → The data is noisy short reviews; sentiment is often ambiguous (sarcasm, mixed feelings). 88% is strong for binary sentiment at this scale; pushing higher needs cleaner labels or a bigger model.
- *"Overfitting toh nahi hai?"* → We measure on a held-out test set (20%), use `max_iter=2000` with early sane defaults, and report real test numbers — not training numbers.
- *"Confidence threshold kya hai?"* → Model used when confidence ≥ 0.60; below that we use the keyword fallback (hybrid).

---

## Slide 6 — Features / Innovation (RAG + Concerns + Dashboard)

**What to show**
- Concern detection (battery, delivery, camera, price, service…).
- **RAG "real proof"**: click a concern → see actual customer quotes (word-overlap retrieval, no vector DB).
- Priority ranking (impact = count × negative%).
- Live dashboard (sentiment, ratings, time, country).

**What to say**
> "Beyond sentiment, we detect *what* the review is about, rank problems by impact, and — using a lightweight RAG — show the actual customer quotes behind each problem. That proof is the literal source text, not a model's guess."

**Evaluator questions**
- *"Innovation kya hai?"* → Hybrid ML + concern lexicon + retrieval-only RAG proof + explainable priority ranking + live dashboard.
- *"RAG kya hai, kyon?"* → Retrieval-Augmented Generation: fetch real evidence before answering. We retrieve the top-5 matching reviews as proof.
- *"Kyon vector DB / embeddings nahi?"* → For thousands of reviews, simple word-overlap is instant and needs zero infra. Embeddings would be more semantic but heavier; we trade a little for simplicity. We would switch to embeddings at millions of rows.
- *"RAG bina LLM valid hai?"* → Yes — it is the Retrieval half of RAG (retrieval-only). Honest because the proof is the exact source quote.
- *"Concern detection kaise hoti hai?"* → A concern lexicon maps keywords → concern names; fast and explainable.

---

## Slide 7 — Deployment, CI/CD & Code Quality

**What to show**
- Vercel (frontend) + EC2 (backend), REST API, CORS.
- GitHub Actions CI: `pytest` (backend) + `npm build` (frontend) on every push.
- Modular code, tests, real auth (signup/login, hashed passwords, JWT).
- `data/` gitignored (no fake numbers); `models/` committed.

**What to say**
> "We deployed the frontend on Vercel and the backend on EC2 with a REST API. Every push runs CI — backend tests and a frontend build. The code is modular and tested, and login is real (hashed passwords + JWT tokens)."

**Evaluator questions**
- *"Deployment kahan?"* → Frontend Vercel, backend EC2; they talk over HTTPS REST.
- *"CI/CD kya hai?"* → GitHub Actions runs our test suite and build automatically on every commit — catches breaks early.
- *"Security / auth?"* → Real signup/login; passwords scrambled (pbkdf2); JWT tokens; all data endpoints protected.
- *"Scalability?"* → Stateless API; for huge data we'd move to a database + embeddings (interface stays the same).
- *"Code quality?"* → Layered, modular, documented; every line used (no dead code).

---

## Slide 8 — Impact / Demo / Roadmap / Team

**What to show**
- Live demo flow (Upload → Dashboard → click concern → real quotes).
- Business value: turns feedback into a ranked action list.
- Roadmap: embeddings for RAG, DistilBERT model, confidence thresholds, multilingual, persistent DB, real user store.
- **Team (KIET Hackathon, Aug 2026):**
  - Team Leader: Shaan Yadav — 2300291530166
  - Rohan Mehra — 2300291530155
  - Ram Ashish Gond — 2300291530147
  - Sachchidanand Gupta — 2300291530156
  - Shikhar Sameer — 2300291530170
  - Reekal Yadav — 2300291530150
  - Sharadveer Singh — 2300291530168
  - Shivang — 2300291530172

**What to say**
> "In one upload, a business gets a ranked list of what to fix first, with real customer proof. Our roadmap adds transformer models and semantic search. The work was split clearly across the team."

**Evaluator questions**
- *"Aage kya?"* → Transformer model, embeddings-based RAG, multilingual support, persistent database, confidence-based abstention.
- *"Limitations?"* → English-only; word-overlap misses synonyms; labels from ratings carry bias; users are in-memory (demo).
- *"Business value?"* → Saves manual reading; gives prioritized, evidence-backed actions.
- *"Teamwork?"* → Clear task assignment across team members (documented).

---

# Comprehensive Evaluator Q&A (paste into speaker notes)

> Answers are short and judge-ready. Use them for any slide.

**Q1. Competitor kaun hai?**
A: The other 13 KIET use cases (Root Cause Analysis, Product Comparison, Recommenders, Churn, Fraud, Teaser, Metadata, Advertising, Career, Complaint Intelligence, Network Fault, etc.). Among approaches, our "competitors" were: rule-based only (too weak) and heavy LLM/BERT (overkill). We chose BERT (perfect, no hard-code) over TF-IDF hybrid (old, one label per review) of accuracy, speed, explainability, and easy deployment.

**Q2. Tumne yeh use case kyon choose kiya?**
A: Use Case #7 (Sentiment Analysis of Customer Reviews) has the clearest business value, is fully demonstrable end-to-end, and lets us show the whole ML pipeline (data → train → predict → insight). Data is readily available (Amazon reviews).

**Q3. Architecture ("rack") mein kya choose kiya aur kyon?**
A: Three layers — React frontend (Vercel), FastAPI backend (EC2), modular Python (api/analysis/ml/ranking/core). Chosen for clarity, testability, and easy deployment. Rejected a monolithic file (hard to maintain) and microservices (overkill at this scale).

**Q4. Doosri cheezein kyon nahi choose kiin?**
A: Monolith → unmaintainable; microservices → unnecessary complexity/cost; a single keyword model → low accuracy; a heavy transformer → needs GPU and is harder to deploy/explain. Our layered + hybrid choice is the balanced middle.

**Q5. Model mein kya choose kiya?**
A: TF-IDF + Logistic Regression, wrapped in a hybrid with a keyword fallback for short/low-confidence text.

**Q6. Kaun sa regression use kiya, kaun se types use kiye?**
A: Logistic Regression (linear classifier for 2 classes). We evaluated: (a) keyword counting — rejected (weak on context), (b) Logistic Regression — chosen, (c) DistilBERT/transformers — more accurate but heavy/GPU. Hyperparameters: `TfidfVectorizer(max_features=30000, stop_words="english", ngram_range=(1,2), sublinear_tf=True, min_df=2)`, `LogisticRegression(max_iter=2000, C=1.0, class_weight="balanced")`.

**Q7. Data kahan se liya?**
A: Our curated Amazon reviews + the public `amazon_polarity` dataset → 79,498 rows. Labels from star ratings (1–2 negative, 4–5 positive, 3 dropped).

**Q8. Accuracy itni kaise hai (itni achhi kyon aayi)?**
A: Large training set, strong features (bigrams capture phrases like "not good"), balanced classes, and a stratified 80/20 split. Tested on 15,900 unseen reviews → 88.4% accuracy.

**Q9. Kyon nahi zyada badhi (e.g. 95%)?**
A: The reviews are short and noisy; sentiment is often ambiguous (sarcasm, mixed). 88% is strong for binary sentiment at scale. Higher needs cleaner human-reviewed labels or a larger model.

**Q10. Kya flow chuna?**
A: Supervised ML flow — show labelled reviews → learn word weights → predict on new text; plus a hybrid fallback and a RAG retrieval step for proof.

**Q11. Python version kya hai?**
A: **Python 3.11** (used locally, in CI, and on EC2).

**Q12. Innovation kya hai?**
A: Hybrid ML + concern detection + retrieval-only RAG (real proof quotes) + explainable priority ranking + live dashboard.

**Q13. RAG kyon aur vector DB kyon nahi?**
A: Word-overlap retrieval is instant and needs zero infra for thousands of reviews. Embeddings/vector DB would be more semantic but heavier; we'd adopt them at millions of rows. The retrieval interface stays the same.

**Q14. Deployment aur CI/CD?**
A: Vercel (frontend) + EC2 (backend) + REST API; GitHub Actions runs `pytest` + `npm build` on every push.

**Q15. Auth / security?**
A: Real signup/login, passwords scrambled with pbkdf2, JWT tokens (HS256, 1h), all data endpoints protected. Users are in-memory (temporary, demo).

**Q16. Limitations / aage kya?**
A: English-only; word-overlap misses synonyms; rating-based labels carry bias; in-memory users. Roadmap: DistilBERT, embeddings RAG, multilingual, persistent DB, confidence thresholds.

**Q17. Overfitting nahi hai na?**
A: Metrics are on a held-out 20% test set, not training data; we report real test numbers in metrics.json.

**Q18. Code quality / modularity?**
A: Layered modules (one job each), tests, CI, no dead code, clear docs. Easy for any developer (even a beginner) to follow.
