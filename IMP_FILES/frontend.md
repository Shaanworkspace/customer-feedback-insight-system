# Frontend.md — Complete React Frontend Knowledge | Sequential Long Form | 8th Grade English | Best Examples | No Push

> **How to read:** Start at Heading 1, go down to 12. Every heading answers one question you will be asked. Every heading has `Why`, `Why Not Others`, `Example`, `What We Did vs What React Did`. No tables for long explanations — only headings, direct points, code. Same pattern as `model.md`.

---

## 1. What Is Our Frontend? (One Line)

Our frontend is **`React (React - JavaScript Library for UI) 19 + Vite (Vite - Frontend Build Tool) + Tailwind CSS (Tailwind CSS - Utility CSS Framework) v4 + Recharts (Recharts - Chart Library) + React Router via `?view=` query`** — hosted on `Vercel (Vercel - Frontend Hosting)`.

- **Entry:** `frontend/src/main.jsx` → `App.jsx` → `SiteHeader` / `Landing` / `Login` / `Upload` / `Dashboard` / `Analyzer` / `Explorer` / `Profile`.
- **Job:** Let user `Login → Drop CSV → See Pie/Bar/Table → Know what to fix first` in 30 seconds.

**Direct Example — User Flow:**
```
You open https://customer-feedback-insight-system.vercel.app → Landing "Start Free" → Login (email+password) → Dashboard "Drop CSV here" → drop final.csv 36 rows → Pie Positive 10 Negative 5 + Bar battery 6 + ACT FIRST battery → View comments 5
```

---

## 2. Why React? Why Not Vue, Angular, Plain HTML?

### Why React?

- **Component (Component - Reusable UI Piece):** `Dashboard`, `Upload`, `Analyzer` are components — you write once, reuse everywhere. `Upload` div is same on `Upload` page and `Dashboard` (`Drop CSV here`).
- **State (State - Data That Changes):** `useState` for `selectedCsvFile`, `isDraggingOverDropZone`, `visibleConcernCount 5` — when file changes, UI auto-updates without reload.
- **Ecosystem:** `Recharts` for Pie/Bar, `Tailwind` for styling, `Vite` for fast build — all made for React.

### Why Not Vue?

Vue is also component-based, but our team knew React, and `Recharts` + `Tailwind` have **more React examples** than Vue. Choosing Vue would need learning new syntax `v-if` vs `if`, no gain.

### Why Not Angular?

Angular is **heavy** (needs `TypeScript (TS - Typed JavaScript)`, `RxJS`, `Modules`). For 1-week hackathon, Angular setup is 2× slower. React + Vite builds in **300ms** (`Vite v8.2.1 ready in 300ms` in `Dashboard` logs), Angular needs `ng serve` 5 sec.

### Why Not Plain HTML + JS?

Plain HTML would need you to write `document.getElementById` for every `Drop CSV` hover, no `Recharts` Pie, no `Tailwind` 80% aligned header. React does it in 10 lines.

**Example where React wins:**
- Plain HTML: `if file.name.endsWith(".csv") then show ✓ else show error` — you write 20 lines for one drop zone.
- React: `handleDashboardFile()` 8 lines + `useState` auto shows `✓ filename 12.3 KB Ready` — reuse on two pages.

---

## 3. Why Vite? Why Not Create React App (CRA) or Webpack?

### Why Vite (Vite - Frontend Build Tool)?

- **Fast:** `Vite` uses native `ESM (ECMAScript Module)` — `npm run dev` in **128ms** (we saw `ready in 128ms`), `CRA` needs `Webpack` bundle 30 sec.
- **Modern:** `Vite` supports `import.meta.env.VITE_API_BASE` for `API_BASE` switch (local vs EC2) without `process.env`.

### Why Not CRA?

`CRA` is deprecated (no updates), `Webpack` config is hidden, slow. Vite is **official** for `React 19`.

**Example:** `frontend/vite.config.js` is 10 lines (`plugins: [react(), tailwindcss()]`) vs `CRA` ejects 500 lines.

---

## 4. Why Tailwind CSS (Tailwind CSS - Utility CSS Framework) + Recharts (Recharts - Chart Library)? Why Not Bootstrap or Chart.js?

### Why Tailwind?

- **Utility:** `className="rounded-[20px] border border-[#e1e7ef] bg-white"` — you see style directly in HTML, no separate `style.css` file.
- **80% Aligned:** `header` `padding 0 10%` + `page-container` `min(1280px,80%)` — both 80% so they align, done in Tailwind in 1 line.

### Why Not Bootstrap?

Bootstrap gives **pre-made** buttons (`btn-primary` blue). We needed **custom** `bg-[#173f73]` dark blue + `rounded-[15px]` + `shadow-[0_4px_18px_rgba(...)]` — Tailwind lets you pick exact color, Bootstrap forces blue.

### Why Recharts?

- **Declarative:** `<PieChart><Pie data={sentimentData} dataKey="value" /><Tooltip /></PieChart>` — 10 lines for Pie + Bar + `ResponsiveContainer`.
- **Why not Chart.js?** `Chart.js` needs `canvas` + imperative `new Chart(ctx, {...})` 30 lines, harder to make `Top Countries` vertical `BarChart` + `Pie` with `innerRadius 60`.

**Example:** `Dashboard.jsx:650` `Sentiment Distribution` Pie is 15 lines with `SENT_COLOR` `Positive #25834c` — Chart.js would be 40 lines.

---

## 5. How Does Frontend Talk To Backend? (API (Application Programming Interface) Flow)

### Theory First

Frontend does **not** have model. It **asks** backend via `fetch` (HTTP). Backend does BERT and returns JSON. This is **API**.

### What We Did vs What React Did

| You Did | React Did |
|---------|-----------|
| You wrote `frontend/src/api.js` `API_BASE = import.meta.env.VITE_API_BASE \|\| (hostname==='localhost' ? LOCAL_API : '')` — `LOCAL_API http://localhost:8000`, `''` means same-origin `https://vercel.app/api` via `vercel.json` proxy to `http://3.109.121.85:8000` (avoids `Mixed Content` `https→http` block). | React did not make `fetch`, you did. |
| You wrote `uploadReviews(csvFile)` → `FormData file` → `POST /api/v1/upload` + `Authorization: Bearer <JWT (JSON Web Token)>` → `EC2`. | React did not know `JWT`, you added `buildAuthHeader()` `hasToken` log. |
| You wrote `getMe()`, `login()`, `signup()`, `getHistoryReport(id)` with `logStep` `[CFA] [AUTH]`, `[CFA] [MODEL]` | React did not log, you added `[CFA] [INIT] API base = ...` for debug. |

**Direct Example — Upload:**
```javascript
// You wrote in api.js:271
async function sendUploadRequest(formData) {
  const fileName = formData.get('file')?.name
  logStep('UPLOAD', `POST /api/v1/upload → sending to ${currentApiBaseUrl}/api/v1/upload`, {fileName})
  const response = await fetch(`${currentApiBaseUrl}/api/v1/upload`, {method:'POST', headers: buildAuthHeader(), body: formData})
  // Browser → Vercel https://vercel.app/api/v1/upload → Vercel proxy vercel.json rewrites → EC2 http://3.109.121.85:8000/api/v1/upload
}
```

**Why `vercel.json` proxy?**
- **Without proxy:** `Vercel https` → `EC2 http://3.109.121.85:8000` → browser **Mixed Content** block `was loaded over HTTPS, but requested insecure http`.
- **With proxy:** `frontend/vercel.json` `{"rewrites": [{"source":"/api/:path*","destination":"http://3.109.121.85:8000/api/:path*"}]}` → browser sees `https://vercel.app/api` (same-origin `https`), Vercel server (not browser) fetches `http` EC2 → no block. **By The Way — Why not make EC2 `https`?** Need `ALB (Application Load Balancer) + ACM (AWS Certificate Manager)` + domain + `TLS (Transport Layer Security)` cert — overkill for 10-day demo, proxy is 12 lines.

---

## 6. What Are The Main Frontend Files? What Does Each Do? (Sequence)

### 6.1 `frontend/src/App.jsx` — Router (No Library, Just `?view=`)

**Why `?view=` not `react-router`?** For hackathon, `react-router` is extra `5KB` + `BrowserRouter` config. We use `window.history.pushState({view}, '', '?view='+v)` + `useState(view)` — 10 lines, no library. `v` is `landing`, `login`, `upload`, `dashboard`, `analyzer`, `explorer`, `profile`.

**What we did:** `navigate(v)` + `handleLogin() → setSignedIn(true) → navigate('dashboard')` + `handleLogout() → localStorage.removeItem('cfa_token')` + `if (signedIn && v==='login') v='dashboard'` (session, no re-login).

### 6.2 `frontend/src/api.js` — All Backend Calls (322 lines)

**Why this file?** One place for `API_BASE`, `TOKEN_KEY`, `USER_KEY`, `logStep` with `[CFA]` prefix + timestamp `11:23:16.461`. Every `fetch` logs `sending → status in ms → ok/failed` — you see in console when `MODEL` stuck `15s+`.

**What we did:** `buildAuthHeader()` `hasToken` log, `handleUnauthorizedAndRedirect()` clears `401` → `/?view=login`, `uploadReviews()` 4 steps (validate → build `FormData` → `sendUploadRequest` → handle `network` vs `server` error separately).

### 6.3 `frontend/src/components/upload/Upload.jsx` — Upload Page (258 lines)

**Why professional `div` not `button`?** `div` with `role="button"` `tabIndex=0` `onDragOver` `onDrop` + `border-dashed` `hover:border-[#173f73]` is **more visible** than plain `input type=file` button — evaluator sees drag-drop.

**What we did:** `validateCsvFile()` checks `.csv` + not empty → error `role="alert"` red, `handleFileSelection()` logs `file selected`, `uploadToBackend()` logs `sending to MODEL`, shows `LoadingSpinner` `Analyzing your reviews…`, calls `uploadReviews()` → `onStart() → onDone()` → `navigate('dashboard')`.

### 6.4 `frontend/src/components/Dashboard.jsx` — Main Dashboard (900+ lines)

**Why this file is big?** It does **5 jobs** in one file (for hackathon speed): `Your analyses` grid + `How your data should look` table + `4 sections` ( How data is, How we work, How improve, How privacy) with images + `Priority Concerns` Top 5 + `See more` + `Review Explorer` 10 + `See more` 55 + `Board` + `View comments` modal.

**What we did:** `visibleConcernCount 5` + `reviewVisibleCount 10` + `activeTab` + `isBoardOpen` — small `useState`, each does one job (8-25 lines). `openTabBoard()` filters `concernSummary` and `reviews` by `activeTab` — `Positive` click → both lists filter → board `55`.

### 6.5 `frontend/src/components/Analyzer.jsx` + `Explorer.jsx` — One Review + All Reviews

`Analyzer` → `POST /api/v1/analyze` with `review_text` → `overall_sentiment` + `concerns`. `Explorer` → `GET /api/v1/reviews` table.

---

## 7. Why Not Use `react-router`, `Redux (Redux - State Manager)`, Or Other Libraries?

| Library | Why Not |
|---------|---------|
| `react-router` | Need `BrowserRouter`, `Routes`, `Route` — 20 lines config for 5 views. Our `?view=` query does same in 10 lines, no extra `5KB`. |
| `Redux` | For **global state** `cfa_token`, `me`, `analyses` — we use `localStorage` + `useState` + `getUser()` — enough for 10-day, no `store`, `reducer`, `dispatch` boilerplate. |
| `Axios (Axios - HTTP Client)` | `fetch` is native, no `npm install axios` 14KB. We added `logStep` ourselves, `Axios` would need `interceptor` config. |

**When would we use them?** If project runs 1 year with 20 pages, `Redux` + `react-router` would be better for large team.

---

## 8. Where Is Frontend Lagging Now? How To Fix?

| Lag | Why | Fix Approach |
|-----|-----|--------------|
| **Mixed Content if no proxy** | `Vercel https` → `EC2 http` blocked | Keep `vercel.json` proxy `/api` → EC2 `http` (we did), or make EC2 `https` via `ALB + ACM` + domain + cert (future, not needed for 10 days). |
| **Large `Dashboard.jsx` 900 lines** | One file does 5 jobs (grid + table + 4 sections + concerns + explorer) | Split into `DashboardHeader.jsx`, `PriorityConcerns.jsx`, `ReviewExplorer.jsx` — each 200 lines, easier to test. |
| **No `VITE_API_BASE` in Vercel dashboard** | If `Vercel → Settings → Env Vars` has `VITE_API_BASE = https://cfa-api.onrender.com` (old), it overrides `api.js` `DEPLOYED_API` → still calls Render (we saw `index-BO6lQxGD.js` old). | Delete `VITE_API_BASE` in Vercel dashboard or set to `""` (same-origin) — then `api.js` uses `vercel.json` proxy. |
| **CORS if proxy removed** | `FastAPI` `CORSMiddleware` allows `vercel.app` `allow_origin_regex`, but if we call direct `http://3.109.121.85:8000` from `https` without proxy, browser blocks before CORS. | Keep proxy — browser sees same-origin `https`, no CORS needed. |

---

## 9. Future Scopes For Frontend

- **Split `Dashboard.jsx`** into 3 files + `lazy` load `Recharts` (code-split, `dist` 664K → 300K).
- **Add `React Query`** for `getHistory` caching (now `useEffect` fetches every `reloadKey`).
- **Add `HTTPS` for EC2** via `ALB` + `ACM` + `Route53` custom domain `api.yourdomain.com` — then `DEPLOYED_API = https://api.yourdomain.com` and remove `vercel.json` proxy.
- **Add `PWA (Progressive Web App)`** offline `serviceWorker` for `Upload` page.

---

## 10. How To Present Frontend In Interview (What Model Is Not Doing)

> "React does **not** find aspects — it **shows** what BERT found. **We did:** `Vercel` hosting, `Tailwind` 80% aligned header, `Recharts` Pie/Bar, `div` drag-drop (not `button`), `useState` for `Top 5`/`10`, `api.js` `fetch` + `JWT` + `[CFA]` logs, `vercel.json` proxy to avoid `https→http` block. **React did:** Render `JSX` to HTML."

**One-line for PPT:** `Vercel React 19 + Vite 128ms + Tailwind 80% + Recharts Pie/Bar + fetch same-origin /api via vercel.json → EC2`.

---

*This `frontend.md` is long form, headings not tables, short first then full (React (React...), API (Application...), JWT (JSON Web Token), CORS (Cross-Origin...), Vercel (Frontend Hosting) etc.), sequential, with best examples, no push.*
