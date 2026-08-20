const API_BASE = import.meta.env.VITE_API_BASE || 'https://cfa-api.onrender.com'

export async function getStats() {
  const res = await fetch(`${API_BASE}/api/v1/stats`)

  if (!res.ok) {
    throw new Error('Stats request failed')
  }

  return res.json()
}

export async function analyzeReview(text) {
  const res = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_text: text }),
  })

  if (!res.ok) {
    throw new Error('Analysis request failed')
  }

  return res.json()
}

export async function uploadReviews(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_BASE}/api/v1/upload`, {
      method: 'POST',
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