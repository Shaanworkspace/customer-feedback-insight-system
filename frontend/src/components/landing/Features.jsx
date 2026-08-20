export default function Features() {
  const features = [
    {
      icon: '01',
      title: 'Analyze sentiment',
      desc: 'Every review tagged positive or negative automatically.',
    },
    {
      icon: '02',
      title: 'Find hidden concerns',
      desc: 'No fixed list — the system discovers what customers actually mention.',
    },
    {
      icon: '03',
      title: 'Rank by impact',
      desc: 'A clear priority order: fix what hurts customers the most, first.',
    },
    {
      icon: '04',
      title: 'Prove with quotes',
      desc: 'Every problem is backed by real review quotes, not guesses.',
    },
  ]

  return (
    <section className="mx-auto w-full max-w-[1120px] px-6 py-20">
      <div className="mx-auto mb-12 max-w-[700px] text-center">
        <div className="mb-5 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">
          WHAT WE DO
        </div>
        <h2 className="my-3 text-[38px] font-bold text-[#193452]">From raw reviews to a fix-it list</h2>
        <p className="text-[16px] text-[#718198]">Four steps. No manual tagging, no spreadsheets, no guesswork.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {features.map((f) => (
          <div
            className="rounded-2xl border border-[#e1e8f0] bg-white/90 p-7 shadow-[0_8px_25px_rgba(25,52,82,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(25,52,82,0.08)]"
            key={f.icon}
          >
            <div className="mb-5 flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-[#edf3fa] font-extrabold text-[#1b4d80]">
              {f.icon}
            </div>
            <h3 className="mb-2.5 text-[#193452]">{f.title}</h3>
            <p className="leading-relaxed text-[#718198]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}