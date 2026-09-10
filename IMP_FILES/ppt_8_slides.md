# PPT Analysis — KIET Hackathon Approach August 2026 (14 Slides) → Where We Stand → 8 Slides Priority For Evaluator Marking

> This file reads `Desktop/KIET Hackathon Approach - August 2026.pptx` (14 slides, 5.7M) fully, tells what evaluator will mark, where we stand now, what is missing, and gives **8 slides priority** so marking is easy. No push, local only as you said.

---

## 1. What Is Inside The PPTX (14 Slides Read)

| Slide | Title (from `python-pptx` extract) | What It Says | Why It Matters For Marking |
|-------|------------------------------------|--------------|----------------------------|
| **1** | `KIET Hackathon Approach AUGUST 2026` `KIET - AIA Partnership` | Cover | Not marked, but first impression |
| **2** | `Hackathon Approach` `Launch 17 Aug → Ideate→Design→Build 17-24 Aug → Evaluation 25-26 Aug` `28 Teams max 8 members, 14 use cases, 1 college mentor + 1 Cognizant mentor` | Timeline: 1 week to build, 2 days evaluation, in-person by Cognizant Panel | **We are at `Build` (17-24 Aug) → Evaluation (25-26 Aug) next** |
| **3** | `Expectation from Participants` `Attend orientation, Connect mentors, Finalize approach+data, Build prototype, Submit design PPT/video via email` | 5 expectations | **We have done 4/5, 5th (PPT) pending** |
| **4** | `Factors To Consider When You Build the Solution` **9 Scoring Criteria** | `1. Use Case Understanding | 2. Solution Architecture | 3. Innovation | 4. UI/UX | 5. Technical Implementation & Code Quality | 6. Model Performance & Evaluation | 7. Deployment & Integration | 8. Presentation & Communication | 9. Collaboration` (each with description: clarity, feasibility, originality, usability, readability, F1, CI/CD, clarity, teamwork) | **This is the 9-point marking rubric** — every slide must map to one |
| **5** | `Evaluation Criteria - Guideline Post Build` `Use case flow, Proposed architecture alternatives, Breadth of sample data, Architecture consideration, Performance, UX, Integration alternatives, Reusable, Ease of implementation, Real time decisions, Monitoring, Way of presenting, Attendance in mentor connects` | Post-build guideline (13 checks) | **Evaluator will check these 13** |
| **6** | `Expectation of Best Solution` `Presence of: Architecture, Source code, UI, Documentation, Video, Estimation/Roadmap, Presentation` | 7 deliverables for best solution | **We have 5/7, missing Video + Roadmap** |
| **7** | `Hackathon Use cases` | Divider | — |
| **8** | `KIET Short Listed Use Cases` `S.no 1-3: Root cause analysis, Product Comparison, Customer Support Assistant` | 14 use cases total, we chose **7** | **Our use case is #7** |
| **9** | `...Contd 4-6: Price Plan, Upsell, Fraud Detection` |  | — |
| **10** | `...Contd 7-9: **7 Sentiment Analysis of Customer Reviews (Amazon Reviews Dataset)**, 8 AI Career Guidance, 9 Teaser from Video` | **Use Case #7:** `Businesses struggle to analyze large volumes of customer feedback. Classify sentiment and identify key concerns. | Sentiment Analysis` | **This is us** |
| **11** | `...Contd 10-11: Context Aware Advertising, Metadata Tagging` |  | — |
| **12** | `...Contd 12-13: Churn Prediction, Complaint Intelligence` |  | — |
| **13** | `...Contd 14: Network Fault Prediction` |  | — |
| **14** | `Thank You` `Confidential` | End | — |

**Key extract:** Slide 4 lists **9 criteria**, Slide 6 lists **7 deliverables**. Our project is **Use Case #7 Sentiment Analysis**.

---

## 2. What Is Needed At Presentation Time (For Marking)

From Slide 4 (9 criteria) + Slide 5 (13 checks) + Slide 6 (7 deliverables), evaluator will mark:

1. **Use Case Understanding** — Did you understand `one review → aspects + per-aspect feeling + Mixed + ranked what to fix`?
2. **Solution Architecture** — Can you show `Frontend → FastAPI → BERT 5 labels → MySQL` and why each chosen?
3. **Innovation** — Is it hard-coded `["battery"]` or does BERT learn `X is wobbly → X is ASPECT` for any product?
4. **UI/UX** — Can evaluator `Login → Upload any CSV → See Pie/Bar/Table` in 30 sec without help?
5. **Technical Implementation** — Is code `8-25 lines` helpers, `8th grade` comments, `cfa.api.main:app`, `PYTHONPATH`, no big function?
6. **Model Performance** — Can you show `F1 weighted 0.875, ASPECT F1 0.76, gap <0.05` not just `accuracy 0.96`?
7. **Deployment & Integration** — Is it on `EC2` `t3.small` `0.0.0.0:8000` via `Docker` `ECR` `SSM` `GitHub Actions` + `Vercel`?
8. **Presentation & Communication** — Are 8 slides clear, with `What to fix first` and demo?
9. **Collaboration** — Can each member say `my role: ML/Backend/Cloud`?

---

## 3. Where Do We Stand Right Now? (What We Have vs What We Don't Have)

### We HAVE (Ready)

| Have | Proof | Slide It Covers |
|------|-------|-----------------|
| **Use Case #7 built exactly:** One review → aspects + per-aspect + Mixed + API/UI | `notebooks/Final_Perfect_Model.ipynb` 60 cells + `src/cfa/ml/bert_aste.py:152` `predict_review()` | Slide 4 #1 |
| **Architecture:** `React Vercel → FastAPI EC2 t3.small → BERT 5 labels → MySQL Aiven` | `src/cfa/api/main.py:14` `cfa.api.main:app`, `Dockerfile:24` CPU `t3.small`, `deploy.yml:149` mount | Slide 4 #2 |
| **No hard-code:** `bert-base-uncased` learns pattern, not list | `src/cfa/ml/bert_aste.py` + `extract.py` no `["battery"]` | Slide 4 #3 |
| **UI/UX:** `Drop CSV here` div, `Top 5 See more`, `Review Explorer 55`, `70%` aligned, English logs | `frontend/src/components/Dashboard.jsx` | Slide 4 #4 |
| **Code quality:** Small helpers, `8th grade` comments, `pytest 7 passed` | `src/cfa/` | Slide 4 #5 |
| **Model scores:** `eval_f1` weighted `0.875`, `ASPECT F1 0.76`, `check_overfit()` gap | `notebooks` `cell 45-48` | Slide 4 #6 |
| **Deployment:** `Docker` `python:3.11-slim` `PYTHONPATH`, `ECR` `customer-sentiment-analysis`, `SSM` `i-010a45ed37176947b`, `Vercel` | `Dockerfile`, `deploy.yml` | Slide 4 #7 |
| **Docs:** `README.md` 36K, `IMP_FILES/model.md` 26K, `cloud.md` 15K, `pipeline.md` 11K, `user_flow.md` 8.8K, `ipynb.md` 23K | `IMP_FILES/` | Slide 6 (Documentation) |
| **Any CSV:** `bluetooth 48`, `chair 52`, `watch 55`, `final 36`, plus `3×100` `coffee 105`, `shoes 102`, `headset 108` | `testing_csvs/` | Slide 5 `Breadth of sample data` |

### We DON'T HAVE (Missing — List Down)

| Don't Have | Why Needed | Priority |
|------------|------------|----------|
| **Video (2-3 min)** | Slide 6 says `Documentation, Video` — evaluator expects demo video if PPT not enough | **HIGH** — without video, `Presentation` marks cut |
| **Estimation / Roadmap slide** | Slide 6 `Estimation of development, Roadmap` — where we stand + next 3 months | **HIGH** — shows planning |
| **Live demo fallback (if EC2 sleeps)** | `t3.small` may sleep, first `POST /upload` 15 sec `cold start` | **MEDIUM** — keep `sample_reviews.csv` 3 rows ready + local `http://localhost:8000` backup |
| **One-slide architecture alternatives** | Slide 5 says `Proposed architecture and various alternatives` — why not `Lambda`/`SageMaker`/`ECS` | **MEDIUM** — we have `cloud.md` but need 1 slide `Why EC2 not Lambda` |
| **Reusable / Ease of implementation** | Slide 5 `Reusable, Ease of implementation` — how to add new product without code change | **MEDIUM** — need to say `No hard-coded list, same model for chair/watch` |
| **Real time decisions / Monitoring** | Slide 5 `Real time decisions, Process of monitoring` — how to know if model fails | **LOW** — we have `HEALTHCHECK` + `CloudWatch` ` /customer-sentiment-analysis/backend` + `console [CFA]` logs, but need 1 bullet |
| **Attendance proof for mentor connects** | Slide 5 `Attendance in various mentor connects` | **LOW** — keep screenshot if any |

---

## 4. If We Make PPT Now, How Many Slides? 8 Slides Priority Basis (So Evaluator Can Mark Easily)

**Why 8 slides?** 14 slides in approach PPT is too many for 5-7 min demo. **8 slides × 30-40 sec each = 4-5 min + 2 min demo + 1 min Q&A = 7-8 min** — evaluator can tick 9 criteria one per slide.

| Slide # | Title (for PPT) | What To Show (30 sec) | Maps To Marking (Slide 4) | What Evaluator Ticks |
|---------|-----------------|------------------------|---------------------------|----------------------|
| **1** | **Title + Team + Use Case #7** | `Customer Feedback Insight System — Use Case #7 Sentiment Analysis` + team names + `KIET × Cognizant` + live links `Vercel` + `EC2 3.109.121.85:8000/health` (proof it runs) | — | Knows which use case |
| **2** | **Problem → Our Solution (Use Case Understanding)** | Left: `One review has many feelings (Mixed)` + `Businesses drown in 1000s reviews`. Right: `Our flow: 1 review → Every aspect → Feeling per aspect → Overall Mixed → Ranked what to fix + proof quotes` + example `product→Positive, delivery→Negative` | **#1 Use Case Understanding** | Clarity of problem |
| **3** | **Architecture + Why Not Alternatives** | Diagram (Mermaid from `pipeline.md`): `Vercel → FastAPI EC2 t3.small → BERT 5 labels → MySQL` + small table `Why not Lambda (250M limit), SageMaker (overkill), t3.micro (OOM 1GB)` + `Why t3.small 2GB` | **#2 Solution Architecture** + Slide 5 `Alternatives` | Feasibility + alternatives |
| **4** | **Data → Any CSV (Breadth)** | `Amazon 21k (demo) + DMASTE 7,524 → 16,288` + `find_text_column` demo: `Review Text`, `comment` both work + show 3 datasets `bluetooth 48`, `chair 52`, `watch 55` + `100-row coffee 105, shoes 102, headset 108` (any columns, any product) | **#2 Breadth of sample data** + **#3 Innovation (no hard-code)** | Data depth |
| **5** | **Model — No Hard-Code (Innovation)** | `bert-base-uncased` 110M + 5 labels `O/ASPECT/OPINION_*` → `X is wobbly → X is ASPECT` pattern, **not** `["battery"]` list + `TF-IDF F1 0.45 → BERT 0.68` + `distilbert` backup 250M | **#3 Innovation** | Originality |
| **6** | **Live Demo — UI/UX (30 sec)** | **Live:** `Login → Drop final.csv 36 → Pie + Bar battery 6 → Top Priority ACT FIRST → View comments 5 → See more 55` (or video backup if EC2 sleeps). Show `Drop CSV here` div + `80%` aligned | **#4 UI/UX** | Usability |
| **7** | **Code + Performance + Deployment** | Left: `src/cfa/ml/bert_aste.py:152` small helpers, `cfa.api.main:app`, `pytest 7 passed` + `eval_f1 0.875, ASPECT 0.76, gap <0.05`. Right: `Dockerfile` CPU-only `whl/cpu`, `ECR` `linux/amd64`, `SSM` `i-010a...`, `Vercel` proxy `/api` (no mixed-content), `MySQL Aiven` hard-coded persist | **#5 Code Quality + #6 Model Performance + #7 Deployment** | 3 criteria in one slide (saves time) |
| **8** | **Roadmap, Reuse, Monitoring + Thank You** | `Now: 10 days, t3.small, 16k rows → Next: 3 epochs, NEU augment, nearest opinion fix, distilbert, HTTPS ALB` + `Reuse: same model for any product, no list` + `Monitoring: HEALTHCHECK + CloudWatch /customer-sentiment-analysis/backend + [CFA] logs` + `Thank You + Live links + Q&A` | **#8 Presentation + #9 Collaboration (my role ML/Backend/Cloud) + Slide 6 Roadmap** | Roadmap + reuse + monitoring |

**Why this order?** Evaluator has marking sheet in order **#1→#9** (Slide 4). Our 8 slides go **#1, #2, #3, #4, #5, #6, #7, #8+9** — one slide per mark, so they tick while you speak.

---

## 5. What To Keep Ready For Presentation Time

- **Laptop:** Fully charged, `http://localhost:8000/health` backup if EC2 sleeps (15 sec wake), `sample_reviews.csv` 3 rows + `final.csv` 36 + `headset 108` in `Downloads` for drag.
- **Links:** `Vercel` + `EC2 3.109.121.85:8000/health` + `ECR` + `S3` + `GitHub Actions` tab open (show `8adbb5b` green).
- **One-pager:** Print `pipeline.md` Mermaid + `model.md` metrics `ASPECT F1` for hand.
- **Answer:** For any `Why not X?` → `By The Way` from `model.md` + `cloud.md` (we have 15 whys each).

---

*This `ppt_8_slides.md` is made from `KIET Hackathon Approach - August 2026.pptx` 14 slides → where we stand (HAVE 7/9, DON'T HAVE Video/Roadmap) → 8 slides priority for easy marking. No push, local only.*
