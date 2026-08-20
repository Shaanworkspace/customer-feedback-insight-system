export default function Login({ onLogin, onBack }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f7fb] px-8 py-8">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1800&q=70')",
        }}
        role="presentation"
      ></div>

      <div className="relative z-10 w-[min(430px,100%)] rounded-[20px] border border-white/50 bg-white/70 p-8 shadow-[0_20px_50px_rgba(23,63,115,0.15)] backdrop-blur-xl">
        <button
          type="button"
          className="mb-5 cursor-pointer rounded-lg border-0 bg-transparent px-0 py-1 text-[13px] font-semibold text-[#315f89] transition hover:text-[#173f73]"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#173f73] font-extrabold text-white">
            CF
          </div>
          <div>
            <strong className="block text-[14px] text-[#193452]">Customer Feedback</strong>
            <span className="mt-0.5 block text-[11px] text-[#8794a6]">Insight System</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-[#47739e]">WELCOME BACK</div>
          <h1 className="my-1.5 text-[28px] font-bold text-[#142b48]">Sign in</h1>
          <p className="text-[13px] leading-relaxed text-[#7a889b]">Sign in to analyze your customer feedback.</p>
        </div>

        <button
          type="button"
          className="w-full cursor-pointer rounded-[9px] border-0 bg-[#173f73] px-5 py-3 font-bold text-white shadow-[0_7px_18px_rgba(23,63,115,0.20)] transition hover:-translate-y-0.5 hover:bg-[#12345f]"
          onClick={onLogin}
        >
          Continue to app
        </button>
      </div>
    </main>
  )
}