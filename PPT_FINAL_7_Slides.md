# Customer Feedback Insight System — 6-Slide Professional PPT | KIET × Cognizant Hackathon — Use Case #7

> **6 slides × 45 sec = 4.5 min + 2 min live demo + 1 min Q&A = 7.5 min.** Professional, English only, larger text, no overlap, no Hinglish. Give the **MASTER PROMPT** below to any AI (Gamma, Tome, Copilot, Beautiful.ai) → it builds the PPT. Every slide has `Layout`, `Visual`, `Text (Copy-Paste)`, `Keywords (must appear)`, `Speaker Notes`, `Marks`, `Design Hint`.

> **Links:** Frontend `https://customer-feedback-insight-system.vercel.app` | Backend `http://3.109.121.85:8000/health` | GitHub `https://github.com/Shaanworkspace/customer-feedback-insight-system` | Datasets: DMASTE `https://huggingface.co/datasets/SilvioLima/raw_data` + Amazon `https://www.kaggle.com/datasets/dongrelaxman/amazon-reviews-dataset`

---

## MASTER PROMPT FOR AI — COPY-PASTE ENTIRE BLOCK BELOW TO GAMMA/TOME/COPILOT

```
Create a 6-slide professional PowerPoint 16:9 (13.33×7.5 inches) for KIET × Cognizant Hackathon Use Case #7: Customer Feedback Insight System.

DESIGN SYSTEM (STRICT):
- Background: Dark #0F1E33 with accent #173F73 and bright #1F6FEB. Cards #FFFFFF border #E2E8F0. Text dark #1E293B, muted #64748B, light #FFFFFF. Success #10B981, danger #EF4444, warning #F59E0B.
- Fonts: Calibri (fallback Montserrat), Titles 22-28pt Bold, Body 8-9pt, Captions 6.5-7pt. Word wrap ON, auto-size OFF, no overflow, no overlap. Grid alignment, 0.4 inch margins, footer bar dark with slide number.
- No Hinglish. All English. Larger readable text. Mind-map style arrows.
- Each slide: top bar with slide number + title + tag, footer dark bar "KIET × Cognizant — Use Case #7 | Confidential — X/6".
- Icons minimal, rounded rectangles radius 0.08 inch, top color bar 4pt per card.

CONTENT — 6 SLIDES (USE EXACT TEXT BELOW PER SLIDE):

SLIDE 1 — COVER: Title + Team + Use Case #7 + Live Proof
- Title lines: "Customer Feedback Insight System" + "Sentiment Analysis of Customer Reviews" + pill "KIET × COGNIZANT HACKATHON • AUGUST 2026 • USE CASE #7" + big badge "USE CASE #7" orange #FF6B35 bottom-right.
- Left card: Team 8 members grid 2 columns. Shaan Yadav highlighted: bigger bold #1F6FEB + separate pill [LEAD] orange beside name, note "Team Lead — Model + AWS Deployment — Pipeline Owner". Others: Reekal Yadav (Model Training), Shikhar (Data Visualisation), Sharad (Data Preprocessing), Rohan Mehra (Backend Auth+Upload), Sachchidanand (Backend Pipeline+DB+Ranking), Shivang (Frontend Core UI), Ram Ashish Ram (Frontend Polish & Flow).
- Right card: LIVE PROOF section redesigned (not plain white). Two link cards with icons: "Frontend — customer-feedback-insight-system.vercel.app" + green badge ● LIVE, "Backend — 3.109.121.85:8000/health" + "EC2 t3.small ap-south-1". Below: stats row 3 numbers "16,288 Training Rows | 415 MB BERT Model | 52-108 Reviews Tested" + GitHub line. QR placeholders 2 small squares labelled QR Vercel / QR EC2. Overall sentiment line: "One review → Every aspect → Feeling per aspect → Overall Mixed → Ranked what to fix + Proof" italic.
- Visual: dark background with subtle glow circles, rounded cards, accent line under title.

SLIDE 2 — PROBLEM → SOLUTION (MIND MAP, BIGGER TEXT)
- Title bar: "02 — Problem → Solution" with tag "USE CASE UNDERSTANDING • WHY MIXED MATTERS" and bigger headings inside cards: "PROBLEM" red and "OUR SOLUTION" green each 10pt Bold visible.
- Left card PROBLEM (mind-map branches, larger text 8-9pt):
  Title: "Businesses Struggle to Analyze Large Volumes of Customer Feedback"
  Branches: 1) Thousands of reviews, manual reading impossible. 2) One review contains multiple feelings — "product excellent but delivery terrible" → single label fails. 3) Key concerns unknown — which aspect (battery, armrest, delivery) how often, how negative? 4) Data is scattered — different CSV names (Review Text / comment / feedback), 1 to 5 columns. 5) Hard-coded list ["battery","delivery"] fails for new aspect armrest → Neutral → churn. Impact box red: "Impact: Mixed missed → wrong ranking → fix wrong area → customer leaves. Manager sees Positive 80% but delivery 40% Negative hidden."
- Right card SOLUTION (mind-map sequential 5 steps bigger, connected with › arrows):
  Title: "Our Solution — How We Broke Down Use Case #7 Sequentially"
  Steps horizontal: 01 Every Aspect (battery, delivery, armrest) → 02 Per-Aspect Feeling (Positive/Negative/Neutral) → 03 Overall (Pos+Neg → Mixed) → 04 Ranked (impact = count × negative% — ACT FIRST) → 05 Proof (5 real quotes). Plus aim line: "Aim Oriented: aspect + per-aspect + Mixed + ranked + proof — model 60%, our glue 40%".
  Example box blue: "Review: The product is excellent but delivery was terrible." chips: product → Positive (green), delivery → Negative (red), Overall → Mixed (orange). Note below: "Pattern: X is wobbly → X is ASPECT • Not list [battery] • No hard-coded values".
- Visual: Split 50/50 cards, red left border, green right border, icon dots.

SLIDE 3 — ARCHITECTURE — FULL PIPELINE MIND MAP (MOST IMPORTANT)
- Title bar: "03 — Architecture — Full Pipeline Mind Map" tag "★ BEST SLIDE — 60 SEC DISCUSSION"
- Top row: 6 connected boxes left→right with arrows: [USER CSV] review_text mandatory any name → [FRONTEND] Vercel — Upload CSV button click → user uploads CSV — vercel.json proxy /api → EC2 http (avoids mixed-content) → [BACKEND] FastAPI EC2 t3.small — POST /upload — JWT auth — CORS vercel.app — RateLimiter 30/60s → [PREPROCESS] Column matching — find_text_column substring — clean strip lower — keep rating/date/country in attributes — 16,288 rows → [BERT 5 LABELS] bert-base-uncased 110M — max_length 128 — offset_mapping — O / ASPECT / OPINION_POS / NEG / NEU → [TRIPLETS & RANKING] aspect-opinion-sentiment — Overall Mixed — Ranking count×negative% — Proof 5 quotes — MySQL Aiven last 3 — Dashboard Pie/Bar/Top5. Each box has top color bar distinct.
- Second row split left/right:
  Left box: "HOW WE BUILT MODEL — TWO MODELS MERGED & LABELED"
  Text: Pre-trained English BERT (Wikipedia 2.5B + BookCorpus 800M) — understands grammar, not reviews. + DMASTE 7,524 human-labeled → 28,233 → drop -1 (11,945 implicit It is good) → 16,288 explicit. Merge → Fine-tune 5-label head AutoModelForTokenClassification num_labels=5 (Linear 768→5) → bert_aste_final 416M (model.safetensors + tokenizer.json) → S3 private → EC2 /opt/.../model:ro. Pattern: X is wobbly → X is ASPECT even if armrest never seen. No hard-coded list. Single model handles any product.
  Right box: "WHY THIS STACK? WHY NOT OTHERS?"
  Rows: EC2 t3.small 2GB ✓ vs t3.micro 1GB OOM 1.3G (415M+800M → kill 137) ✓, Lambda ✗ 250M limit BERT 416M fail, SageMaker ✗ overkill 10-day cost, ECS/K8s ✗ 1 container, BERT-base 110M ✓ vs large 340M needs 8GB OOM, CPU whl/cpu ✓ vs 3GB CUDA cudnn 553M. Add HEALTHCHECK + restart unless-stopped.
- Bottom line: "Flow: CSV → Vercel proxy (no mixed-content) → EC2:8000 → Preprocess → BERT 128 → Triplets → Mixed → count×neg → Proof → MySQL → Dashboard"
- Visual: Horizontal pipeline big, left-right detail boxes, icons minimal.

SLIDE 4 — DATA — FROM WHERE & WHAT IS DATA (ENGLISH PRE-TRAINED + HUMAN DATASET + BIAS)
- Title bar: "04 — Data — From Where & What is Data" tag "BREADTH OF SAMPLE DATA • 5 LABELS"
- Left card SOURCE 1 TRAINING (human):
  Title: DMASTE — 7,524 reviews (SilvioLima/raw_data)
  Flow: 7,524 → flatten 28,233 → drop -1 (11,945 implicit no span) → 16,288 explicit
  Split: review-level Train 4,055 / Val 1,014 / Test 1,268 — leakage 0 (set(train) ∩ set(test)=0) — random_state 42 reproducible.
  Distribution bars: POS 79% (12,944) green long bar, NEG 17% (2,736) red, NEU 4% (608) orange small — BIASED box note: POS 20× NEU → model favours POS → Accuracy 79% by guessing POS → we use weighted F1. Amazon mention small.
- Middle card 5 LABELS PER TOKEN:
  Chips vertical: O Other is,the,was (90% tokens) light grey, ASPECT battery/armrest/delivery (blue), OPINION_POS great/excellent (green), OPINION_NEG terrible/wobbly (red), OPINION_NEU okay/average (orange). Example line: "Battery is great but armrest is wobbly" → Battery=ASPECT, great=OPINION_POS, armrest=ASPECT, wobbly=OPINION_NEG in italic blue box.
- Right card TEST DATASETS & ANY CSV:
  Cards: bluetooth_speaker 48 rows 4 cols, office_chair 52 rows 3 cols (no date → Trend empty test), smartwatch 55 rows 5 cols +product, plus 100+ rows coffee_maker 105 (1-col) running_shoes 102 (2-col) gaming_headset 108 (3-col) → same model any product, find_text_column accepts any name (Review Text / comment / feedback) substring. Note: Only 1 column mandatory review_text.
- Visual: 3-column cards, distribution bars, chip pills.

SLIDE 5 — MODEL COMPARISON — TF-IDF vs BERT + WHY F1
- Title bar: "05 — Model Comparison — TF-IDF vs BERT" tag "INNOVATION • PERFORMANCE"
- Left card BEFORE TF-IDF + LOGISTIC:
  Title: Word Count → 1 Label Per Review
  Points: Counts battery 1 great 1 terrible 1 loses order, Needs list ["battery"] → armrest → Neutral, Mixed miss product good+delivery bad → 1 label only, Accuracy 0.71 F1 0.45 (POS 79% tricks accuracy) 1.35 MB fast but wrong. Bar ASPECT F1 0.45 red short. Note: Fixed list fails tomorrow strap.
  Center arrow big: → +0.23 +51% better Pattern > List
- Right card NOW BERT 5-LABEL TOKEN:
  Title: bert-base-uncased 110M + 5 heads → every token — review-level split leakage 0 — 2 epochs T4 — lr 2e-5
  Points bullets: Reads both ways bidirectional — wobbly near armrest → ASPECT, Pattern X is wobbly → X is ASPECT even unseen ✓, Mixed 100% catch battery Positive+delivery Negative → Mixed.
  Scores bars: ASPECT 0.76 green, OPINION_POS 0.81, OPINION_NEG 0.72, OPINION_NEU 0.57 (NEU low 608 rows) orange, Weighted F1 0.875 main, Gap <0.05 no overfit. Footnote: Why BERT-base 110M not large 340M 415M fits t3.small 2GB large needs 8GB OOM. Backup distilbert 66M 250M F1 0.66 2× faster.
  Separate box: WHY F1 NOT ACCURACY? FP waste (false battery top) vs FN hide (miss armrest → Neutral churn) — F1 balances 2*P*R/(P+R). Weighted F1 because bias 79% POS — accuracy lies. Optimize ASPECT F1 0.76→0.80 + weighted, not accuracy 0.96 (O 90% → 0.96 even if ASPECT 0). Next: augment NEU 608→2k, 3 epochs, nearest opinion, threshold 0.4 → 0.90 aim.
- Visual: Split cards, red left, green right, horizontal metric bars.

SLIDE 6 — THANK YOU — ALL LINKS + FUTURE SCOPE
- Full dark background #0F1E33 with glow, big centered "Thank You" 26pt, subtitle "Live Demo — Drag Any CSV • Q & A" #93C5FD italic.
- Top 3-column roadmap: NOW 10 days t3.small 16,288 2 epochs F1 0.68 Neutral 58% first-opinion lag (dark), NEXT 2 WEEKS Data NEU 608→2k POS 79%→53% balance clean dedup (blue tick), NEXT 1 MONTH Model+Logic+Infra 3-4 epochs nearest opinion HTTPS ALB distilbert (green tick).
- Middle row 2 cards dark #142B4A: REUSE — Same model any product no list no code change — find_text_column handles any name — strap also found via pattern. MONITORING — HEALTHCHECK + restart unless-stopped + CloudWatch /customer-sentiment-analysis/backend + [CFA] logs + curl -f localhost:8000/health no hardcode.
- Bottom link card white: "Frontend: customer-feedback-insight-system.vercel.app • Backend: 3.109.121.85:8000/health • Dataset 1: huggingface.co/datasets/SilvioLima/raw_data (DMASTE) • Dataset 2: kaggle.com/datasets/dongrelaxman/amazon-reviews-dataset (Amazon 21k) • GitHub: Shaanworkspace/customer-feedback-insight-system" 6.5pt #1F6FEB centered.
- Team line: "Team: Shaan Yadav [LEAD] • Reekal Yadav • Shikhar • Sharad • Rohan Mehra • Sachchidanand • Shivang • Ram Ashish Ram" muted.
- Visual: Dark theme, big Thank You, link card white, roadmap ticks.
```

---

## Slide 1 — Cover — Title + Team + Use Case #7 + Live Proof

**Layout:** Full dark `bg-[#0F1E33]` + glow `bg-[#173F73]`, top pill, center title 2 lines, left team card 2 columns, right live proof redesigned card, bottom footer.

**Visual:** Dark with 2 glow ovals behind, left team card `#142B4A`, right live card white. Use Case #7 big orange badge `#FF6B35` over right card top-right.

**Text (Copy-Paste):**

```
KIET × COGNIZANT HACKATHON • AUGUST 2026 • USE CASE #7  [pill top]

Customer Feedback
Insight System
Sentiment Analysis of Customer Reviews
[underline 1.2 inch #1F6FEB]

TEAM — 8 MEMBERS
Shaan Yadav  [LEAD]  —  Team Lead — Model + AWS Deployment — Pipeline Owner  [highlight: Shaan Yadav 11pt Bold #1F6FEB + pill [LEAD] orange #FF6B35 on same line]
Reekal Yadav — Model Training (DMASTE 16,288 • Weighted F1 • Trainer)
Shikhar — Data Visualisation (Pie / Bar / Top 5 + Proof)
Sharad — Data Preprocessing (any CSV • find_text_column)
Rohan Mehra — Backend FastAPI — Auth + Upload (JWT • /upload)
Sachchidanand — Backend — Pipeline + DB + Ranking (count×negative%)
Shivang — Frontend — Core UI (App.jsx • vercel.json proxy)
Ram Ashish Ram — Frontend — Polish & Flow (Upload div • user_flow)

One review → Every aspect → Feeling per aspect → Overall Mixed → Ranked what to fix first + Proof  [italic #CBD5E1]
No hard-coded list • Pattern X is wobbly → X is ASPECT • Any product, any CSV  [muted]

[LIVE PROOF CARD RIGHT — REDESIGNED]
● LIVE  [green pill #DCFCE7]   Vercel + EC2 t3.small  [muted]
QR Vercel   [square light]   QR EC2 Health   [square light]
Frontend — customer-feedback-insight-system.vercel.app  [link #1F6FEB]
Backend — 3.109.121.85:8000/health  •  EC2 ap-south-1  [muted]
16,288 Training Rows  |  415 MB BERT Model  |  52–108 Reviews Tested  [numbers bold]
GitHub: Shaanworkspace / customer-feedback-insight-system  [muted]
[orange badge on card corner: USE CASE #7]
```

**Keywords (must appear):** Use Case #7, Shaan Yadav [LEAD], Team Lead, 8 members, customer-feedback-insight-system.vercel.app, 3.109.121.85:8000/health, 16,288, 415 MB, DMASTE, Pattern X is wobbly, No hard-coded list, Mixed

**Speaker Notes (30 sec):** "We are 8 members for Use Case #7 Sentiment Analysis. I am Team Lead Shaan Yadav for Model and AWS Deployment and pipeline owner. Our system extracts every aspect, per-aspect feeling, overall Mixed when positive and negative both present, and ranked what to fix first with proof. Both links are live — scan QR to verify."

**Marks:** #9 Collaboration — role clear + Use Case #7 visible.

**Design Hint:** `1920×1080`, Calibri Bold, orange badge 0.9×0.4 inch top-right of right card, lead name 11pt #1F6FEB + pills.

---

## Slide 2 — Problem → Solution — Mind Map (Bigger Text, English Only)

**Layout:** Light `bg-[#F8FAFC]`, top title bar with 02, split 50/50 cards left Problem red border, right Solution green border, bigger headings 10pt Bold.

**Visual:** Split cards, red dot bullets left, 5-step flow with › arrows right, example blue box with 3 chips.

**Text (Copy-Paste):**

```
[Top bar] 02 — Problem → Solution  |  USE CASE UNDERSTANDING • WHY MIXED MATTERS

LEFT CARD — PROBLEM — Businesses Struggle to Analyze Large Volumes of Customer Feedback  [red 10pt Bold PROBLEM]
Thousands of reviews, manual reading is impossible.
Mind Map Branches:
•  One review contains multiple feelings — "product excellent but delivery terrible" → single label fails.
•  Key concerns are unknown — which aspect (battery, armrest, delivery) how often, how negative?
•  Data is scattered — different CSV names (Review Text / comment / feedback), 1 to 5 columns.
•  Hard-coded list ["battery","delivery"] fails for new aspect armrest → returns Neutral → customer churn.
Impact: Mixed is missed → wrong ranking → fix wrong area → customer leaves. Manager sees Positive 80% but delivery 40% Negative is hidden.

RIGHT CARD — OUR SOLUTION — How We Broke Down Use Case #7 Sequentially  [green 10pt Bold]
Sequential Flow (Mind Map Horizontal):
01 Every Aspect (battery, delivery, armrest) → 02 Per-Aspect Feeling (Positive / Negative / Neutral) → 03 Overall (Pos+Neg → Mixed) → 04 Ranked (impact = count × negative% — ACT FIRST) → 05 Proof (5 real quotes)
Aim Oriented: aspect + per-aspect + Mixed + ranked + proof — model is 60%, our glue is 40%

Example: Review: "The product is excellent but delivery was terrible."
Chips: product → Positive  |  delivery → Negative  |  Overall → Mixed
Note: Pattern X is wobbly → X is ASPECT • Not list [battery] • No hard-coded values
```

**Keywords:** Large volumes, Mixed, product excellent but delivery terrible, aspect frequency, Review Text / comment / feedback, hard-coded list fails armrest → Neutral, count × negative%, ACT FIRST, Proof 5, X is wobbly → X is ASPECT

**Speaker Notes (40 sec):** "Problem is large volumes with mixed feelings and unknown key concerns, and scattered CSV names plus hard-coded lists that fail for new products. Our solution breaks the use case into five sequential steps from every aspect to proof, aiming for ranked concerns. Example shows product positive and delivery negative giving Mixed, detected by pattern not by list."

**Marks:** #1 Use Case Understanding.

**Design Hint:** Headings 10pt Bold red/green, body 8pt, branches with 6pt dot, example box `#F0F9FF` border `#BFDBFE`.

---

## Slide 3 — Architecture — Full Pipeline Mind Map (Most Important)

**Layout:** Light bg, top bar 03, top row 6 connected boxes, second row split left model merge + right why stack, bottom flow line.

**Visual:** 6 horizontal boxes each top color bar distinct (#0F1E33, #173F73, #1F6FEB, #10B981, #FF6B35, #EF4444) with › arrows.

**Text (Copy-Paste):**

```
[Top bar] 03 — Architecture — Full Pipeline Mind Map  |  ★ BEST SLIDE — 60 SEC DISCUSSION

Pipeline Row (Left to Right Mind Map):
[USER CSV] review_text mandatory — any name: Review Text / comment / feedback
→ [FRONTEND] Vercel — Upload CSV button click → user uploads CSV — vercel.json proxy /api → EC2 http (avoids https→http mixed-content block)
→ [BACKEND] FastAPI EC2 t3.small ap-south-1 — POST /upload — JWT Bearer — CORS vercel.app — RateLimiter 30/60s — api/main.py:cfa.api.main:app
→ [PREPROCESS] Column matching — find_text_column substring — clean strip lower — keep rating/date/country in attributes — 16,288 rows — drop -1 11,945
→ [BERT 5 LABELS] bert-base-uncased 110M — max_length 128 — offset_mapping — labels O / ASPECT / OPINION_POS / NEG / NEU — AutoModelForTokenClassification num_labels=5
→ [TRIPLETS & RANKING] aspect-opinion-sentiment triplets — Overall Mixed (Pos+Neg→Mixed) — Ranking impact = count × negative% — Proof 5 quotes — MySQL Aiven last 3 — Dashboard Pie/Bar/Top5

LEFT DETAIL — HOW WE BUILT MODEL — TWO MODELS MERGED & LABELED
•  Pre-trained English BERT: Wikipedia 2.5B + BookCorpus 800M — understands grammar, not our reviews — uncased merges Battery/BATTERY
•  Human Dataset DMASTE 7,524 → 28,233 → drop -1 (11,945 implicit like "It is good") → 16,288 explicit (POS 79% NEG 17% NEU 4%)
•  Merge → Fine-tune 5-label head AutoModelForTokenClassification num_labels=5 (Linear 768→5 random, Dropout 0.1, CrossEntropy) → bert_aste_final 416M (config.json + tokenizer.json + model.safetensors) → S3 s3://customer-sentiment-analysis-model-ap-south-1/bert_aste_final → EC2 /opt/customer-sentiment-analysis/model:ro
•  Pattern learned: X is wobbly → X is ASPECT — armrest never seen also found ✓ — No hard-coded list — Single model for any product
[Box light] BERT (English) + DMASTE (labels) → Fine-tune 2 epochs T4 lr 2e-5 → 416M model → S3 → EC2

RIGHT DETAIL — WHY THIS STACK? WHY NOT OTHERS?
EC2 t3.small 2GB ✓ — t3.micro 1GB OOM 1.3G (415M+800M → kill 137)
Lambda ✗ — 250M limit, BERT 416M fails
SageMaker ✗ — overkill 10-day demo 10× cost
ECS/K8s ✗ — 1 container, EC2 simple
BERT-base 110M ✓ — large 340M needs 8GB OOM
CPU whl/cpu ✓ — No 3GB CUDA (cudnn 553M + triton)
HEALTHCHECK + restart unless-stopped ✓

Flow: CSV → Vercel proxy (no mixed-content) → EC2:8000 → Preprocess → BERT 128 → Triplets → Mixed → count×neg → Proof → MySQL → Dashboard
```

**Keywords:** Upload CSV button, vercel.json proxy, FastAPI EC2 t3.small, POST /upload, JWT, find_text_column, max_length 128, offset_mapping, O/ASPECT/OPINION_POS/NEG/NEU, AutoModelForTokenClassification, 7,524→16,288, drop -1 11,945, leakage 0, S3, /opt/.../model:ro, X is wobbly → X is ASPECT, t3.micro OOM 1.3G, Lambda 250M, HEALTHCHECK

**Speaker Notes (60 sec):** "This is our best slide. User clicks Upload CSV on frontend, Vercel proxies to EC2 to avoid mixed content. Backend receives POST with JWT, preprocess matches any column name, then BERT with 5 labels and offset mapping predicts triplets, we compute Mixed and rank by impact. Left shows we merged English BERT with DMASTE human data to get 416M model. Right answers why we chose t3.small over micro and why not Lambda or SageMaker."

**Marks:** #2 Architecture + #3 Innovation — 2 minutes discussion on why.

**Design Hint:** 6 boxes each 1.95 inch wide, arrows 0.2 inch, detail boxes 3.15 inch high, word wrap, no overflow.

---

## Slide 4 — Data — From Where & What is Data (No Extra)

**Layout:** Light bg, 3-column cards: Left source human, Middle 5 labels, Right any CSV test.

**Visual:** Horizontal flow 7,524 → 28,233 → -11,945 → 16,288 with ›, distribution bars POS/NEG/NEU, chip pills vertical.

**Text (Copy-Paste):**

```
[Top bar] 04 — Data — From Where & What is Data  |  BREADTH OF SAMPLE DATA • 5 LABELS

LEFT CARD — SOURCE 1 — TRAINING (HUMAN-LABELED)
DMASTE • 7,524 reviews  [SilvioLima/raw_data — Hugging Face]
Each review has 3–4 triples human-written: (battery, drains fast, NEG)
Flow: 7,524 → flatten 28,233 → drop aspect=-1 11,945 (implicit "It is good" no span) → 16,288 explicit
Split: review-level Train 4,055 / Val 1,014 / Test 1,268 — leakage 0 (set(train) ∩ set(test)=0) — random_state 42 reproducible
Distribution — BIASED: POS 79% (12,944) long green bar | NEG 17% (2,736) red bar | NEU 4% (608) orange small bar
Note: BIASED  POS 20× NEU → model favours POS → Accuracy 79% by guessing POS → we use weighted F1. No span keep would teach good→ASPECT wrong.
Small box: Amazon 21,214 (Kaggle Dongrelaxman) — demo only, NO aspect label → cannot train token model — isliye DMASTE chosen.

MIDDLE CARD — 5 LABELS PER TOKEN
O Other — is, the, was (90% tokens) light grey
ASPECT — battery, armrest, delivery, fabric (blue)
OPINION_POS — great, excellent, amazing (green)
OPINION_NEG — terrible, wobbly, drains fast (red)
OPINION_NEU — okay, average, fine (orange)
Example: "Battery is great but armrest is wobbly" → Battery=ASPECT, great=OPINION_POS, armrest=ASPECT, wobbly=OPINION_NEG

RIGHT CARD — ANY CSV WORKS (SAME MODEL)
bluetooth_speaker 48 rows 4 cols (review_text, rating, date, country) — 8 concerns
office_chair 52 rows 3 cols (no date → Trend empty test) — armrest wobbly
smartwatch 55 rows 5 cols (+product) — strap
PLUS 100+ ROWS: coffee_maker 105 (1-col), running_shoes 102 (2-col), gaming_headset 108 (3-col) → same model any product
Note: find_text_column accepts any name (Review Text / comment / feedback) substring. Only 1 column mandatory review_text.
```

**Keywords:** DMASTE 7,524, SilvioLima/raw_data, 28,233, drop -1 11,945, 16,288, leakage 0, POS 79% NEG 17% NEU 4%, BIASED, Amazon 21,214 demo only, O/ASPECT/OPINION_*, Battery is great but armrest is wobbly, find_text_column, 48/52/55/105/102/108

**Speaker Notes (40 sec):** "First model is English BERT from Wikipedia, second dataset is human DMASTE with 7,524 reviews flattened to 16,288 after dropping implicit. It is biased 79% positive so we use weighted F1. Amazon 21k is demo only without labels. We use 5 labels per token and test on 6 datasets from 1 to 5 columns with same model."

**Marks:** #2 Breadth + #5 Technical.

**Design Hint:** Distribution bars 2.95 inch bg + 2.33/0.5/0.12 fills, chip pills 1.15 inch, flow arrows.

---

## Slide 5 — Model Comparison — TF-IDF vs BERT + WHY F1 + Future Improvements

**Layout:** Light bg, split left TF-IDF red, center arrow, right BERT green with metric bars, bottom why F1 box.

**Visual:** Left bar 0.45 red short, right bars ASPECT 0.76 green long + others, center → +0.23.

**Text (Copy-Paste):**

```
[Top bar] 05 — Model Comparison — TF-IDF vs BERT  |  INNOVATION • PERFORMANCE • WHY F1

LEFT CARD — BEFORE — TF-IDF + LOGISTIC (WORD COUNT)
Word Count → 1 Label Per Review
•  Counts battery 1 great 1 terrible 1 — loses order — "wobbly near armrest" unknown
•  Needs list ["battery"] → armrest not in list → returns Neutral
•  Mixed miss: product good + delivery bad → only 1 label
•  Scores: Accuracy 0.71 F1 0.45 (POS 79% tricks accuracy) 1.35 MB fast but wrong
Bar: ASPECT F1 0.45 red
Note: Fixed list fails tomorrow's product "strap"

CENTER: → +0.23  +51% better  →  Pattern > List  [green]

RIGHT CARD — NOW — BERT 5-LABEL TOKEN (WE USE)
bert-base-uncased 110M + 5 heads → every token — review-level split leakage 0 — 2 epochs T4 — lr 2e-5 — AutoModelForTokenClassification
•  Reads both ways bidirectional — wobbly near armrest → ASPECT
•  Pattern X is wobbly → X is ASPECT even unseen ✓
•  Mixed 100% catch: battery Positive + delivery Negative → Mixed
Scores Bars: ASPECT 0.76 (aim >0.80) | OPINION_POS 0.81 | OPINION_NEG 0.72 | OPINION_NEU 0.57 (low because 608 rows) | Weighted F1 0.875 main | Gap <0.05 no overfit via check_overfit
Footnote: Why BERT-base 110M not large 340M? 415M fits t3.small 2GB, large needs 8GB OOM. Backup distilbert 66M 250M F1 0.66 2× faster if EC2 slow.

BOTTOM BOX — WHY F1 NOT ACCURACY? & FUTURE IMPROVEMENTS
Why F1: FP waste (false battery top) vs FN hide (miss armrest → Neutral churn) — F1 = 2*P*R/(P+R) balances. Weighted F1 because bias 79% POS — accuracy 0.96 lies (O 90% → 0.96 even if ASPECT 0). Optimize ASPECT F1 0.76→0.80 + weighted, not accuracy. NEU alone not optimize (4% weight, weighted would drop 0.875→0.84).
Future Improvements (could not do in 2 epochs, now plan): 2 weeks Data NEU 608→2k POS 79%→53% balance clean dedup → 1 week Model 3 epochs class weight OPINION_NEU 3.0 lr 1e-5 → 3 days Logic nearest opinion (not first) → threshold 0.4 Recall 0.60→0.75 → 0.90 aim.
```

**Keywords:** TF-IDF loses order, list fails armrest → Neutral, Accuracy 0.71 F1 0.45, bert-base-uncased 110M, leakage 0, 2 epochs T4, X is wobbly, Mixed 100%, ASPECT 0.76 OPINION_NEU 0.57 Weighted 0.875 Gap <0.05, t3.small 2GB large 8GB OOM, FP vs FN, F1 2*P*R/(P+R), Weighted because bias, NEU 608→2k, nearest opinion

**Speaker Notes (40 sec):** "TF-IDF counted words and needed a list so armrest failed and mixed was missed with F1 0.45. BERT reads both ways and learns pattern so armrest is found, mixed is 100% and F1 is 0.76. We use weighted F1 not accuracy because bias makes accuracy lie, and we balance false positives that waste effort against false negatives that hide problems. Next we will augment neutral data and fix pairing to reach 0.90."

**Marks:** #3 Innovation + #6 Performance — explain F1 choice.

**Design Hint:** Metric bars light bg 3.35 inch + fills per value, bottom box light.

---

## Slide 6 — Thank You — All Links + Future Scope

**Layout:** Full dark `#0F1E33` with glow, big Thank You center, top 3 roadmap columns, middle reuse/monitoring dark cards, bottom white link card, team line.

**Visual:** Dark glow ovals, roadmap ticks ✓, link card white border.

**Text (Copy-Paste):**

```
[Top pill] ROADMAP • MONITORING • THANK YOU

What’s Next  [28pt Bold white]
We know laggings — we have fix for each • 3 months plan  [9pt #CBD5E1 italic]

Columns:
NOW (10 days) — t3.small 2GB • 16,288 rows • 2 epochs • F1 0.68 • Neutral 58% • first-opinion lag  [dark card]
NEXT 2 WEEKS — Data: NEU 608→2k • POS 79%→53% balance • clean dedup  [blue tick]
NEXT 1 MONTH — Model+Logic+Infra: 3-4 epochs • nearest opinion • HTTPS ALB • distilbert  [green tick]

REUSE — Same model for any product — No list, no code change — find_text_column handles any name — strap also found via pattern X is wobbly.  [dark #142B4A]
MONITORING — HEALTHCHECK + restart unless-stopped + CloudWatch /customer-sentiment-analysis/backend + [CFA] logs + curl -f localhost:8000/health no hardcode  [dark #142B4A]

Thank You  [26pt Bold white center]
Live Demo — Drag Any CSV • Q & A  [9pt #93C5FD italic center]

[White link card center 8.33 inch]
Frontend: customer-feedback-insight-system.vercel.app
Backend: 3.109.121.85:8000/health
Dataset 1: huggingface.co/datasets/SilvioLima/raw_data  (DMASTE 7,524 → 16,288)
Dataset 2: kaggle.com/datasets/dongrelaxman/amazon-reviews-dataset  (Amazon 21,214 demo)
GitHub: Shaanworkspace/customer-feedback-insight-system
[6.5pt #1F6FEB center]

Team: Shaan Yadav [LEAD] • Reekal Yadav • Shikhar • Sharad • Rohan Mehra • Sachchidanand • Shivang • Ram Ashish Ram  [6.5pt #94A3B8 center]
```

**Keywords:** NOW 10 days, NEXT 2 WEEKS NEU 608→2k, NEXT 1 MONTH nearest opinion HTTPS, REUSE same model, MONITORING HEALTHCHECK CloudWatch, Frontend link, Backend link, Dataset 1 DMASTE, Dataset 2 Amazon, GitHub, Shaan Yadav [LEAD]

**Speaker Notes (30 sec):** "We know current laggings and have a three month plan to fix data, model and infra while reusing same model for any product and monitoring via healthcheck. Thank you — all links are here for verification and demo — any questions?"

**Marks:** #8 Presentation + #9 Collaboration + Roadmap.

**Design Hint:** Dark `#0F1E33`, Thank You 26pt, link card white, roadmap cards 3.15 inch, footer 7/6.

---

## How To Use This MD With AI (Prompt Included Above)

1. Copy the entire **MASTER PROMPT FOR AI** block at top (from ``` to ```).
2. Paste into Gamma (gamma.app) → Create with AI → Paste → Generate 6 slides → Export PPTX.
3. Or Tome (tome.app) / Copilot PowerPoint / Beautiful.ai — same prompt.
4. Verify: Larger text (no 6pt where 8pt needed), no Hinglish, no overflow, Use Case #7 badge visible, Lead highlighted, mind map arrows intact. Export 1920×1080.
5. Local PPTX is ready: `/Users/shaanyadav/Desktop/Customer_Feedback_Insight_System_Final_7_Slides.pptx` (now 6 slides after update).

---

*This 6-slide PPT MD is the updated version from your feedback (2026-09-11): Lead highlight with [LEAD], live redesign with orange USE CASE #7 badge, no Hinglish, bigger text 8-9pt, mind-map sequential flow from Upload CSV → FastAPI → find_text_column → BERT fusion → ranking, data bias explained, TF-IDF vs BERT with why F1 + future, thank you with all 5 links + future scope. Old 7-slide version is preserved in git history c5b4bc1 → ec75975.*
