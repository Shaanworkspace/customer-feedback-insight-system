import { useState } from 'react'
import { analyzeReview } from '../api'

const EXAMPLES = [
  'Battery drains very fast and dies within 2 hours of use.',
  'Camera quality is stunning with sharp, vivid photos.',
  'Delivery was very late and customer service was rude.',
  'Not worth the price at all, totally disappointed.',
  'The design is beautiful but the battery life is terrible.',
  'The package was delivered yesterday with no damage.',
]

const SENT = {
  positive: { bg: '#eaf8f0', color: '#1f7c46', label: 'Positive' },
  negative: { bg: '#fff0ef', color: '#b83b34', label: 'Negative' },
  mixed: { bg: '#fff7e6', color: '#b7791f', label: 'Mixed' },
  neutral: { bg: '#eef1f6', color: '#5a6472', label: 'Neutral' },
}

export default function Analyzer() {
  const [text, setText] = useState(EXAMPLES[0])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleAnalyze = () => {
    const t = text.trim()
    if (!t) return
    setLoading(true)
    setError(false)
    analyzeReview(t)
      .then((r) => {
        setResult(r)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }

  const sent = SENT[result?.overall_sentiment] || SENT.positive
  const conf = Math.round((result?.overall_confidence || 0) * 100)

  return (
    <>
      <div className="hero">
        <div>
          <div className="eyebrow">AI REVIEW ANALYSIS</div>
          <h2>Review Analyzer</h2>
          <p>Paste a single customer review to get instant sentiment, detected concerns, and the exact terms that triggered them.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Analyze a review</h3>
            <p>Type or paste any product or service review below.</p>
          </div>
        </div>

        <div className="analyzer-input">
          <div className="analyzer-input-head">
            <span className="analyzer-input-label">Paste your review here</span>
            <span className="char-count">{text.length} characters</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a customer review here…"
            rows={6}
          />
        </div>

        <div className="analyzer-examples">
          {EXAMPLES.map((ex, i) => (
            <button key={i} type="button" className="example-chip" onClick={() => setText(ex)}>
              {ex.length > 46 ? ex.slice(0, 46) + '…' : ex}
            </button>
          ))}
        </div>

        <div className="analyzer-actions">
          <button className="primary-action" onClick={handleAnalyze} disabled={loading || !text.trim()}>
            {loading ? <span className="btn-spinner" /> : 'Analyze review'}
          </button>
        </div>

        {error && (
          <div className="form-error analyzer-error">
            Backend is not reachable. Please try again.
          </div>
        )}
      </div>

      {result && !loading && (
        <div className="analyzer-results">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Overall sentiment</h3>
                <p>Confidence across the full review.</p>
              </div>
              <span className="sentiment-pill" style={{ background: sent.bg, color: sent.color }}>
                {sent.label}
              </span>
            </div>

            <div className="overall-meter">
              <div className="overall-meter-track">
                <div
                  className="overall-meter-fill"
                  style={{ width: `${conf}%`, background: sent.color }}
                />
              </div>
              <span className="overall-meter-value">{conf}%</span>
            </div>

            <div className="overall-sub">
              {result.concerns.length} concern{result.concerns.length !== 1 && 's'} detected
            </div>

            {result.review_text && (
              <blockquote className="analyzed-text">“{result.review_text}”</blockquote>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Detected concerns</h3>
                <p>Key issues identified with the matching terms.</p>
              </div>
            </div>

            {result.concerns.length === 0 ? (
              <div className="empty-state">No specific concerns detected in this review.</div>
            ) : (
              <ul className="concern-list">
                {result.concerns.map((c, i) => {
                  const cs = SENT[c.sentiment] || SENT.positive
                  return (
                    <li key={i} className="concern-row">
                      <div className="concern-main">
                        <span className="concern-name">{c.name.replace(/_/g, ' ')}</span>
                        <span className="concern-terms">
                          {(c.matched_terms || []).map((t, j) => (
                            <span key={j} className="term-chip">
                              {t}
                            </span>
                          ))}
                        </span>
                      </div>
                      <div className="concern-side">
                        <span className="sentiment-pill" style={{ background: cs.bg, color: cs.color }}>
                          {cs.label}
                        </span>
                        <span className="concern-conf">
                          {Math.round((c.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
