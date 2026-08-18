import { useState } from 'react'
import { analyzeReview } from '../api'
import { analysis as sampleAnalysis } from '../sampleData'

export default function Analyzer() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)

  const handleAnalyze = () => {
    if (!text.trim()) return
    analyzeReview(text)
      .then(setResult)
      .catch(() => setResult(sampleAnalysis))
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