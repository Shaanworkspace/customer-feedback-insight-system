export default function SiteHeader({ onStart }) {
  return (
    <header className="sticky top-0 z-50 flex h-[76px] w-full items-center justify-between border-b border-white/35 bg-white/60 px-[6%] backdrop-blur-xl shadow-[0_8px_32px_rgba(23,63,115,0.08)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#173f73] to-[#2d6aa8] text-[13px] font-extrabold text-white shadow-[0_4px_12px_rgba(23,63,115,0.25)]">
          CF
        </div>
        <div>
          <strong className="block text-[14px] leading-tight text-[#193452]">Customer Feedback</strong>
          <span className="mt-0.5 block text-[10px] tracking-wide text-[#8794a6]">INSIGHT SYSTEM</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <nav className="mr-3 hidden items-center gap-1 md:flex">
          {['Features', 'How it works', 'Why us'].map((label) => (
            <a
              key={label}
              href="#"
              className="rounded-[8px] px-3.5 py-2 text-[13px] font-semibold text-[#5e6d82] transition hover:bg-[#edf3fa] hover:text-[#173f73]"
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          className="cursor-pointer rounded-[9px] border border-[#173f73] px-4 py-2 text-[13px] font-bold text-[#173f73] transition hover:bg-[#173f73] hover:text-white"
          onClick={onStart}
        >
          Sign in
        </button>
        <button
          className="cursor-pointer rounded-[9px] bg-[#173f73] px-4 py-2 text-[13px] font-bold text-white shadow-[0_5px_14px_rgba(23,63,115,0.25)] transition hover:-translate-y-0.5 hover:bg-[#12345f]"
          onClick={onStart}
        >
          Get started
        </button>
      </div>
    </header>
  )
}