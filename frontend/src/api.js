const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function getStats() {
  const res = await fetch(`${API_BASE}/api/v1/stats`)
  if (!res.ok) throw new Error('Stats request failed')
  return res.json()
}

export async function getReviews() {
  const res = await fetch(`${API_BASE}/api/v1/reviews`)
  if (!res.ok) throw new Error('Reviews request failed')
  return res.json()
}

export async function pingBackend() {
  const res = await fetch(`${API_BASE}/api/v1/ping`)
  if (!res.ok) throw new Error('Ping failed')
  return res.json()
}

export async function analyzeReview(text) {
  const res = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_text: text }),
  })
  if (!res.ok) throw new Error('Analysis request failed')
  return res.json()
}

export async function uploadReviews(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/v1/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}
