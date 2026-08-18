export const API_BASE = 'http://localhost:8000'

export async function getStats() {
  const res = await fetch(`${API_BASE}/api/v1/stats`)
  return res.json()
}

export async function analyzeReview(text) {
  const res = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_text: text }),
  })
  return res.json()
}
