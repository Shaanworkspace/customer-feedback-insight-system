# Customer Feedback Insight System — 6-Slide Professional PPT | KIET × Cognizant Hackathon — Use Case #7

> **6 slides × 45 sec = 4.5 min + 2 min live demo + 1 min Q&A = 7.5 min.** Professional, English only, larger text, no overlap, no Hinglish. Give the **MASTER PROMPT** below to any AI (Gamma, Tome, Copilot, Beautiful.ai) → it builds the PPT. Every slide has `Layout`, `Visual`, `Text (Copy-Paste)`, `Keywords (must appear)`, `Speaker Notes`, `Marks`, `Design Hint`.

> **Links:** Frontend `https://customer-feedback-insight-system.vercel.app` | Backend `http://3.109.121.85:8000/health` | GitHub `https://github.com/Shaanworkspace/customer-feedback-insight-system` | Datasets: DMASTE `https://huggingface.co/datasets/SilvioLima/raw_data` + Amazon `https://www.kaggle.com/datasets/dongrelaxman/amazon-reviews-dataset`

---

## MASTER PROMPT FOR AI — COPY-PASTE ENTIRE BLOCK BELOW TO GAMMA/TOME/COPILOT (ULTRA-DETAILED — EVERY MIND-MAP EDGE EXPLAINED)

```
Create a 6-slide professional PowerPoint 16:9 (13.33×7.5 inches) for KIET × Cognizant Hackathon Use Case #7: Customer Feedback Insight System — Sentiment Analysis of Customer Reviews.

GOAL: 6 slides that evaluator can tick against 9 criteria (Use Case Understanding, Architecture, Innovation, UI/UX, Code Quality, Model Performance, Deployment, Presentation, Collaboration). No Hinglish. All English. Larger readable text. Every mind-map edge must be drawn exactly as described — nothing implied.

DESIGN SYSTEM (STRICT — DO NOT DEVIATE):
- Canvas: 13.33 inch width × 7.5 inch height (1920×1080). Margins 0.4 inch all sides. Footer dark bar 0.32 inch at y=7.18 inch always.
- Colors: Background dark #0F1E33, accent #173F73, bright #1F6FEB, card #FFFFFF, border #E2E8F0, text dark #1E293B, muted #64748B, light #FFFFFF, success #10B981, danger #EF4444, warning #F59E0B, orange badge #FF6B35.
- Fonts: Calibri (fallback Montserrat). Slide title 22-28pt Bold, card title 10pt Bold, body 8-9pt Regular, caption 6.5-7pt, chip 6.5pt Bold. Word wrap ON, auto-size OFF, vertical anchor TOP, line spacing 1.05-1.1. No overflow — every textbox height must fit its text, no overlap (check x+width ≤13.33, y+height ≤7.18).
- Shapes: Rounded rectangle radius 0.08 inch, top color bar 4pt height, border 0.75pt #E2E8F0, arrow › 12pt Bold #1F6FEB or right-arrow shape fill #E2E8F0. Pill badge 0.22 inch height radius 0.11 inch.
- Each slide top: white card 12.53×0.58 inch at (0.4,0.30) with left number 14pt #1F6FEB + title 13-14pt #1E293B + right tag 6.5pt #64748B. Footer: dark bar 13.33×0.32 at (0,7.18) with left "KIET × Cognizant — Use Case #7 • Customer Feedback Insight System" 7pt #FFFFFF + right "X/6 Confidential" 7pt #FFFFFF. Top 3pt line #1F6FEB across width.
- Icons minimal (● › ★ ✓). No images needed — use QR placeholder squares light #F8FAFC border #E2E8F0 labelled "QR Vercel" / "QR EC2 Health".

PROMPT INSTRUCTION FOR AI: Read slides sequentially. For each slide, create every shape at exact position described, copy exact text (no rephrase), preserve line breaks, use exact colors/font sizes. Draw every arrow/connection listed under "MIND MAP EDGES" — those are the mind-map. Do not add Hinglish. Do not shrink text. Do not let text overflow outside shape.

CONTENT — 6 SLIDES (USE EXACT TEXT BELOW PER SLIDE + DRAW EDGES):

SLIDE 1 — COVER: Title + Team + Use Case #7 + Live Proof
Text: See Slide 1 Text Copy-Paste below (same). Must show:
- Top pill "KIET × COGNIZANT HACKATHON • AUGUST 2026 • USE CASE #7" 3.4×0.32 at (0.4,0.35) dark #1E3A5F, title "Customer Feedback" 30pt #FFFFFF at (0.4,0.95) + "Insight System" 30pt #60A5FA at (0.4,1.50) + subtitle "Sentiment Analysis of Customer Reviews" 11pt #CBD5E1 at (0.4,2.15) + underline 1.2 inch #1F6FEB at (0.4,2.52) + orange badge "USE CASE #7" 1.6×0.36 #FF6B35 at (6.2,2.05).
- Left team card dark #142B4A 7.8×3.05 at (0.4,2.85): title "TEAM — 8 MEMBERS" #93C5FD, then Shaan Yadav 9.5pt #1F6FEB at (0.65,3.28) + pill [LEAD] orange 0.62×0.22 at (2.85,3.30) + "— Team Lead • Model + AWS Deployment" #FFFFFF, then 7 other members in 2 columns (list exactly as per slide). Bottom note italic "One review → Every aspect → Feeling per aspect → Overall Mixed → Ranked what to fix + Proof" #CBD5E1.
- Right live card white 4.3×5.05 at (8.6,0.85) with dark header 4.3×0.58 #0F1E33: green pill ● LIVE #DCFCE7, "Vercel + EC2 t3.small" #93C5FD, "USE CASE #7 • LIVE PROOF" #FF6B35 orange, then 2 link boxes light #F8FAFC: Frontend URL + Backend 3.109.121.85:8000/health, then 2 QR squares 1.8×1.05, then stats row 16,288 / 415 MB / 108, then GitHub line, plus corner badge #7 orange 0.75×0.32 at (12.15,0.85). MIND MAP EDGES FOR SLIDE 1: None — this is cover, but visual hierarchy: Title (center) → connected to Team card (left) and Live Proof card (right) — title is hub, two cards are spokes (no arrows, just spatial grouping).
Visual: dark background with 2 glow ovals at (9.5,-1.5) 5×5 #173F73 and (-1,5) 4×4 #1A3A6B.

SLIDE 2 — PROBLEM → SOLUTION (MIND MAP, BIGGER TEXT)
Title bar "02 — Problem → Solution" at (0.4,0.30). Split cards left 6.15×5.95 at (0.4,1.05) red top bar #EF4444, right 6.15×5.95 at (6.78,1.05) green top bar #10B981. Headings PROBLEM 10pt Bold #EF4444 at (0.7,1.22) and OUR SOLUTION 10pt #10B981 at (7.08,1.22) — must be bigger visible.
MIND MAP EDGES FOR SLIDE 2 — DRAW EXACTLY:
- LEFT PROBLEM MIND MAP: Central node "Businesses Struggle to Analyze Large Volumes of Customer Feedback" 9pt Bold at (0.7,1.52) — this is center. From center, 4 branch lines (use dot • or line) to 4 leaf nodes:
  Branch 1 → "One review contains multiple feelings — “product excellent but delivery terrible” → single label fails." at (0.88,2.26)
  Branch 2 → "Key concerns are unknown — which aspect (battery, armrest, delivery) how often, how negative?" at (0.88,2.94)
  Branch 3 → "Data is scattered — different CSV names (Review Text / comment / feedback), 1 to 5 columns." at (0.88,3.62)
  Branch 4 → "Hard-coded list [“battery”,“delivery”] fails for new aspect armrest → returns Neutral → customer churn." at (0.88,4.30)
  Then leaf 4 connects down to Impact box red 5.55×1.05 at (0.7,5.15): "Impact: Mixed missed → wrong ranking → fix wrong area → customer leaves. Manager sees Positive 80% but delivery 40% Negative hidden." — arrow from Branch 4 leaf to Impact box.
- RIGHT SOLUTION MIND MAP: Central sequential chain 01→02→03→04→05 left-to-right at y=2.35 each 1.02×1.38 light #F8FAFC:
  Node 01 "Every Aspect (battery, delivery, armrest)" at (7.18,2.35) —CONNECT via › arrow (0.1 wide) to Node 02 "Per-Aspect Feeling (Positive/Negative/Neutral)" at (8.30,2.35) —CONNECT via › to Node 03 "Overall (Pos+Neg → Mixed)" at (9.42,2.35) —CONNECT via › to Node 04 "Ranked (impact = count × negative% — ACT FIRST)" at (10.54,2.35) —CONNECT via › to Node 05 "Proof (5 real quotes)" at (11.66,2.35). This chain is the mind-map spine.
  From Node 05, draw down arrow to Example box blue 5.55×1.55 at (7.08,3.95): "Review: The product is excellent but delivery was terrible." → splits to 3 chips: product→Positive green at (7.25,4.62), delivery→Negative red at (8.95,4.62), Overall→Mixed orange at (10.65,4.62) — these 3 chips are children of Example box (draw small connecting lines). Below chips note "Pattern: X is wobbly → X is ASPECT • Not list [battery]" at (7.25,5.02). Aim line at bottom "Aim: aspect + per-aspect + Mixed + ranked + proof — model 60%, our glue 40%" at (7.08,5.62).
Visual: red dots 7pt for branches, › arrows 12pt #1F6FEB.

SLIDE 3 — ARCHITECTURE — FULL PIPELINE MIND MAP (MOST IMPORTANT — DRAW EVERY CONNECTION)
Title bar "03 — Architecture — Full Pipeline Mind Map" ★ BEST at (0.4,0.30). Top pipeline row 6 boxes each 1.95×1.62 at y=1.05 starting x=0.4 step 2.15 with top color bars #0F1E33, #173F73, #1F6FEB, #10B981, #FF6B35, #EF4444, with right-arrow shapes 0.2×10pt #E2E8F0 between boxes. MIND MAP EDGES FOR SLIDE 3 — DRAW EXACTLY AS NUMBERED FLOW:
  Edge 1: USER CSV box (0.4,1.05) "review_text mandatory any name: Review Text / comment / feedback" —ARROW→ FRONTEND box (2.55,1.05) — label on arrow: "User clicks Upload CSV button, file selected" (6pt #64748B above arrow).
  Edge 2: FRONTEND box —ARROW→ BACKEND box (4.70,1.05) — label: "vercel.json proxy /api → EC2 http avoids https→http mixed-content block + POST /api/v1/upload multipart/form-data" .
  Edge 3: BACKEND box "FastAPI EC2 t3.small POST /upload JWT Bearer CORS vercel.app RateLimiter 30/60s api/main.py:cfa.api.main:app" —ARROW→ PREPROCESS box (6.85,1.05) — label: "JWT verified, file bytes received" .
  Edge 4: PREPROCESS box "find_text_column substring, clean strip lower, keep rating/date/country in attributes, 16,288 rows, drop -1 11,945, leakage 0" —ARROW→ BERT 5 LABELS box (9.00,1.05) — label: "cleaned texts + offset_mapping" .
  Edge 5: BERT box "bert-base-uncased 110M max_length 128 offset_mapping O/ASPECT/OPINION_POS/NEG/NEU AutoModelForTokenClassification num_labels=5" —ARROW→ TRIPLETS & RANKING box (11.15,1.05) — label: "logits argmax per token → triplets" .
  Edge 6: Inside TRIPLETS box: "aspect-opinion-sentiment triplets → Overall Mixed (Pos+Neg→Mixed) → Ranking impact = count × negative% → Proof 5 quotes → MySQL Aiven last 3 → Dashboard Pie/Bar/Top5" — this is internal mini-chain, draw as vertical stack inside box.
Second row: LEFT DETAIL box 6.15×3.15 at (0.4,2.85) titled "HOW WE BUILT MODEL — TWO MODELS MERGED & LABELED" — its internal mind map: Node A "Pre-trained English BERT Wikipedia 2.5B + BookCorpus 800M — understands grammar, not reviews" —MERGE (plus icon) → Node B "DMASTE 7,524 → 28,233 → drop -1 11,945 → 16,288 explicit POS79% NEG17% NEU4%" —ARROW→ Node C "Fine-tune 5-label head Linear 768→5 random, Dropout 0.1, CrossEntropy → bert_aste_final 416M → S3 s3://customer-sentiment-analysis-model-ap-south-1/bert_aste_final → EC2 /opt/.../model:ro" —ARROW→ Node D "Pattern X is wobbly → X is ASPECT — armrest unseen also found — no hard-coded list — any product" — draw these 4 nodes vertically stacked with arrows.
  RIGHT DETAIL box 6.15×3.15 at (6.78,2.85) titled "WHY THIS STACK? WHY NOT OTHERS?" — list rows 6 lines with ✓/✗: EC2 t3.small 2GB ✓ vs t3.micro 1GB OOM 1.3G ✓, Lambda ✗ 250M, SageMaker ✗ overkill, ECS/K8s ✗ 1 container, BERT-base 110M ✓ vs large 340M 8GB OOM, CPU whl/cpu ✓ vs 3GB CUDA 553M, HEALTHCHECK ✓ — each row is leaf, no arrows, just list.
Bottom flow line centered at (0.4,6.18): "Flow: CSV → Vercel proxy (no mixed-content) → EC2:8000 → Preprocess → BERT 128 → Triplets → Mixed → count×neg → Proof → MySQL → Dashboard" 6.5pt #64748B italic.

SLIDE 4 — DATA — FROM WHERE & WHAT IS DATA (NO EXTRA)
Title bar "04 — Data — From Where & What is Data" at (0.4,0.30). Three cards: Left 4.15×5.95 at (0.4,1.05), Middle 3.85×5.95 at (4.75,1.05), Right 4.15×5.95 at (8.78,1.05).
MIND MAP EDGES FOR SLIDE 4:
- LEFT CARD DATA FLOW MIND MAP: Start node "DMASTE • 7,524 reviews [SilvioLima/raw_data]" at (0.65,1.42) —ARROW→ "flatten" node "28,233" at (1.60,2.35) —ARROW→ "drop aspect=-1 11,945 (implicit It is good no span)" at (2.55,2.35) —ARROW→ "16,288 explicit" at (3.50,2.35). Each arrow is ›. Then from "16,288 explicit" —ARROW down→ "Split review-level leakage 0: Train 4,055 Val 1,014 Test 1,268 set(train)∩set(test)=0" box light at (0.65,3.15). Then from that —ARROW down→ "Distribution — BIASED" at (0.65,4.12) which branches to 3 bars: POS 79% (12,944) green long 2.33 inch, NEG 17% (2,736) red 0.5 inch, NEU 4% (608) orange 0.12 inch at y 4.38/4.62/4.86 — each bar is leaf of Distribution. Then from Distribution —ARROW down→ note "POS 20× NEU → favours POS → Accuracy 79% by guessing → we use weighted F1" at (0.65,5.15). Plus small box at (0.65,5.62) "Amazon 21,214 demo only NO aspect label" — this is sibling, not connected, placed bottom.
- MIDDLE CARD 5 LABELS: Vertical list 5 chips at x=5.0 y 1.48 step 0.88 each 1.15×0.72: O light grey, ASPECT blue #1F6FEB, OPINION_POS green, OPINION_NEG red, OPINION_NEU orange — each chip is node, no arrows, just list. From list —ARROW down→ Example box light at (5.0,6.05): "Battery is great but armrest is wobbly → Battery=ASPECT great=OPINION_POS ..." — this is child of list.
- RIGHT CARD ANY CSV: 3 dataset nodes vertical at (9.03,1.52) step 1.05 each 3.65×0.85 light: bluetooth_speaker 48 rows, office_chair 52 rows, smartwatch 55 rows — each is leaf, then from those —ARROW down→ plus box 3.65×1.02 at (9.03,4.78): "PLUS 100+ ROWS coffee_maker 105 (1-col) running_shoes 102 (2-col) gaming_headset 108 (3-col) same model any product" — then —ARROW down→ note "Only 1 column mandatory review_text" green at (9.03,5.88). Edges: datasets → plus box → note is chain.
Visual: bars 2.95 bg + fills, chip pills, flow arrows ›.

SLIDE 5 — MODEL COMPARISON — TF-IDF vs BERT + WHY F1 + FUTURE
Title bar "05 — Model Comparison — TF-IDF vs BERT" at (0.4,0.30). Split left 4.05×5.95 at (0.4,1.05) red border, center arrow 1.25 wide at (4.55,2.95), right 6.38×5.95 at (6.55,1.05) green border, bottom boxes two small at y=4.28 and 4.95.
MIND MAP EDGES FOR SLIDE 5:
- LEFT TF-IDF SUB-TREE: Root "TF-IDF + LOGISTIC Word Count → 1 Label Per Review" at (0.65,1.42) — branches to 4 leaves: "Counts battery 1 great 1 terrible 1 loses order" at (0.65,1.72), "Needs list [battery] → armrest → Neutral" at (0.65,2.04), "Mixed miss product good+delivery bad → 1 label" at (0.65,2.36), "Scores Accuracy 0.71 F1 0.45 POS79% tricks 1.35MB" at (0.65,2.68) — then from leaves —ARROW down→ bar "ASPECT F1 0.45" red 1.6 inch at (0.65,3.32) — then —ARROW down→ note "Fixed list fails tomorrow strap" at (0.65,3.72) — then —ARROW down→ bottom box light orange at (0.65,4.28): "WHY IT FAILED — TESTING Precision 0.51 Recall 0.40 → F1 0.45 WHY F1 not Accuracy Accuracy 0.71 looks ok but POS79% bias →0.79 by guessing POS FP waste vs FN churn F1 balances 2*P*R/(P+R)".
- CENTER BRIDGE: Big arrow from left bar at (4.85,3.95) 0.65×14pt green #10B981 pointing right to right card, with top label "→ +0.23 +51% better" 14pt green at (4.55,2.95) and "Pattern > List" 6.5pt #64748B at (4.55,4.32) — this edge connects LEFT subtree to RIGHT subtree.
- RIGHT BERT SUB-TREE: Root "BERT 5-LABEL TOKEN bert-base-uncased 110M → every token leakage 0 2 epochs T4" at (6.8,1.42) — branches to 4 leaves: "Reads both ways wobbly near armrest → ASPECT" at (6.95,1.72), "Pattern X is wobbly → X is ASPECT even unseen ✓" at (6.95,2.00), "Mixed 100% battery Positive+delivery Negative →Mixed" at (6.95,2.28), "Weighted F1 0.875 ASPECT 0.76 Gap<0.05 no overfit" at (6.95,2.56) — then from leaves —ARROW down→ metric bars section at (6.8,2.92) titled "SCORES — PER LABEL F1": 4 bars ASPECT 0.76 green 2.9 inch, OPINION_POS 0.81, OPINION_NEG 0.72 red, OPINION_NEU 0.57 orange at y 3.18 step 0.36 — each bar leaf of Scores. Then —ARROW down→ footnote "Why BERT-base 110M not large 340M 415M fits t3.small 2GB large needs 8GB OOM" at (6.8,4.72) — then —ARROW down→ future box blue at (6.8,4.95): "FUTURE IMPROVEMENTS 2 weeks Data NEU608→2k POS79%→53% balance, 1 week Model 3 epochs class weight NEU 3.0, 3 days Logic nearest opinion not first → threshold 0.4 Recall 0.60→0.75 aim 0.90".
Visual: red vs green cards, metric bars light bg #E2E8F0.

SLIDE 6 — THANK YOU — ALL LINKS + FUTURE SCOPE
Title pill "ROADMAP • MONITORING • THANK YOU" at (0.4,0.35) #93C5FD. Heading "What's Next" 28pt #FFFFFF at (0.4,0.75) + subtitle "We know laggings — we have fix for each • 3 months plan" #CBD5E1 at (0.4,1.35).
MIND MAP EDGES FOR SLIDE 6:
- TOP ROADMAP ROW: 3 columns at y=1.85 each 3.15×1.48 with top bars #1E293B, #1F6FEB, #10B981: NOW (10 days) dark at (0.4,1.85) "t3.small 2GB 16,288 rows 2 epochs F1 0.68 Neutral 58% first-opinion" —CONNECT via no arrow but sequence left→middle→right: NOW → NEXT 2 WEEKS at (3.75,1.85) "Data: NEU 608→2k POS79%→53% balance clean dedup" with blue tick ✓ at (5.10,3.08) —CONNECT → NEXT 1 MONTH at (7.10,1.85) "Model+Logic+Infra 3-4 epochs nearest HTTPS ALB distilbert" green tick. These 3 are sequential timeline left→right.
- MIDDLE ROW: 2 cards dark #142B4A at (0.4,3.58) and (6.78,3.58) each 6.15×1.12:
  Left "REUSE — Same model for any product — No list, no code change — find_text_column handles any name — strap also found via pattern X is wobbly." — this is child of ROADMAP (arrow from roadmap down to reuse).
  Right "MONITORING — HEALTHCHECK + restart unless-stopped + CloudWatch /customer-sentiment-analysis/backend + [CFA] logs + curl -f localhost:8000/health no hardcode" — also child of roadmap, parallel.
- CENTER: Big "Thank You" 28pt #FFFFFF at (0.4,4.92) centered 12.53 wide — this is hub, with "Live Demo — Drag Any CSV • Q & A" 9pt #93C5FD at (0.4,5.42) as sub.
- BOTTOM LINK CARD white 10.33×0.62 at (1.5,5.75) border #E2E8F0: "Frontend: customer-feedback-insight-system.vercel.app • Backend: 3.109.121.85:8000/health • Dataset: huggingface.co/datasets/SilvioLima/raw_data • kaggle.com/datasets/dongrelaxman/amazon-reviews-dataset • GitHub: Shaanworkspace/customer-feedback-insight-system" 6.5pt #1F6FEB centered — child of Thank You (arrow from Thank You down to links).
- TEAM LINE at (0.4,6.52) "Team: Shaan Yadav [LEAD] • Reekal ... " #94A3B8 — sibling of link card, no arrow.
- Footer 6/6 dark.

CRITICAL RULES FOR AI RENDERING MIND MAPS:
- Every "→" above must be a visible arrow shape (right-arrow or › 12pt) connecting the two boxes' centers horizontally or vertically as described (left→right or top→bottom). Do not omit any edge.
- Every box's position and size must match Inches coordinates given so no overlap. Test x+width and y+height.
- Every text must be word-wrapped inside its box, never overflow. If text longer, make textbox taller but keep x,y.
- No Hinglish anywhere — all English.
- Larger text: body minimum 6.5pt but branches 7-8pt, headings 10pt Bold.

Use this prompt exactly — do not summarize. Copy slide texts verbatim from SLIDE 1-6 TEXT COPY-PASTE sections below in this file.
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
