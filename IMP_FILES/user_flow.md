# User Flow — Step by Step (for presentation)

> Frontend = website you see; Backend = hidden server; CSV = table file; API = door the website knocks on.

Screens: **Landing → Login → Upload → Dashboard** + **Analyzer** (one review) + **Explorer** (all reviews). URL `?view=dashboard` keeps Back/Forward working.

## Step 1 — Landing

Header `Customer Feedback Insight System`, hero *"Upload the reviews you already have. We find what customers hate..."*, **Start free** → `?view=login`.

## Step 2 — Login / Sign up (real, online DB)

Card with **Username + Password**, switch **Sign in / Create account**.

- First time → `Create account` → `POST /api/v1/auth/signup` → server scrambles password with `pbkdf2`, saves to **Aiven MySQL** `users` table, returns `{token}` (JWT, 1h, `JWT_SECRET` env).
- Next time → `Sign in` → `POST /api/v1/auth/login` → checks, returns `{token}`.
- Token saved in `localStorage` (`cfa_token`), all later calls send `Authorization: Bearer <token>`. On `401`, frontend clears token and redirects to `/?view=login` (no more “har baar register” if DB is MySQL, not ephemeral SQLite).

Say: *"They create an account or sign in. We give a token, now they can use the app — online DB keeps them."*

## Step 3 — Upload (professional div, not plain button)

**What you see:**
- Top hero `Upload your reviews` + **professional `div` drop zone** (not button): dashed border `border-[#b9c8d8]`, hover `border-[#173f73] bg-[#eef4fb]`, keyboard `Enter/Space`, shows file name + size, “Only .CSV” badge, spinner `LoadingSpinner` while `isCsvUploadInProgress`.
- Two buttons: **Upload & Continue ON LOCAL** (`http://localhost:8000`) and **ON DEPLOYED** (`https://cfa-api.onrender.com`), both with icon `＋`/`⤓`, shadow and hover lift.
- Below: 3 steps `01 Drop your CSV → 02 AI reads everything → 03 See what to fix` and `Any columns work` cards.

**What you do:** Pick/drag a CSV (any name like `review_text`, `Review Text`, `comment` — auto-found), click a button.

**What happens:**
1. `validateCsvFile()` checks `.csv` and not empty → error in red alert if bad.
2. `setApiBase(base)` + `uploadReviews(file)` → `POST /api/v1/upload` (with token, `FormData` field `file`).
3. Backend `readUploadFileSafely` → `decodeCsvBytesToText` → `processCsvBytesToStats` (each with clear 400/500) → `save_analysis` (keep last 3).
4. Dashboard opens with **real numbers**.

Say: *"They pick a CSV and upload. The server analyzes every review, and the dashboard fills with real insights."*

## Step 4 — Dashboard (now 80% width, aligned with header)

Header `80%` (`padding 0 10%`), page `80%` (`min(1280px, 80%)`) — aligned. Top `CUSTOMER INTELLIGENCE 36 reviews analyzed`.

**Welcome section (when no analysis selected):**
- `Hi there` + workspace text + **+ Upload new reviews** (professional `bg-[#173f73]` with `＋`) + `Download sample CSV`.
- **Dashboard drag-drop** right below: `Drop CSV here` div (same professional div as Upload page) — you can drop without going to Upload. Shows spinner while analyzing, error alert if any.

**Your analyses (when history exists):**
- Grid of cards: `filename`, `36 reviews · 10/09/2026 11:36 AM` (date + **timing**), top 3 concerns as chips.
- **Hover** → top-right `×` (delete) appears — click → confirm → `DELETE /api/v1/history/{id}` → card disappears, no reload needed.

**When you click a card** → loads that analysis (`GET /api/v1/history/{id}`).

**Inside an analysis:**

1. **Header** — `36 reviews analyzed`, `8 priority issues`, `+ Upload new` (icon `＋`) + `Export CSV` (icon `⤓`) — both `inline-flex` with shadows, hover lift.
2. **6 stat cards** (clickable tabs) — Total, Positive, Negative, Neutral, Mixed, Priority Issues. Click any → filters **both** Priority and Review Explorer below, and opens a board.
3. **Top Priority** — `battery 8 mentions · 87.5% negative · impact 100` + 3 proof quotes.
4. **Charts** — Sentiment pie, Concern Mentions bar, Rating, Trend, Countries.
5. **Tabs** — `All | Top | Positive | Negative | Neutral | Mixed | Review` — click `Positive` → Priority shows only `negative_pct <30` concerns, Review Explorer shows only `Positive` reviews, board shows up to 55. Click again to see all.
6. **Priority Concerns** — **Top 5** shown, `See more (3 more)` loads 5 more, `Show less` back to 5. Each row: number, name, `count · share · positive`, bar `share%`, `negative%`, `View comments` → modal with real quotes.
7. **Review Explorer** — **10 of 36** shown, `See more` loads 10 more up to 55, `Show less` back. Each card: `sentiment` pill, `★ rating · country`, text, `aspects` chips.
8. **Board** (when tab clicked) — `X reviews` where feeling is `X`, up to 55, close to hide.
9. **Email report** — input + `Send report` → `POST /api/v1/report/email`.

State: `visibleConcernCount` (5), `reviewVisibleCount` (10), `activeTab`, `isBoardOpen`, `boardReviews` — all small, easy names.

Say: *"Here is the dashboard — sentiment, ranked concerns (top 5, see more), ratings, time, country, all from your file. Click Positive to filter both lists. Click a concern to see real quotes. Drag a new CSV right here."*

## Step 5 — Analyzer (one review)

Paste one review → `POST /api/v1/analyze` → see `overall: mixed`, `product→Positive, delivery→Negative`, confidence bar. Examples chips to click.

## Step 6 — Explorer (all reviews)

Table of every saved review (`GET /api/v1/reviews`), searchable.

## One-line summary

> Start → Sign up / Sign in (online DB, stays) → Upload or drop CSV on dashboard → server analyzes via BERT (no hard-coded list) → Dashboard shows real charts + proof, filter by tabs, see more, delete old, export.

## Presenter Q&A

**Q: Is data fake?** No, only from your uploaded CSV (try `bluetooth_speaker_reviews.csv` 48 rows, `office_chair_reviews.csv` 52, `smartwatch_reviews.csv` 55 — all bigger, any columns work, only `review_text` mandatory).

**Q: Why two upload buttons?** Local vs Deployed — same code, different `setApiBase`.

**Q: Backend sleep?** Render free sleeps 15 min, first upload takes 30 sec to wake — frontend shows `Analyzing…` spinner, not crash.

**Q: Login real?** Yes — MySQL Aiven, pbkdf2, JWT 1h, 401 clears token and redirects to login.

**Q: How fast?** 36 reviews in a few seconds; BERT 15-20 min training once on T4, inference ~150ms per review.

**Q: Any hard-coded aspect list?** No — BERT learns pattern `X is wobbly` → X is aspect, so `armrest, fabric, battery` all work without code change. Fallback before training uses `ENGLISH_STOP_WORDS` + `10%` dynamic + word-alone sentiment filter, also no product list.
