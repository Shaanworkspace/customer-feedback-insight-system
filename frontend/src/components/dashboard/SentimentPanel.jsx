export default function SentimentPanel({ positive, negative, positivePct, negativePct }) {
  return (
    <div className="mb-5 rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Sentiment Distribution</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Overall customer sentiment</p>
        </div>
      </div>

      <div className="flex min-h-[210px] flex-col items-center gap-8 md:flex-row">
        <div
          className="flex h-[175px] w-[175px] shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(
              #173f73 0 ${positivePct}%,
              #e05252 ${positivePct}% 100%
            )`,
          }}
        >
          <div className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full bg-white">
            <strong className="text-[25px] font-bold text-[#173f73]">{positivePct}%</strong>
            <span className="text-[11px] text-[#8995a7]">Positive</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-5 grid grid-cols-[12px_1fr_auto] items-center gap-2.5">
            <span className="h-[9px] w-[9px] rounded-full bg-[#173f73]"></span>
            <div className="flex flex-col">
              <strong className="text-[13px]">Positive</strong>
              <span className="mt-0.5 text-[11px] text-[#8a96a8]">{positive.toLocaleString()} reviews</span>
            </div>
            <b className="text-[13px] text-[#53647a]">{positivePct}%</b>
          </div>

          <div className="grid grid-cols-[12px_1fr_auto] items-center gap-2.5">
            <span className="h-[9px] w-[9px] rounded-full bg-[#e05252]"></span>
            <div className="flex flex-col">
              <strong className="text-[13px]">Negative</strong>
              <span className="mt-0.5 text-[11px] text-[#8a96a8]">{negative.toLocaleString()} reviews</span>
            </div>
            <b className="text-[13px] text-[#53647a]">{negativePct}%</b>
          </div>
        </div>
      </div>
    </div>
  )
}