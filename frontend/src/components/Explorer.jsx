import { useEffect, useState } from 'react'
import { getReviews } from '../api'

export default function Explorer() {
  const [reviews, setReviews] = useState([])
  const [concernFilter, setConcernFilter] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(() => setError(true))
  }, [])

  const concernNames = [...new Set(reviews.map((r) => r.entity))]

  const filtered = reviews.filter((r) => {
    const cMatch = !concernFilter || r.entity === concernFilter
    const sMatch = !sentimentFilter || r.sentiment === sentimentFilter
    return cMatch && sMatch
  })

  if (error) {
    return (
      <div className="rounded-[15px] border border-[#ffd5ce] bg-[#fff5f3] p-8 text-center">
        <div className="text-[14px] font-bold text-[#b42318]">Backend is not reachable.</div>
        <p className="mt-2 text-[13px] text-[#8a5a52]">The analysis server is offline or still waking up.</p>
      </div>
    )
  }

  const SENT_CLASS = {
    positive: 'bg-[#eaf8f0] text-[#1f7c46]',
    negative: 'bg-[#fff0ef] text-[#b83b34]',
    mixed: 'bg-[#fff7e6] text-[#b7791f]',
    neutral: 'bg-[#eef1f6] text-[#5a6472]',
  }

  return (
    <section className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
      <div className="mb-5 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Review Explorer</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">{reviews.length} real reviews</p>
        </div>
        <div className="flex flex-col gap-2.5 md:flex-row">
          <select
            className="min-w-[150px] cursor-pointer rounded-lg border border-[#d9e0e8] bg-white px-3 py-2.5 text-[#35465b]"
            value={concernFilter}
            onChange={(e) => setConcernFilter(e.target.value)}
          >
            <option value="">All concerns</option>
            {concernNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="min-w-[150px] cursor-pointer rounded-lg border border-[#d9e0e8] bg-white px-3 py-2.5 text-[#35465b]"
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
          >
            <option value="">All sentiment</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="mixed">Mixed</option>
            <option value="neutral">Neutral</option>
          </select>
          <button
            className="cursor-pointer rounded-lg bg-[#edf3fa] px-4 py-2.5 font-bold text-[#173f73] transition hover:bg-[#dfeaf5]"
            onClick={() => { setConcernFilter(''); setSentimentFilter('') }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e4e9ef]">
        <div className="grid grid-cols-[2fr_1fr_1fr] items-center gap-5 bg-[#f5f7fa] px-4 py-3.5 text-[11px] font-extrabold uppercase tracking-wide text-[#66768b]">
          <span>Review</span>
          <span>Concern</span>
          <span>Sentiment</span>
        </div>
        {filtered.map((r) => (
          <div className="grid grid-cols-[2fr_1fr_1fr] items-center gap-5 border-t border-[#e9edf2] px-4 py-3.5 text-[13px] text-[#34465d] hover:bg-[#fafbfd]" key={r.review_id}>
            <span>{r.text}</span>
            <span className="w-fit rounded-md bg-[#f0f4f8] px-2.5 py-1 text-[10px] font-bold capitalize text-[#536a82]">{r.entity}</span>
            <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ${SENT_CLASS[r.sentiment] || 'bg-[#eef1f6] text-[#5a6472]'}`}>
              {r.sentiment}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-7 text-center text-[13px] text-[#8a96a8]">No reviews match the selected filters.</div>
        )}
      </div>
    </section>
  )
}