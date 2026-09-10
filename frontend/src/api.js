const API_BASE = import.meta.env.VITE_API_BASE || 'https://cfa-api.onrender.com'

let currentApiBaseUrl = API_BASE

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
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleUnauthorizedAndRedirect(response) {
  if (response.status === 401) {
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
  const response = await fetch(`${currentApiBaseUrl}/api/v1/auth/me`, { headers: buildAuthHeader() })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Failed to load profile')
  }
  const data = await response.json()
  setUser({ first_name: data.first_name, email: data.email })
  return data
}

export async function signup(email, password, firstName = '') {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password, first_name: firstName, email }),
  })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Signup failed')
  }
  return response.json()
}

export async function login(username, password) {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Invalid username or password')
  }
  return response.json()
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
  const response = await fetch(`${currentApiBaseUrl}/api/v1/concern-comments?concern=${encodeURIComponent(concernName)}`, {
    headers: buildAuthHeader(),
  })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Concern comments request failed')
  }
  return response.json()
}

export async function analyzeReview(reviewText) {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/analyze`, {
    method: 'POST',
    headers: { ...buildAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_text: reviewText }),
  })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Analysis request failed')
  }
  return response.json()
}

export async function getHistory() {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/history`, { headers: buildAuthHeader() })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'History request failed')
  }
  return response.json()
}

export async function getHistoryReport(analysisId) {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/history/${analysisId}`, { headers: buildAuthHeader() })
  if (!response.ok) {
    const detail = await extractErrorDetail(response)
    throw new Error(detail || 'Report request failed')
  }
  return response.json()
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
  const formData = new FormData()
  formData.append('file', csvFile)
  return formData
}

async function sendUploadRequest(formData) {
  const response = await fetch(`${currentApiBaseUrl}/api/v1/upload`, {
    method: 'POST',
    headers: buildAuthHeader(),
    body: formData,
  })
  return response
}

export async function uploadReviews(csvFile) {
  // Step 1: Validate file before sending
  if (!csvFile) {
    throw new Error('Please choose a CSV file first.')
  }

  // Step 2: Build request
  const formData = buildUploadFormData(csvFile)

  // Step 3: Send and handle network errors separately
  let serverResponse
  try {
    serverResponse = await sendUploadRequest(formData)
  } catch (networkError) {
    console.error('Upload network error:', networkError)
    throw new Error('Not able to reach the backend. Please check your internet and that the server is running.')
  }

  // Step 4: Handle server errors separately
  if (!serverResponse.ok) {
    const errorDetail = await extractErrorDetail(serverResponse)
    console.error('Upload server error:', errorDetail || serverResponse.status)
    // Use server message if it is useful, else generic
    throw new Error(errorDetail || 'Upload failed. Please check your CSV has a review text column and try again.')
  }

  return serverResponse.json()
}
