# Customer Feedback Insight System — Project Spec

Live discussion doc. Jo cheezein final ho gayi hain wahi add hote hain.

## 1. Product (one-liner)

> Amazon reviews ka sentiment + key concern identification.
> Bakiyon se alag: wo bolte hain "customers kya keh rahe hain", hum bolte hain "kya karna hai — proof ke saath, priority ke hisaab se."

## 2. Positioning (interview-ready)

- **Not a scraper, not a plugin.** Ye ek analytics engine hai jo kisi bhi company ke apne reviews ko samajhta hai.
- Amazon dataset (public academic, McAuley corpus) sirf **training data** hai — legally use hota hai, scraping nahi.
- Production me company apne reviews daalti hai — apni website, app store, tickets. Source-agnostic (CSV / API / upload).
- **Competitor gap filled:** tools sirf data dikhate hain / toolkit dete hain / enterprise (crore). Hum mid-size brands (SMB) ke liye ready web product dete hain.

## 3. Delivery model

| Deliverable | Kya hai |
|---|---|
| Web app (dashboard) | Reviews upload karo → charts, top concerns, recommendations. Non-tech users. |
| REST API | `POST /api/v1/upload`, `GET /api/v1/stats` — developers integrate karein. |
| SDK (optional, later) | Chhota code snippet for devs. |

## 4. Flow — batch upload (CSV, ~minutes)

1. CSV upload → validation + cleaning (empty/short/duplicate remove)
2. **LLM pipeline (Groq + Llama):**
   - Batching: 25-30 reviews per call (parallel, retry, fallback)
   - LLM returns entities + sentiment + confidence per review (JSON)
3. Analysis module:
   - Merge same-meaning phrases (LLM already handles most)
   - Filter: support (≥5) + discrimination (negative ratio > overall)
   - Count + registry grow + old reviews re-analyze
4. RAG: har concern ke 3 proof quotes
5. Ranking compute (impact = count × negative_pct, normalized 0-100)
6. Backend save → concern_stats.json
7. Dashboard render: total, distribution, top concerns, representative reviews

## 5. Uniqueness (2 cheezein)

1. **Action-first:** "Battery pehle fix karo — 78% negative, priority 1. Camera chhodo."
2. **Evidence:** har concern ke saath asli review quotes (RAG se).

## 6. Entity precision — CRITICAL (finalized)

Static lexicon = project ki death. System ko **khud** pata karna chahiye comment kya bol raha hai.

### 6.1 Problems
- "fingerprint camera bekaar" → **2** entities (fingerprint + camera)
- "fingerprint sensor bekaar" → **1** entity (fingerprint sensor)

### 6.2 Rules (finalized — 4 core + need to verify)
1. **Compound noun detect:** adjacent NOUN+NOUN = 1 entity ("fingerprint sensor")
2. **Conjunction split:** comma/and = alag entities ("fingerprint, camera" = 2)
3. **Subsumption:** short mention → registered compound ("fingerprint" → "fingerprint sensor")
4. **Confidence score:** har entity ke saath pakka-ness (0-1)

### 6.3 Dynamic discovery (finalized concept — optimized)
- **Zero seed** — koi fixed lexicon nahi. Pehla step khud entities extract karta hai
- **Extract:** POS noun-phrases (compound = 1, conjunction = 2)
- **Merge:** TF-IDF + cosine similarity — same-meaning phrases ek concern ("battery life" ≈ "battery")
- **Filter 1 (support):** ≥5 reviews me aaye
- **Filter 2 (discrimination):** phrase ka negative ratio > overall negative ratio — tabhi problem hai
- **Incremental:** sirf naye reviews process, old counts save → 1M reviews minutes me
- **NMF fallback:** hidden topics jo ek noun phrase me nahi aate
- Global registry (`concern_registry.json`) grow hota hai
- Naya concern aane par purane reviews re-analyze
- Output: `things_mentioned` + `aspects[]` (entity + sentiment + confidence)

### 6.4 LLM (finalized decision — 6.3 implement karna asan)

Complex NLP khud nahi likhenge — **open-source LLM use karenge**:
- **Groq API + Llama 3.3 70B** — free tier, 1-2 sec response, no GPU needed
- LLM karta hai: entity extraction + merge + sentiment + confidence (ek JSON me)
- **Batching:** 25-30 reviews per call (1000 ek saath NEVER — context limit + JSON tootega)
- **Parallel:** batches groups me saath chalta hai → 1000 reviews ~30 sec
- **Retry:** broken JSON batch 1 baar retry
- **Fallback:** rule-based logic (no internet needed) — LLM down to system chalta hai
- **LLM Nahi karega:** counting, ranking formula, RAG, save, charts — sab Python
- Output: `aspects[]` (entity + sentiment + confidence) with index per review

### 6.5 Precision quality check
- Labeled data pe precision/recall test karna hai — interview me bolna

## 7. Tech stack (finalized)

- Backend: Python 3.11, FastAPI, pandas
- LLM: Groq API + Llama 3.3 70B (open source, free tier) + rule-based fallback
- Analysis: scikit-learn (TF-IDF + cosine similarity) for merge/RAG
- Frontend: React (Vite) + Recharts
- Deploy: Render (free tier), CI: GitHub Actions

## 8. Team (finalized)

| Module | Kya hai |
|---|---|
| llm/ | batching, parallel, retry, fallback |
| analysis/ | concerns, stats, rag |
| ranking/ | priority |
| api/ | endpoints + deploy |
| frontend/ | UI |

## 9. Coding rules (AGENTS.md)

- No extra code, no extra styling, no unused lines/words
- Contracts frozen — field names mat todo, sirf optional add karo
- Modular, one module = one job

## 10. Current status

### Done
- Repo + CI + Render config + gitignore
- Frontend (Dashboard/Explorer) + backend (FastAPI) — running on mocks
- Ranking formula, tests (5 pass)
- LLM decision finalized: Groq + Llama, batching (25-30), parallel, retry, fallback (docs me)

### Not built yet
- LLM module (batching + parallel + retry + fallback)
- Real RAG index
- Real concern_stats
- Dynamic entity discovery (abhi mock hai — LLM se replace hoga)
- CSV upload endpoint + UI
- Render deploy + live URL
- Login/auth
- End-to-end demo