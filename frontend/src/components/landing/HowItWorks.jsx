export default function HowItWorks() {
  const steps = [
    { n: '1', title: 'Upload', desc: 'Drop your existing reviews CSV.' },
    { n: '2', title: 'Analyze', desc: 'AI reads every review, tags sentiment and concerns.' },
    { n: '3', title: 'Act', desc: 'Get ranked problems with customer proof.' },
  ]

  return (
    <section className="mx-auto w-full max-w-[1120px] px-6 py-20">
      <div className="mx-auto mb-12 max-w-[700px] text-center">
        <div className="mb-5 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">
          HOW IT WORKS
        </div>
        <h2 className="my-3 text-[38px] font-bold text-[#193452]">Three simple steps</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <div
            className="rounded-2xl border border-[#e1e8f0] bg-white/90 p-7 shadow-[0_8px_25px_rgba(25,52,82,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(25,52,82,0.08)]"
            key={s.n}
          >
            <span className="mb-4 inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#193f70] font-bold text-white">
              {s.n}
            </span>
            <h3 className="mb-2.5 text-[#193452]">{s.title}</h3>
            <p className="leading-relaxed text-[#718198]">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}