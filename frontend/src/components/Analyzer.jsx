import { useState } from 'react'
import { analyzeReview } from '../api'

export default function Analyzer() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(false)

  const handleAnalyze = () => {
    if (!text.trim()) return
    setError(false)
    analyzeReview(text)
      .then(setResult)
      .catch(() => setError(true))
  }

  return (
    <section>
      <h2>Review Analyzer</h2>
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a review..."
          rows={4}
        />
        <button onClick={handleAnalyze}>Analyze</button>
      </div>
      {error && (
        <div className="mt-4 rounded-lg border border-[#ffd5ce] bg-[#fff5f3] p-3 text-[13px] text-[#b42318]">
          Backend is not reachable. Please try again.
        </div>
      )}
      {result && (
        <div className="result">
          <h3>
            Overall sentiment: {result.overall_sentiment}{' '}
            <span>({Math.round(result.overall_confidence * 100)}%)</span>
          </h3>
          <ul>
            {result.concerns.map((c) => (
              <li key={c.name}>
                {c.name}: {c.sentiment}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}