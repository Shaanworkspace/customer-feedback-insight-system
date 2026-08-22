# User Flow — Step by Step (for presentation)

> Read this like a story. A "user" is any person who opens our website. We follow them screen by screen.
> Simple words first: **frontend** = the website you see; **backend** = the hidden server that does the thinking; **CSV** = a plain table file (like Excel) of reviews; **API** = a door the website knocks on to ask the server for data.

Our app has these screens: **Landing → Login → Upload → Dashboard**. Plus two extra screens: **Analyzer** (one review) and **Explorer** (all reviews).

The screen changes are saved in the web address (URL), e.g. `?view=dashboard`. That is why the browser **Back/Forward** buttons work — no extra code needed.

---

## Step 1 — Landing page (first screen)

**What you see:** a clean header with our name "Customer Feedback Insight System", a big hero text *"Upload the reviews you already have. We find what customers hate, why they hate it, and what to fix first."*, and a **"Start free"** button.

**What you do:** click **Start free**.

**What happens:** the website moves to the Login screen (`?view=login`). Nothing is sent to the server yet — it is just moving pages.

**Say out loud:** *"The user lands on our home page and clicks Start."*

---

## Step 2 — Login / Sign up (real account now)

**What you see:** a card with **Username** and **Password** fields, and a small link to switch between **Sign in** and **Create account**.

**What you do:**
- First time → click "Create account", type a username + password, submit.
- Next time → type them and click **Sign in**.

**What happens in the background (this is real, not fake):**
1. The website sends your username + password to the server (`POST /api/v1/auth/signup` or `/login`).
2. The server checks the password safely (it is scrambled with a strong method, never stored as plain text).
3. The server replies with a **token** (a temporary digital pass, like a wristband at a concert).
4. The website saves that token in the browser and remembers you are logged in.
5. It moves you to the Upload screen.

> Why this matters: every later request carries that token, so the server knows who you are. This is real authentication.

**Say out loud:** *"They create an account or sign in. We give them a token, and now they can use the app."*

---

## Step 3 — Upload page (the important one)

**What you see:** a box **"Upload your reviews"**, a dashed area to drop a CSV file, and two buttons:
- **Upload & Continue ON LOCAL** → talks to your laptop server (`http://localhost:8000`)
- **Upload & Continue ON DEPLOYED** → talks to the live cloud server

**What you do:** pick a CSV, click a button.

**What happens (the key part):**
1. The app checks the file ends in `.csv`. If not → error, stop.
2. It sets the server address (LOCAL or DEPLOYED).
3. It sends the file: `POST /api/v1/upload` (with your token).
4. The server reads the whole file, studies every review, and saves the results.
5. When done, the Dashboard opens and fills with **real numbers and real charts** — no fake data.

**Say out loud:** *"They pick a CSV and upload. The server analyzes every review, and the dashboard fills with real insights."*

---

## Step 4 — Dashboard (where insight appears)

**Top to bottom you see:**
1. **KPI cards:** total reviews, positive count, negative count, top concern.
2. **Sentiment chart:** positive vs negative (pie/bar).
3. **Priority Concerns list:** biggest problems first, each with an "impact" score.
4. **Three charts:** Rating Distribution, Reviews Over Time, Market by Country.
5. **Review Explorer:** a table of all reviews.
6. Every concern has a **"View Comments"** button.

**What happens:** the Dashboard asks the server `GET /api/v1/stats` and `GET /api/v1/reviews`. Clicking **View Comments** on "battery" asks `GET /api/v1/concern-comments?concern=battery` and shows the **actual customer quotes** about battery — our RAG "real proof".

**Say out loud:** *"Here is the dashboard — sentiment, ranked concerns, ratings, time, country, all from your file. Click a concern to see the real customer quotes."*

---

## Step 5 — Analyzer (one review)

Paste one review → `POST /api/v1/analyze` → see its sentiment + concerns instantly. Great for a live demo.

## Step 6 — Explorer (all reviews)

A searchable table of every saved review (`GET /api/v1/reviews`).

---

## One-line summary for slides

> User clicks Start → Sign up / Sign in → Upload CSV → server analyzes → Dashboard shows real charts + real customer proof.

---

## Common presenter questions (short answers)

**Q: Is the data fake?**
A: No. The dashboard only shows what was in *your* uploaded CSV.

**Q: Why two upload buttons?**
A: One talks to your laptop, one to the live cloud. Same code, different server.

**Q: What if the backend is asleep?**
A: The Dashboard shows a friendly "Backend not reachable" message instead of crashing.

**Q: Is login real?**
A: Yes — real signup/login, password scrambled, token given, all data calls protected.

**Q: How fast is upload?**
A: A large CSV (tens of thousands of rows) analyzes in seconds on the cloud backend.
