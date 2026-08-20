export default function SiteFooter() {
  return (
    <footer className="border-t border-[#e2e7ee] bg-white/60 px-[6%] py-12 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#173f73] to-[#2d6aa8] text-[13px] font-extrabold text-white">
              CF
            </div>
            <div>
              <strong className="block text-[14px] leading-tight text-[#193452]">Customer Feedback</strong>
              <span className="mt-0.5 block text-[10px] tracking-wide text-[#8794a6]">INSIGHT SYSTEM</span>
            </div>
          </div>
          <p className="mt-4 max-w-[300px] text-[13px] leading-relaxed text-[#7b899c]">
            Turns raw customer reviews into ranked, proof-backed actions.
            Built for the Cognizant hackathon.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <strong className="mb-1 text-[13px] font-bold text-[#173f73]">Product</strong>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">Dashboard</a>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">Analyzer</a>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">Explorer</a>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">Upload</a>
        </div>

        <div className="flex flex-col gap-2.5">
          <strong className="mb-1 text-[13px] font-bold text-[#173f73]">Company</strong>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">About</a>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">How it works</a>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">Contact</a>
        </div>

        <div className="flex flex-col gap-2.5">
          <strong className="mb-1 text-[13px] font-bold text-[#173f73]">Resources</strong>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">Sample CSV</a>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">API docs</a>
          <a href="#" className="w-fit cursor-pointer text-[13px] text-[#7b899c] transition hover:text-[#173f73]">Privacy</a>
        </div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-[1180px] flex-col items-center justify-between gap-3 border-t border-[#e7ebf1] pt-6 text-[12px] text-[#8b98a9] md:flex-row">
        <span>© 2026 Customer Feedback Insight System. All rights reserved.</span>
        <span>AI-powered customer intelligence</span>
      </div>
    </footer>
  )
}