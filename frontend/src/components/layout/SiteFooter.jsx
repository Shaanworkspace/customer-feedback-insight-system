export default function SiteFooter() {
  return (
    <footer className="grid w-full items-start gap-8 border-t border-white/35 bg-white/55 px-[6%] py-9 text-[13px] text-[#5f6d80] backdrop-blur-xl md:grid-cols-[1.4fr_1fr_1fr]">
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#173f73] text-[13px] font-extrabold text-white">
          CF
        </div>
        <p className="mt-4 max-w-[320px] text-[13px] leading-relaxed text-[#7b899c]">
          Customer Feedback Insight System turns raw reviews into
          ranked, proof-backed actions.
        </p>
      </div>
      <div className="flex gap-10">
        <div className="flex flex-col gap-2">
          <strong className="mb-1.5 text-[#173f73]">Product</strong>
          <span className="cursor-pointer text-[#7b899c]">Dashboard</span>
          <span className="cursor-pointer text-[#7b899c]">Analyzer</span>
          <span className="cursor-pointer text-[#7b899c]">Explorer</span>
        </div>
        <div className="flex flex-col gap-2">
          <strong className="mb-1.5 text-[#173f73]">Company</strong>
          <span className="cursor-pointer text-[#7b899c]">About</span>
          <span className="cursor-pointer text-[#7b899c]">Contact</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-right md:flex-row-reverse md:items-start">
        <span className="text-[#7b899c]">© 2026 Customer Feedback Insight System</span>
        <span className="text-[#7b899c]">Built for the Cognizant hackathon.</span>
      </div>
    </footer>
  )
}