const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

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
export async function uploadReviews(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/api/v1/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    let message = 'Upload failed. Please try again.'

    try {
      const data = await res.json()
      message = data.detail || message
    } catch {
      // Keep default error message
    }

    throw new Error(message)
  }

  return res.json()
}