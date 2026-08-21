# User Flow — Step by Step (for presentation)

This document explains **exactly what a user sees and clicks**, and **what happens in the system on each click**. Use it when you have to stand in front of a judge or a class and explain the product live.

The app has four main screens: **Landing → Login → Upload → Dashboard**. There are also two side screens: **Analyzer** and **Explorer**.

The flow is controlled by the browser's address bar. When you move between screens, the app saves `?view=dashboard` in the URL. That is why the browser's **Back** and **Forward** buttons work.

---

## Step 1 — Landing page (first thing on screen)

**What the user sees:**
- A glassy header at the top with the project logo and the name "Customer Feedback Insight System".
- A big hero section that says: *"Upload the reviews you already have. We find what customers hate, why they hate it, and what to fix first."*
- A button that says **"Start free"**.

**What the user does:** clicks **"Start free"**.

**What happens in the background:**
- The code calls `navigate('login')`.
- That changes the URL to `?view=login` and shows the Login screen.
- Nothing is sent to the backend yet. This is just moving between pages on the frontend.

**What to say out loud:** *"The user lands on our home page and clicks Start free to begin."*

---

## Step 2 — Login page

**What the user sees:**
- A clean card that says "Sign in".
- (In this demo, any input works — there is no real password check. It is a hackathon demo, not a security system.)

**What the user does:** types anything and clicks **"Continue"** (or presses Enter).

**What happens in the background:**
- The code sets a small flag in the browser: `signedIn = true`.
- Then it calls `navigate('upload')`, so the URL becomes `?view=upload`.
- The Upload screen appears.

**What to say out loud:** *"They sign in, and we take them to the upload screen."*

---

## Step 3 — Upload page (the important one)

**What the user sees:**
- A box that says **"Upload your reviews"**.
- A dashed area where you can drop a CSV file, or click to choose one.
- Two big buttons at the bottom:
  - **Upload & Continue ON LOCAL** (talks to `http://localhost:8000`)
  - **Upload & Continue ON DEPLOYED** (talks to the live cloud backend)
- Below that, three small cards explaining: "Drop your CSV", "AI reads everything", "See what to fix".

**What the user does:** picks a CSV file, then clicks one of the two buttons.

**What happens in the background (this is the key part):**

1. The app checks the file ends with `.csv`. If not, it shows an error and stops.
2. It remembers which button you pressed and sets the backend address:
   - LOCAL button → backend = `http://localhost:8000`
   - DEPLOYED button → backend = `https://cfa-api.onrender.com`
3. It calls `onStart()`. That immediately:
   - opens the **Dashboard** screen, and
   - tells the Dashboard: *"still working, show the loading skeleton"* (`analyzing = true`).
   - So the user sees the dashboard right away with grey placeholder boxes — they do not stare at a blank screen.
4. In the background, the app sends the CSV file to the backend with a network request: `POST /api/v1/upload`.
5. The backend reads the whole file, analyzes every row, and saves the results (explained in `internal_flow.md` and `backend.md`).
6. When the backend finishes and replies, the app calls `onDone()`. That:
   - turns off the loading state (`analyzing = false`), and
   - bumps a counter (`reloadKey`) so the Dashboard fetches fresh data.
7. The Dashboard now fills in: real numbers, real charts, real reviews.

**What to say out loud:** *"They pick a CSV and hit upload. We open the dashboard instantly with a loading state, then stream the real analysis in. No fake numbers — everything comes from their file."*

---

## Step 4 — Dashboard (where the insight appears)

**What the user sees (top to bottom):**
1. A row of KPI cards: total reviews, positive count, negative count, top concern.
2. A **Sentiment** chart (a pie or bar showing positive vs negative).
3. A **Priority Concerns** list — the most important problems first, each with an "impact" score and a red/grey bar.
4. Three charts side by side:
   - **Rating Distribution** (how many 1-star, 2-star, … 5-star).
   - **Reviews Over Time** (how many reviews per year).
   - **Market by Country** (which countries the reviewers are from).
5. A **Review Explorer** table where you can filter reviews.
6. Every concern in the list has a **"View Comments"** button.

**What happens in the background:**
- As soon as the loading finishes, the Dashboard runs two fetch calls at the same time:
  - `GET /api/v1/stats` → gets all the numbers and charts data.
  - `GET /api/v1/reviews` → gets the list of reviews.
- If you click **"View Comments"** on a concern (say "battery"), it runs:
  - `GET /api/v1/concern-comments?concern=battery`
  - and shows a modal with the actual customer reviews that talk about battery. These are the **real proof** quotes.

**What to say out loud:** *"Here is the dashboard. Sentiment split, ranked concerns, rating, time, and country — all from the CSV. And if I click a concern, I see the real customer quotes behind it."*

---

## Step 5 — Analyzer screen (one review at a time)

**What the user sees:** a box where you can paste a single review and click Analyze.

**What happens in the background:**
- It sends `POST /api/v1/analyze` with `{ review_text: "..." }`.
- The backend runs sentiment + concern detection on that one line and returns the result.

**Use case:** good for a live demo — paste a sentence and show the prediction instantly.

---

## Step 6 — Explorer screen (browse all reviews)

**What the user sees:** a searchable/filterable table of every saved review (text, entity, sentiment, rating, country).

**What happens in the background:** it reads `GET /api/v1/reviews` and shows them in a table.

---

## Step 7 — Browser Back / Forward works

Because every screen change writes `?view=...` into the URL, the user can press the browser's **Back** button to go from Dashboard → Upload → Login, and **Forward** to come back. No extra code needed; the browser already knows the history.

---

## One-line summary for slides

> User clicks Start → Login → Upload CSV → Dashboard opens instantly (loading) → backend analyzes the file → real charts + real customer proof appear.

---

## Common presenter questions (and short answers)

**Q: Is the data fake?**
A: No. `data/` is gitignored. The dashboard only shows what was in the CSV you uploaded.

**Q: Why two upload buttons?**
A: One talks to your laptop (LOCAL), one talks to the live cloud (DEPLOYED). Same code, different server.

**Q: What if the backend is asleep?**
A: The Dashboard shows a friendly "Backend not reachable" message instead of crashing.

**Q: How fast is upload?**
A: A 21,000-row CSV analyzes in about 8 seconds on the cloud backend.
