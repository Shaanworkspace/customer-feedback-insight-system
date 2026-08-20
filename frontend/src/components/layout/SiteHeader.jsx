export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-[74px] w-full items-center justify-between px-[6%] border-b border-white/35 bg-white/55 backdrop-blur-xl shadow-[0_8px_32px_rgba(23,63,115,0.08)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#173f73] text-[13px] font-extrabold text-white">
          CF
        </div>
        <div>
          <strong className="block text-[14px] text-[#193452]">Customer Feedback</strong>
          <span className="mt-0.5 block text-[10px] text-[#8794a6]">Insight System</span>
        </div>
      </div>
      <div className="rounded-full bg-[#edf3fa] px-3 py-1.5 text-[10px] font-bold text-[#315f89]">
        AI-powered insights
      </div>
    </header>
  )
}