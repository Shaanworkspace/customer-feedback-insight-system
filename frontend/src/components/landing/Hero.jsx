export default function Hero({ onStart }) {
  return (
    <section className="relative flex min-h-[68vh] items-center justify-center overflow-hidden px-6 pb-20 pt-[74px]">
      <div
        className="absolute inset-0 bg-cover bg-top blur-[2px] saturate-120"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=70')",
        }}
        role="presentation"
      ></div>
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,63,115,0.25),rgba(23,63,115,0.15)_60%,rgba(244,247,251,0.98))]"
        role="presentation"
      ></div>

      <div className="relative z-10 max-w-[720px] text-center">
        <div className="mb-5 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">
          CUSTOMER INTELLIGENCE PLATFORM
        </div>
        <h1 className="m-0 text-[clamp(42px,7vw,70px)] font-bold leading-none tracking-[-2.8px] text-[#142b48]">
          Customer Feedback
          <span className="text-[#315f89]"> Insight System</span>
        </h1>
        <p className="mx-auto mb-8 mt-6 max-w-[560px] text-[17px] leading-relaxed text-[#6f7f93]">
          Upload the reviews you already have. We find what customers hate,
          why they hate it, and what to fix first — with real proof.
        </p>
        <div className="flex justify-center gap-3">
          <button
            className="cursor-pointer rounded-[9px] border-0 bg-[#173f73] px-5 py-3 font-bold text-white shadow-[0_7px_18px_rgba(23,63,115,0.20)] transition hover:-translate-y-0.5 hover:bg-[#12345f]"
            onClick={onStart}
          >
            Start free
          </button>
        </div>
      </div>
    </section>
  )
}