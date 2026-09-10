# Customer Feedback Insight System — KIET / Cognizant Hackathon (Use Case #7)

> **One review → Every aspect → Feeling per aspect → Overall (Positive / Negative / Neutral / Mixed) → Ranked what to fix first, with real quotes.**

Built for **Cognizant / KIET Hackathon — Use Case #7: Sentiment Analysis of Customer Reviews**.

[![Live Frontend](https://img.shields.io/badge/Live-Frontend-blue?style=flat&logo=vercel)](https://customer-feedback-insight-system.vercel.app)
[![Live API](https://img.shields.io/badge/Live-API-green?style=flat&logo=amazonec2)](http://3.109.121.85:8000/health)
[![Notebook](https://img.shields.io/badge/Notebook-Final_Perfect_Model.ipynb-blue)](notebooks/Final_Perfect_Model.ipynb)
[![Tests](https://img.shields.io/badge/Tests-7%20passed-brightgreen)](#)

---

## What Is This?

Companies get thousands of reviews. This system takes a CSV and answers:

1. **What are customers talking about?** — `battery`, `delivery`, `armrest` (found by BERT, not a fixed list).
2. **How do they feel?** — Positive / Negative / Neutral per aspect.
3. **Overall feeling?** — Positive / Negative / Neutral / **Mixed** (when one aspect good, another bad).
4. **What to fix first?** — Ranked by `count × negative%` with real review proof.

**Example:** `"The product is excellent but delivery was terrible."` → `product → Positive`, `delivery → Negative`, `Overall → Mixed`

---

## How It Works (30 sec)

1. Upload any CSV (`review_text` column can be `Review Text`, `comment`, `feedback` — auto-found).
2. Backend finds aspects + feelings with BERT (5 labels), computes overall `Mixed` rule.
3. Frontend shows Pie, Bar, ranked concerns, and proof quotes.

---

## Architecture

```
Vercel (React) → EC2 t3.small (FastAPI 0.0.0.0:8000) → BERT 5 labels → MySQL (Aiven)
     ↓ proxy /api                ↓ mount /opt/.../model:/app/bert_aste_final:ro
  Vite + Tailwind + Recharts    preprocessing → bert_aste → sentiment → ranking
```

Training: `DMASTE 7,524 → 16,288` → BERT tokenizer `128` → `bert-base-uncased` `5` → Trainer `2 epochs` → `bert_aste_final/`.

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React 19 + Vite + Tailwind + Recharts | Fast, easy charts |
| Backend | FastAPI + Uvicorn | Auto docs, simple |
| ML | BERT token classification (`bert-base-uncased`, 5 labels) | No hard-coded list, finds any aspect |
| DB | MySQL (Aiven) / SQLite fallback | Last 3 analyses per user |
| Deploy | Vercel + EC2 (Docker) | Simple for 10-day demo |
| Tests | Pytest | 7 tests pass |

---

## Project Structure

```
notebooks/Final_Perfect_Model.ipynb  # 60 cells, training
src/cfa/api/main.py                  # FastAPI app
src/cfa/ml/bert_aste.py              # BERT 5 labels
src/cfa/analysis/                    # preprocessing, extract, sentiment
frontend/                            # React
bert_aste_final/                     # Trained model (gitignored, S3 → EC2)
testing_csvs/                        # Test CSVs (48/52/55 + 100+)
IMP_FILES/                           # Docs: model.md, cloud.md, pipeline.md
```

See `IMP_FILES/project_structure.md` for every file + function.

---

## How to Run (Local)

**Backend:**
```bash
pip install -r requirements.txt
uvicorn cfa.api.main:app --reload --port 8000  # PYTHONPATH=src
# http://localhost:8000/health → {"status":"ok"}
```

**Frontend:**
```bash
cd frontend && npm install && npm run dev  # http://localhost:5173
```

**Test CSV:** `sample_reviews.csv` or any CSV with `review_text` column.

**Train (once, Colab T4):** Open `notebooks/Final_Perfect_Model.ipynb` → `Run all` → `trainer.train()` → `bert_aste_final/`.

---

## API Reference

Base: `http://localhost:8000` or `http://3.109.121.85:8000` — all `/api/v1/*` need `Authorization: Bearer <token>` except `/health`, `/ping`.

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/health` | — | `{status, reviews_analyzed}` |
| POST | `/api/v1/auth/signup` | `{username, password, email}` | `{token}` |
| POST | `/api/v1/auth/login` | `{username, password}` | `{token}` |
| POST | `/api/v1/upload` | `file` multipart | `{total_reviews, sentiment_distribution, ranked_concerns}` |
| POST | `/api/v1/analyze` | `{review_text}` | `{overall_sentiment, concerns, aspects}` |

Example: `{"review_text": "The chair armrest is wobbly but fabric is comfortable."}` → `{"overall_sentiment":"mixed","concerns":[{"name":"armrest","sentiment":"negative"},...]}`

---

## Deployment

- **Frontend:** Vercel, `frontend/`, `npm run build`, proxy `vercel.json` `/api → http://3.109.121.85:8000` (avoids mixed-content).
- **Backend:** Docker `python:3.11-slim` `PYTHONPATH=/app/src` CPU-only `whl/cpu` → ECR `customer-sentiment-analysis` `ap-south-1` → SSM `i-010a45ed37176947b` `t3.small` mount `-v /opt/.../model:/app/bert_aste_final:ro` → `curl -f http://localhost:8000/health`.

Docs: `IMP_FILES/cloud.md` (why EC2 not Lambda/SageMaker), `pipeline.md` (full flow).

---

## Model Scores

| Metric | Value | Note |
|--------|-------|------|
| Weighted F1 | ~0.875 | Main score (POS 79% imbalanced) |
| ASPECT F1 | 0.76 | Most important — finds `armrest` |
| OPINION F1 | POS 0.81, NEG 0.72, NEU 0.57 | NEU low (only 608 rows) |
| Gap train-val | <0.05 | Good, not overfit |

---

## Mapping to 9 KIET Criteria

| # | Criterion | Where |
|---|-----------|-------|
| 1 | Use Case Understanding | One review → aspects + Mixed + ranked |
| 2 | Architecture | Vercel → FastAPI → BERT → MySQL |
| 3 | Innovation | No hard-coded list, pattern `X is wobbly` |
| 4 | UI/UX | Drop CSV div, Top 5 + See more, 80% aligned |
| 5 | Code Quality | Small helpers 8-25 lines, 7 tests |
| 6 | Model Performance | F1 0.875, gap check |
| 7 | Deployment | Docker + ECR + SSM + EC2 |
| 8 | Presentation | This README + 8-slide PPT |
| 9 | Collaboration | Roles in `Cognizant_Team_Roles.md` |

---

## Docs

- `IMP_FILES/model.md` — BERT deep dive (why pre-trained, fine-tune, metrics)
- `IMP_FILES/frontend.md` / `backend.md` / `cloud.md` — stack details
- `IMP_FILES/ipynb.md` — 60 cells theory+code
- `IMP_FILES/pipeline.md` — Best user flow + Mermaid
- `IMP_FILES/ppt_8_slides.md` — 8 slides for evaluator

---

## License

Hackathon / educational use. Data: DMASTE via `SilvioLima/raw_data`, Amazon via Kaggle `dongrelaxman/amazon-reviews-dataset`.
