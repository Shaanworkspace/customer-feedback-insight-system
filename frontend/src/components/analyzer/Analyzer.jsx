import { useState } from 'react'
import { analyzeReview } from '../../api'

export default function Analyzer() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleAnalyze = () => {
    if (!text.trim()) return
    setError('')
    analyzeReview(text)
      .then(setResult)
      .catch(() => setError('Backend is not reachable. Please try again.'))
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Review Analyzer</h3>
            <p className="mt-1 text-[12px] text-[#8793a5]">Analyze a single review in seconds</p>
          </div>
        </div>

        <textarea
          className="mb-3.5 w-full resize-y rounded-[10px] border border-[#dbe3ec] p-3.5 text-[#172033]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a review..."
          rows={4}
        />
        <button
          type="button"
          className="cursor-pointer rounded-[9px] border-0 bg-[#173f73] px-5 py-3 font-bold text-white shadow-[0_7px_18px_rgba(23,63,115,0.20)] transition hover:-translate-y-0.5 hover:bg-[#12345f]"
          onClick={handleAnalyze}
        >
          Analyze
        </button>
      </div>

      {error && (
        <div className="rounded-[15px] border border-[#ffd5ce] bg-[#fff5f3] p-5 text-[13px] font-semibold text-[#b42318]">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
          <div className="mb-5 flex items-start justify-between">
            <h3 className="m-0 text-[18px] font-bold text-[#172f50]">
              Overall sentiment: {result.overall_sentiment}{' '}
              <span className="text-[#8793a5]">({Math.round(result.overall_confidence * 100)}%)</span>
            </h3>
          </div>
          <ul className="m-0 list-none p-0">
            {result.concerns.map((c) => (
              <li
                className="flex items-center justify-between border-b border-[#eef2f7] py-3"
                key={c.name}
              >
                <strong>{c.name}</strong>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ${
                    c.sentiment === 'positive'
                      ? 'bg-[#eaf8f0] text-[#1f7c46]'
                      : 'bg-[#fff0ef] text-[#b83b34]'
                  }`}
                >
                  {c.sentiment}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}