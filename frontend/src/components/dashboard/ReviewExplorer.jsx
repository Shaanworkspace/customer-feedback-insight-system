import { useState } from 'react'

export default function ReviewExplorer({ reviews, concernNames }) {
  const [concernFilter, setConcernFilter] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')

  const filteredReviews = reviews.filter((review) => {
    const concernMatch =
      !concernFilter ||
      review.text.toLowerCase().includes(concernFilter.toLowerCase())
    const sentimentMatch =
      !sentimentFilter ||
      review.sentiment === sentimentFilter
    return concernMatch && sentimentMatch
  })

  return (
    <section className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Review Explorer</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Filter representative customer feedback</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2.5 md:flex-row">
        <select
          className="min-w-[150px] cursor-pointer rounded-lg border border-[#d9e0e8] bg-white px-3 py-2.5 text-[#35465b]"
          value={concernFilter}
          onChange={(e) => setConcernFilter(e.target.value)}
        >
          <option value="">All concerns</option>
          {concernNames.map((concern) => (
            <option key={concern} value={concern}>{concern}</option>
          ))}
        </select>

        <select
          className="min-w-[150px] cursor-pointer rounded-lg border border-[#d9e0e8] bg-white px-3 py-2.5 text-[#35465b]"
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
        >
          <option value="">All sentiment</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>

        <button
          className="cursor-pointer rounded-lg bg-[#edf3fa] px-4 py-2.5 font-bold text-[#173f73] transition hover:bg-[#dfeaf5]"
          onClick={() => {
            setConcernFilter('')
            setSentimentFilter('')
          }}
        >
          Clear filters
        </button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e4e9ef]">
        <div className="grid grid-cols-[2fr_1fr_1fr] items-center gap-5 bg-[#f5f7fa] px-4 py-3.5 text-[11px] font-extrabold uppercase tracking-wide text-[#66768b]">
          <span>Review</span>
          <span>Concern</span>
          <span>Sentiment</span>
        </div>

        {filteredReviews.map((review) => {
          const matchedConcern = concernNames.find((concern) =>
            review.text.toLowerCase().includes(concern.toLowerCase())
          )
          return (
            <div
              className="grid grid-cols-[2fr_1fr_1fr] items-center gap-5 border-t border-[#e9edf2] px-4 py-3.5 text-[13px] text-[#34465d] hover:bg-[#fafbfd]"
              key={review.review_id}
            >
              <span>{review.text}</span>
              <span className="w-fit rounded-md bg-[#f0f4f8] px-2.5 py-1 text-[10px] font-bold capitalize text-[#536a82]">
                {matchedConcern || 'General'}
              </span>
              <span
                className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ${
                  review.sentiment === 'positive'
                    ? 'bg-[#eaf8f0] text-[#1f7c46]'
                    : 'bg-[#fff0ef] text-[#b83b34]'
                }`}
              >
                {review.sentiment}
              </span>
            </div>
          )
        })}

        {filteredReviews.length === 0 && (
          <div className="p-7 text-center text-[13px] text-[#8a96a8]">
            No reviews match the selected filters.
          </div>
        )}
      </div>
    </section>
  )
}