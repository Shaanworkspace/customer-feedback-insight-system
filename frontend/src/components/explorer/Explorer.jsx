import { stats as sampleStats } from '../../sampleData'

export default function Explorer() {
  const reviews = sampleStats.representative_reviews

  return (
    <section className="rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Review Explorer</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Browse representative customer feedback</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e4e9ef]">
        <div className="grid grid-cols-[2fr_1fr] items-center gap-5 bg-[#f5f7fa] px-4 py-3.5 text-[11px] font-extrabold uppercase tracking-wide text-[#66768b]">
          <span>Review</span>
          <span>Sentiment</span>
        </div>

        {reviews.map((r) => (
          <div
            className="grid grid-cols-[2fr_1fr] items-center gap-5 border-t border-[#e9edf2] px-4 py-3.5 text-[13px] text-[#34465d] hover:bg-[#fafbfd]"
            key={r.review_id}
          >
            <span>{r.text}</span>
            <span
              className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ${
                r.sentiment === 'positive'
                  ? 'bg-[#eaf8f0] text-[#1f7c46]'
                  : 'bg-[#fff0ef] text-[#b83b34]'
              }`}
            >
              {r.sentiment}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}