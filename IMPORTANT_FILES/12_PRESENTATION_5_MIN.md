# Project Presentation — 5 to 10 Minute Script (memorize the bold lines)

## 1. Project karta kya hai? (30 sec)
**"My project reads thousands of customer reviews and tells the business three things: are customers happy, which exact aspect is the problem, and what to fix first — with real customer quotes as proof."**
Upload a CSV, get pie charts, ranked concerns like battery 87 percent negative, and quotes. One review also works in the Analyzer.

## 2. Problem kya thi? (30 sec)
**"Reading reviews manually is impossible, star ratings hide the real issue, and simple positive-negative tools miss Mixed feelings and new aspects."**
Example: "product excellent but delivery terrible" is both happy and angry — old tools pick one side.

## 3. Solve kaise kiya — parts me divide karke (4 min, har part 30-40 sec)
Say: **"I split the solution into 5 parts and connected them one by one."**

**Part 1 — Data.** "Public DMASTE reviews, 7,524 reviews became 16,288 aspect rows after dropping hidden ones. Review-level split so no leakage."

**Part 2 — Model.** "Fine-tuned bert-base-uncased for token classification with 5 labels — O, aspect, and three opinion types. Tokenizer 128, 2 epochs on T4. Weighted F1 about 0.875 per our docs."

**Part 3 — Backend.** "FastAPI with JWT auth, rate limits, and strict validation. One endpoint analyzes a review, one uploads CSV. Model loads once and stays in memory."

**Part 4 — Logic.** "Each aspect gets a feeling, Mixed rule catches both-sides reviews, ranking is count times negative percent, proof quotes attached."

**Part 5 — Screen + Server.** "React dashboard with charts on Vercel, Docker backend on EC2 t3.small, MySQL saves last 3 analyses per user."

## 4. Connect karke dikhao (1 min)
**"CSV drops on Vercel, proxy sends it to EC2, text is cleaned, BERT finds aspects in 128 tokens, rules make Mixed, ranking orders fixes, MySQL stores, dashboard draws — one straight line, no black boxes except the honest 110M-parameter BERT."**

## 5. Challenges + honesty (1 min)
**"Three real fights: hidden rows broke labeling so we dropped 11,945; the tiny server ran out of memory so we moved micro to small; the browser blocked mixed content so we proxied /api. And honestly: our retrieval is word overlap, not vector RAG, and confidence 0.85 is a constant — my planned upgrades."**

## 6. Closing line (10 sec)
**"One review in, aspects plus Mixed plus ranked fix out — explainable, deployed, and demo-ready."**

## Slide hints (if asked to present slides)
1 Title + one-line + live links. 2 Problem + Mixed example. 3 Architecture diagram (5 boxes). 4 Model (5 labels, 128, 2 epochs, F1). 5 Demo screenshot (battery 87.5%). 6 Honesty + roadmap (NEU rows, HTTPS, vector RAG).
