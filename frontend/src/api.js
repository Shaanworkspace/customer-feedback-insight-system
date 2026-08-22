const API_BASE = import.meta.env.VITE_API_BASE || 'https://cfa-api.onrender.com'

let currentBase = API_BASE

const TOKEN_KEY = 'cfa_token'
const USER_KEY = 'cfa_user'

export function setApiBase(base) {
  currentBase = base
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

export async function getMe() {
  const res = await fetch(`${currentBase}/api/v1/auth/me`, { headers: authHeader() })
  if (!res.ok) throw new Error('Failed to load profile')
  const data = await res.json()
  setUser({ first_name: data.first_name, email: data.email })
  return data
}

function authHeader() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function signup(email, password, first_name = '') {
  const res = await fetch(`${currentBase}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password, first_name, email }),
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json()).detail || ''
    } catch {
      // ignore
    }
    throw new Error(detail || 'Signup failed')
  }
  return res.json()
}

export async function login(username, password) {
  const res = await fetch(`${currentBase}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('Invalid username or password')
  return res.json()
}

export async function getStats() {
  const res = await fetch(`${currentBase}/api/v1/stats`, { headers: authHeader() })
  if (!res.ok) throw new Error('Stats request failed')
  return res.json()
}

export async function getReviews() {
  const res = await fetch(`${currentBase}/api/v1/reviews`, { headers: authHeader() })
  if (!res.ok) throw new Error('Reviews request failed')
  return res.json()
}

export async function getConcernComments(concern) {
  const res = await fetch(`${currentBase}/api/v1/concern-comments?concern=${encodeURIComponent(concern)}`, { headers: authHeader() })
  if (!res.ok) throw new Error('Concern comments request failed')
  return res.json()
}

export async function analyzeReview(text) {
  const res = await fetch(`${currentBase}/api/v1/analyze`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_text: text }),
  })
  if (!res.ok) throw new Error('Analysis request failed')
  return res.json()
}

export async function getHistory() {
  const res = await fetch(`${currentBase}/api/v1/history`, { headers: authHeader() })
  if (!res.ok) throw new Error('History request failed')
  return res.json()
}

export async function getHistoryReport(id) {
  const res = await fetch(`${currentBase}/api/v1/history/${id}`, { headers: authHeader() })
  if (!res.ok) throw new Error('Report request failed')
  return res.json()
}

export async function sendReportEmail(email, analysisId) {
  const res = await fetch(`${currentBase}/api/v1/report/email`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, analysis_id: analysisId || null }),
  })
  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data.detail || ''
    } catch {
      // ignore
    }
    throw new Error(detail || 'Could not send email')
  }
  return res.json()
}

export async function uploadReviews(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${currentBase}/api/v1/upload`, {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    })

    if (!res.ok) {
      let detail = ''

      try {
        const data = await res.json()
        detail = data.detail || ''
      } catch {
        // Ignore invalid error response
      }

      console.error('Upload failed:', detail || res.status)

      throw new Error(
        'Not able to connect to the backend. Please try again later.'
      )
    }

    return res.json()
  } catch (error) {
    console.error('Upload error:', error)

    throw new Error(
      'Not able to connect to the backend. Please try again later.'
    )
  }
}
