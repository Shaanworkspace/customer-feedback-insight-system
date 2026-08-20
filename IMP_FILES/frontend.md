# FRONTEND — What the user sees, step by step

This document shows the WHOLE frontend.
What the user sees, what the user clicks, and what appears
on the screen at every step.

The flow has 4 stages:

```text
1. LANDING   -> the welcome page
2. LOGIN     -> the user signs in
3. UPLOAD    -> the user uploads a CSV file
4. DASHBOARD -> the analysis page (charts + tables)
```

The frontend is React (Vite).

---

## PART 1 — THE LANDING PAGE

This is the FIRST page. It is for visitors who have
not signed in yet.

### 1.1 What the user sees

```text
Customer Feedback Insight System

Understand your customer reviews.
Find the problems. Fix them in the right order.

[ Sign in ]   [ Create account ]
```

- App name at the top.
- One line about what the product does.
- Two buttons: Sign in, Create account.

There is NO chart, NO data, NO upload on this page.
This page just tells the visitor what the product is
and asks them to sign in.

### 1.2 What the user does

IF the user clicks "Sign in"
THEN the login page opens (PART 2).
ELSE IF the user clicks "Create account"
THEN the same login page opens, in sign-up mode.

The landing page is the only public page.
Everything after it needs a login.

---

## PART 2 — THE LOGIN PAGE

### 2.1 What the user sees

A simple form.

```text
Sign in

Email:    [________________]
Password: [________________]

[ Sign in ]
```

### 2.2 What happens

IF the email and password are correct
THEN the app moves to the Upload page (PART 3).
ELSE
THEN the app shows:

```text
"Wrong email or password. Try again."
```

IF the user clicks "Create account" instead
THEN the same form shows an extra field:

```text
Name: [____________]
Email: [____________]
Password: [____________]
[ Create account ]
```

### 2.3 After login

The user stays signed in.
If they close the browser and open the app again,
they do NOT need to sign in again.

IF they were signed in before
THEN the landing page is skipped
and the app opens the Upload page directly.

---

## PART 3 — THE UPLOAD PAGE

This is the page right after login.
This is where the user brings their reviews.

### 3.1 What the user sees

```text
Upload your reviews

Drag and drop your CSV file here,
or click to choose a file.

[ Choose file ]
```

The file must be a CSV with this format:

```text
review_text,rating,date
battery drains fast,1,2026-01-01
great camera quality,5,2026-01-02
delivery was very late,1,2026-01-03
```

### 3.2 While the file is being read

The frontend reads the file and sends it to the backend:
POST /api/v1/upload

A small progress bar appears near the upload box:

```text
Reading file... [=====>        ] 40%
```

### 3.3 What happens next

IF the file is empty or has no valid reviews
THEN the page shows the backend error:

```text
"File is empty. Upload again."
"No valid reviews found."
```

ELSE
THEN the upload page is replaced by the Dashboard (PART 4).

The upload page itself is simple.
The real work happens on the Dashboard.

---

## PART 4 — THE DASHBOARD

After the upload, the Dashboard opens.
This is the MAIN page of the app.

### 4.1 How the Dashboard loads

The backend analyzes the reviews in the background
(batches, LLM, analysis, RAG, ranking).

The Dashboard does NOT show one big "loading" screen.
Instead, the page opens right away, and EVERY SECTION
loads by itself. Each section shows its own small
loading state until its data is ready.

```text
[ header with Upload button + tabs ]
[ SECTION 1: big numbers    ]   <-- shows skeleton while loading
[ SECTION 2: sentiment chart]   <-- shows skeleton while loading
[ SECTION 3: priority table ]   <-- shows skeleton while loading
[ SECTION 4: proof quotes   ]   <-- shows skeleton while loading
```

A section that is still loading looks like this:

```text
[==== loading ====]
```

When a section's data is ready, it fills in.
The rest keep loading. The user sees the page structure
immediately, never a blank full screen.

### 4.2 SECTION 1 — The big numbers (top cards)

Three cards in a row.

```text
  +----------+  +----------+  +----------+
  |   100    |  |  61 / 39 |  |   40%    |
  |  Total   |  | Positive |  | Negative |
  |  reviews |  | Negative |  |    rate  |
  +----------+  +----------+  +----------+
```

- Total reviews.
- Positive / Negative count.
- Negative rate (the percentage).

This gives the user the summary in one glance.

### 4.3 SECTION 2 — The sentiment chart

A bar chart showing positive vs negative.

```text
Sentiment

  positive  |██████████████| 61
  negative  |██████████|   39
```

- One bar for positive.
- One bar for negative.
- The count is written on the bar.

This shows how happy the customers are, overall.

### 4.4 SECTION 3 — The priority concerns table

The main table. Sorted by priority.

```text
Priority | Concern  | Count | Negative % | Impact
1        | battery  | 48    | 79.2       | 100
2        | delivery | 20    | 55.0       | 29
3        | screen   | 12    | 75.0       | 24
```

- Priority 1 = the problem to fix first.
- Only real problems appear (camera and price were dropped
  by the filters).

### 4.5 SECTION 4 — The proof quotes

Below the table, for every concern, the real review quotes.

```text
battery  (priority 1 - fix this first)

  "battery dies in 2 hours"      (92% similar)
  "battery drains very fast"     (89% similar)
  "worst battery life ever"      (85% similar)

delivery  (priority 2)

  "delivery was very late"       (90% similar)
  ...
```

This is the PROOF. Every number in the table has
real reviews behind it.

### 4.6 What the Dashboard looks like (one picture)

```text
+--------------------------------------------------+
| Customer Feedback Insight System     [Upload]     |
| [ Dashboard ]  [ Reviews ]                        |
+--------------------------------------------------+
| 100          | 61 / 39       | 40%               |
| Total        | Positive /    | Negative rate     |
| reviews      | Negative      |                   |
+--------------------------------------------------+
| Sentiment:                                         |
|  positive |██████████████| 61                     |
|  negative |██████████| 39                         |
+--------------------------------------------------+
| Priority | Concern  | Count | Neg % | Impact      |
| 1        | battery  | 48    | 79.2  | 100         |
| 2        | delivery | 20    | 55.0  | 29          |
| 3        | screen   | 12    | 75.0  | 24          |
+--------------------------------------------------+
| battery:                                          |
|  - "battery dies in 2 hours"       (92% similar)  |
|  - "battery drains very fast"      (89% similar)  |
+--------------------------------------------------+
```

### 4.7 The second tab — Reviews

Next to Dashboard there is a second tab: "Reviews".

This page shows the real reviews in a table
with filters.

```text
Reviews

Filter: [ battery v ]   [ positive v ]   [ Clear ]

text                          | concern  | sentiment
battery dies in 2 hours       | battery  | negative
battery drains very fast      | battery  | negative
worst battery life ever       | battery  | negative
great camera quality          | camera   | positive
```

The user reads the real customer words to
understand a problem deeply.

---

## PART 5 — WHAT HAPPENS ON THE SCREEN AT EACH STATE

The app must never show a blank full screen.

```text
STATE 1: visitor, not signed in
  -> landing page (PART 1)

STATE 2: signing in
  -> login page (PART 2)

STATE 3: signed in, no upload yet
  -> upload page with a clear button (PART 3)

STATE 4: upload is running
  -> upload progress, then dashboard opens
  -> every dashboard section loads by itself

STATE 5: analysis is done
  -> full dashboard (numbers + charts + table + proof)

STATE 6: backend is down
  -> page shows:
     "Can't reach the server. Please try again."
```

The dashboard is NEVER blank.
At minimum the page structure (cards + tables)
is visible with loading placeholders inside.

---

## PART 6 — THE REQUESTS THE FRONTEND MAKES

The frontend needs only these 5 requests.

### 6.1 Login

```text
POST /api/v1/login
body: {"email": "...", "password": "..."}
returns: {"token": "..."}
```

The token is saved in the browser.
All following requests send this token.

### 6.2 Upload the CSV

```text
POST /api/v1/upload
body: the CSV file (multipart)
returns: the full stats result
```

### 6.3 Get the dashboard stats

```text
GET /api/v1/stats
```

Returns:

```json
{
  "total_reviews": 100,
  "sentiment_distribution": {"positive": 61, "negative": 39},
  "ranked_concerns": [
    {"concern": "battery", "count": 48, "negative_pct": 79.2, "impact": 100, "priority": 1},
    {"concern": "delivery", "count": 20, "negative_pct": 55.0, "impact": 29, "priority": 2},
    {"concern": "screen", "count": 12, "negative_pct": 75.0, "impact": 24, "priority": 3}
  ],
  "representative_reviews": [
    {"review_id": "r1", "text": "battery dies in 2 hours", "sentiment": "negative"},
    {"review_id": "r2", "text": "great camera quality", "sentiment": "positive"}
  ]
}
```

### 6.4 Get the reviews for the Reviews tab

```text
GET /api/v1/reviews
```

Returns:

```json
[
  {"review_id": "r1", "text": "battery dies in 2 hours", "concern": "battery", "sentiment": "negative"},
  {"review_id": "r2", "text": "great camera quality", "concern": "camera", "sentiment": "positive"}
]
```

### 6.5 Check if analysis is still running

The dashboard sections poll this while they are loading:

```text
GET /api/v1/status
returns: {"status": "processing", "done": 40, "total": 100}
```

When status becomes "done", the sections fill with data.

---

## PART 7 — WHAT THE FRONTEND DOES NOT DO

- The frontend does NOT count anything.
- The frontend does NOT call the LLM.
- The frontend does NOT rank or filter concerns.
- The frontend only SHOWS what the backend returns.

IF the backend is slow
THEN the frontend just shows the section loading states.
It never decides the data.

---

## PART 8 — RULES FOR THE FRONTEND

- Keep it simple. No extra styling, no extra pages.
- Never show fake numbers. The numbers come from the backend.
- Never show a blank full screen. Every section loads itself.
- The 5 requests in PART 6 are the only ones allowed.
- Field names come from the contract. Do not rename them.

---

END OF DOCUMENT