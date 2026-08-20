export default function PriorityConcerns({ concerns }) {
  return (
    <div className="mb-5 rounded-[15px] border border-[#e1e7ef] bg-white p-6 shadow-[0_4px_18px_rgba(25,46,72,0.04)]">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="m-0 text-[18px] font-bold text-[#172f50]">Priority Concerns</h3>
          <p className="mt-1 text-[12px] text-[#8793a5]">Issues requiring the most attention</p>
        </div>
        <span className="rounded-md bg-[#f0f4f8] px-2.5 py-1.5 text-[10px] font-extrabold text-[#60738a]">
          TOP {concerns.length}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {concerns.map((item, index) => (
          <div className="grid grid-cols-[32px_1fr_42px] items-center gap-3" key={item.concern}>
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#edf3fa] text-[12px] font-extrabold text-[#173f73]">
              {index + 1}
            </div>

            <div>
              <div className="mb-2 flex justify-between">
                <strong className="text-[13px] capitalize">{item.concern}</strong>
                <span className="text-[10px] text-[#8a96a8]">{item.count.toLocaleString()} mentions</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[10px] bg-[#edf1f5]">
                <div className="h-full rounded-[10px] bg-[#173f73]" style={{ width: `${item.impact}%` }}></div>
              </div>
              <small className="mt-1 block text-[10px] text-[#8a96a8]">
                {item.negative_pct}% negative sentiment
              </small>
            </div>

            <div className="rounded-lg bg-[#edf3fa] px-1 py-2 text-center text-[12px] font-extrabold text-[#173f73]">
              {item.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}