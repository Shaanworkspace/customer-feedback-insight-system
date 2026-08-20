import { useState } from 'react'
import { analyzeReview } from '../../api'
import { analysis as sampleAnalysis } from '../../sampleData'

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
    <section className="analyzer-page">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Review Analyzer</h3>
            <p>Analyze a single review in seconds</p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a review..."
          rows={4}
        />
        <button type="button" className="primary-action" onClick={handleAnalyze}>
          Analyze
        </button>
      </div>

      {result && (
        <div className="panel result-panel">
          <div className="panel-header">
            <h3>
              Overall sentiment: {result.overall_sentiment}{' '}
              <span>({Math.round(result.overall_confidence * 100)}%)</span>
            </h3>
          </div>
          <ul className="concern-list">
            {result.concerns.map((c) => (
              <li key={c.name}>
                <strong>{c.name}</strong>
                <span className={`sentiment-pill ${c.sentiment}`}>{c.sentiment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}