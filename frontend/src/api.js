const DEPLOYED_API = 'http://3.109.121.85:8000'
const LOCAL_API = 'http://localhost:8000'
// ENV decides: if VITE_API_BASE is set, use it; else if running on localhost use local, else deployed EC2
const API_BASE =
  import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? LOCAL_API : DEPLOYED_API)

let currentApiBaseUrl = API_BASE

// --- console logger (all logs go to browser console) ---
const LOG_PREFIX = '[CFA]'
function logStep(tag, message, data) {
  const ts = new Date().toISOString().slice(11, 23)
  if (data !== undefined) console.log(`${LOG_PREFIX} [${ts}] [${tag}] ${message}`, data)
  else console.log(`${LOG_PREFIX} [${ts}] [${tag}] ${message}`)
}
function logError(tag, message, err) {
  const ts = new Date().toISOString().slice(11, 23)
  console.error(`${LOG_PREFIX} [${ts}] [${tag}] ❌ ${message}`, err ?? '')
}
function logSuccess(tag, message, data) {
  const ts = new Date().toISOString().slice(11, 23)
  if (data !== undefined) console.log(`${LOG_PREFIX} [${ts}] [${tag}] ✅ ${message}`, data)
  else console.log(`${LOG_PREFIX} [${ts}] [${tag}] ✅ ${message}`)
}
logStep('INIT', `API base = ${currentApiBaseUrl} (host=${typeof window !== 'undefined' ? window.location.hostname : 'ssr'})`)

const TOKEN_KEY = 'cfa_token'
const USER_KEY = 'cfa_user'

// --- helpers: base url and auth ---

export function setApiBase(baseUrl) {
  currentApiBaseUrl = baseUrl
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function setUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

function buildAuthHeader() {
  const token = getToken()
  const has = !!token
  logStep('AUTH', `buildAuthHeader hasToken=${has} tokenLen=${token.length}`)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleUnauthorizedAndRedirect(response) {
  if (response.status === 401) {
    logError('AUTH', '401 Unauthorized — token expired/cleared, redirecting to /?view=login', { url: response.url })
    setToken('')
    setUser(null)
    const currentView = new URLSearchParams(window.location.search).get('view')
    if (currentView !== 'login') {
      window.location.href = '/?view=login'
    }
  }
}

async function extractErrorDetail(response) {
  // If 401, clear the expired token so user is not stuck in a loop
  if (response.status === 401) {
    handleUnauthorizedAndRedirect(response)
  }
  try {
    const data = await response.json()
    return data.detail || ''
  } catch {
    return ''
  }
}

// --- auth ---

export async function getMe() {
  logStep('API', 'GET /api/v1/auth/me → sending')
  const t0 = performance.now()
  const response = await fetch(`${currentApiBaseUrl}/api/v1/auth/me`, { headers: buildAuthHeader() })
  logStep('API', `GET /api/v1/auth/me ← status ${response.status} in ${Math.round(performance.now() - t0)}ms`)
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    logError('API', 'GET /auth/me failed', { status: response.status, detail })
    throw new Error(detail || 'Failed to load profile')
  }
  const data = await response.json()
  logSuccess('API', 'GET /auth/me ok', data)
  setUser({ first_name: data.first_name, email: data.email })
  return data
}

export async function signup(email, password, firstName = '') {
  logStep('AUTH', 'POST /api/v1/auth/signup → sending', { email, firstName })
  const t0 = performance.now()
  const response = await fetch(`${currentApiBaseUrl}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password, first_name: firstName, email }),
  })
  logStep('AUTH', `POST /auth/signup ← status ${response.status} in ${Math.round(performance.now() - t0)}ms`)
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    logError('AUTH', 'signup failed', { status: response.status, detail })
    throw new Error(detail || 'Signup failed')
  }
  const data = await response.json()
  logSuccess('AUTH', 'signup ok', { email: data.email, hasToken: !!data.token })
  return data
}

export async function login(username, password) {
  logStep('AUTH', 'POST /api/v1/auth/login → sending', { username })
  const t0 = performance.now()
  const response = await fetch(`${currentApiBaseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  logStep('AUTH', `POST /auth/login ← status ${response.status} in ${Math.round(performance.now() - t0)}ms`)
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    logError('AUTH', 'login failed', { status: response.status, detail })
    throw new Error(detail || 'Invalid username or password')
  }
  const data = await response.json()
  logSuccess('AUTH', 'login ok', { hasToken: !!data.token })
  return data
}

// --- data ---

export async function getStats() {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/stats`, { headers: buildAuthHeader() })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Stats request failed')
  }
  return response.json()
}

export async function getReviews() {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/reviews`, { headers: buildAuthHeader() })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Reviews request failed')
  }
  return response.json()
}

export async function getConcernComments(concernName) {
  logStep('MODEL', `GET /concern-comments?concern=${concernName} → sending`)
  const t0 = performance.now()
  const response = await fetch(`${currentApiBaseUrl}/api/v1/concern-comments?concern=${encodeURIComponent(concernName)}`, {
    headers: buildAuthHeader(),
  })
  logStep('MODEL', `GET /concern-comments ← status ${response.status} in ${Math.round(performance.now() - t0)}ms`)
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    logError('MODEL', 'concern-comments failed', { status: response.status, detail })
    throw new Error(detail || 'Concern comments request failed')
  }
  const data = await response.json()
  logSuccess('MODEL', 'concern-comments ok', { count: Array.isArray(data) ? data.length : '?' })
  return data
}

export async function analyzeReview(reviewText) {
  logStep('MODEL', 'POST /api/v1/analyze → sending (single review to BERT)', { len: reviewText.length, preview: reviewText.slice(0, 60) })
  const t0 = performance.now()
  const response = await fetch(`${currentApiBaseUrl}/api/v1/analyze`, {
    method: 'POST',
    headers: { ...buildAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_text: reviewText }),
  })
  logStep('MODEL', `POST /analyze ← status ${response.status} in ${Math.round(performance.now() - t0)}ms`)
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    logError('MODEL', 'analyze failed', { status: response.status, detail })
    throw new Error(detail || 'Analysis request failed')
  }
  const data = await response.json()
  logSuccess('MODEL', 'analyze ok (BERT returned)', data)
  return data
}

export async function getHistory() {
  logStep('API', 'GET /api/v1/history → sending')
  const t0 = performance.now()
  const response = await fetch(`${currentApiBaseUrl}/api/v1/history`, { headers: buildAuthHeader() })
  logStep('API', `GET /history ← status ${response.status} in ${Math.round(performance.now() - t0)}ms`)
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    logError('API', 'getHistory failed', { status: response.status, detail })
    throw new Error(detail || 'History request failed')
  }
  const data = await response.json()
  logSuccess('API', 'getHistory ok', { count: data.length })
  return data
}

export async function getHistoryReport(analysisId) {
  logStep('MODEL', `GET /api/v1/history/${analysisId} → sending (fetch report)`)
  const t0 = performance.now()
  const response = await fetch(`${currentApiBaseUrl}/api/v1/history/${analysisId}`, { headers: buildAuthHeader() })
  logStep('MODEL', `GET /history/${analysisId} ← status ${response.status} in ${Math.round(performance.now() - t0)}ms`)
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    logError('MODEL', 'getHistoryReport failed', { status: response.status, detail })
    throw new Error(detail || 'Report request failed')
  }
  const data = await response.json()
  logSuccess('MODEL', 'getHistoryReport ok', { total: data.total_reviews, concerns: data.ranked_concerns?.length })
  return data
}

export async function deleteHistory(analysisId) {
  logStep('API', `DELETE /api/v1/history/${analysisId} → sending`)
  const response = await fetch(`${currentApiBaseUrl}/api/v1/history/${analysisId}`, {
    method: 'DELETE',
    headers: buildAuthHeader(),
  })
  logStep('API', `DELETE ← status ${response.status}`)
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    logError('API', 'deleteHistory failed', { status: response.status, detail })
    throw new Error(detail || 'Delete failed')
  }
  const data = await response.json()
  logSuccess('API', 'delete ok', data)
  return data
}

export async function sendReportEmail(emailAddress, analysisId) {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/report/email`, {
    method: 'POST',
    headers: { ...buildAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailAddress, analysis_id: analysisId || null }),
  })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Could not send email')
  }
  return response.json()
}

// --- upload: split into small steps ---

function buildUploadFormData(csvFile) {
  logStep('UPLOAD', 'buildUploadFormData', { name: csvFile.name, size: csvFile.size, type: csvFile.type })
  const formData = new FormData()
  formData.append('file', csvFile)
  return formData
}

async function sendUploadRequest(formData) {
  const fileName = formData.get('file')?.name || 'unknown.csv'
  logStep('UPLOAD', `POST /api/v1/upload → sending to ${currentApiBaseUrl}/api/v1/upload`, { file: fileName })
  logStep('MODEL', '⏳ Sending request to MODEL (BERT) — backend will run BERT predict_review')
  const t0 = performance.now()
  const response = await fetch(`${currentApiBaseUrl}/api/v1/upload`, {
    method: 'POST',
    headers: buildAuthHeader(),
    body: formData,
  })
  const dt = Math.round(performance.now() - t0)
  if (response.ok) logSuccess('MODEL', `Response received from MODEL in ${dt}ms — status ${response.status} (BERT completed)`)
  else logError('MODEL', `Error from MODEL in ${dt}ms — status ${response.status}`, { file: fileName })
  // detect hang: if >15s, warn
  if (dt > 15000) logError('MODEL', '⚠️ Model appears stuck — took 15s+, check backend (BERT cold start?)')
  return response
}

export async function uploadReviews(csvFile) {
  logStep('UPLOAD', 'uploadReviews() called', { name: csvFile?.name, size: csvFile?.size })
  // Step 1: Validate file before sending
  if (!csvFile) {
    logError('UPLOAD', 'No file passed to uploadReviews')
    throw new Error('Please choose a CSV file first.')
  }

  // Step 2: Build request
  const formData = buildUploadFormData(csvFile)
  logStep('UPLOAD', 'FormData ready, sending to backend…')

  // Step 3: Send and handle network errors separately
  let serverResponse
  try {
    serverResponse = await sendUploadRequest(formData)
    logStep('UPLOAD', 'Fetch completed — response received from server', { status: serverResponse.status, ok: serverResponse.ok })
  } catch (networkError) {
    logError('UPLOAD', 'Fetch failed — file did not reach backend (network/CORS/backend down)', networkError)
    throw new Error('Not able to reach the backend. Please check your internet and that the server is running.')
  }

  // Step 4: Handle server errors separately
  if (!serverResponse.ok) {
    const errorDetail = await extractErrorDetail(serverResponse)
    logError('UPLOAD', 'Upload server returned error — file reached backend but MODEL failed', { status: serverResponse.status, detail: errorDetail })
    // Use server message if it is useful, else generic
    throw new Error(errorDetail || 'Upload failed. Please check your CSV has a review text column and try again.')
  }

  const json = await serverResponse.json()
  logSuccess('UPLOAD', 'Upload + MODEL success — JSON received, building dashboard', { total: json.total_reviews, concerns: json.ranked_concerns?.length })
  return json
}
