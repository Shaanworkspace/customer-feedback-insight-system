export default function ProofPanel({ reviews }) {
  return (
    <section className="mb-5 rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Customer Proof</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Representative feedback from your customers</p>
        </div>
        <span className="rounded-md bg-[#f0f4f8] px-2.5 py-1.5 text-[10px] font-extrabold text-[#60738a]">
          {reviews.length} reviews
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <div className="relative rounded-xl border border-[#e7ebf1] bg-[#f8fafc] p-5" key={review.review_id}>
            <div className="absolute right-4 top-1 font-serif text-[45px] text-[#dce5ef]">“</div>
            <p className="mb-5 mt-1 text-[14px] leading-relaxed text-[#35465b]">{review.text}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8a96a8]">Review #{review.review_id}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ${
                  review.sentiment === 'positive'
                    ? 'bg-[#eaf8f0] text-[#1f7c46]'
                    : 'bg-[#fff0ef] text-[#b83b34]'
                }`}
              >
                {review.sentiment}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}