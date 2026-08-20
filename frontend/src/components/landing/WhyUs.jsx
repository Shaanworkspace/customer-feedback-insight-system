const rows = [
  {
    image:
      'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=900&q=70',
    badge: 'VS SURVEY TOOLS',
    title: 'No new surveys. No begging for feedback.',
    points: [
      'Survey tools ask your customers for more opinions — slow and low response.',
      'We use the reviews you already have. Zero extra work for your team.',
    ],
    ours: 'Best part: you get insights in minutes, not weeks.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=70',
    badge: 'VS ANALYTICS TOOLKITS',
    title: 'Not charts. A fix-it list with proof.',
    points: [
      'Toolkits dump dozens of dashboards on you and leave you guessing.',
      'We rank problems by impact and back every one with real customer quotes.',
    ],
    ours: 'Best part: you always know exactly what to fix first.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=70',
    badge: 'VS MANUAL SPREADSHEETS',
    title: 'AI finds what humans miss.',
    points: [
      'Reading 20,000 reviews by hand takes days and misses the patterns.',
      'Our AI reads every review, spots hidden concerns, and keeps learning.',
    ],
    ours: 'Best part: nothing is missed, and nothing is guessed.',
  },
]

export default function WhyUs() {
  return (
    <section className="mx-auto w-4/5 max-w-[1280px] py-20 text-left">
      <div className="mb-12 max-w-[640px]">
        <div className="mb-5 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">
          WHY WE ARE BETTER
        </div>
        <h2 className="my-4 text-[42px] font-bold leading-tight tracking-tight text-[#142b48]">
          Three ways we beat the alternatives
        </h2>
        <p className="text-[16px] text-[#6f7f93]">See the real difference — with focus on what matters.</p>
      </div>

      <div className="flex flex-col gap-10">
        {rows.map((row, i) => (
          <div
            className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-white/70 bg-white/65 p-7 shadow-[0_12px_40px_rgba(23,63,115,0.08)] transition hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(23,63,115,0.16)] md:grid-cols-2"
            key={row.badge}
          >
            <div className={`overflow-hidden rounded-[18px] ${i % 2 === 1 ? 'md:order-2' : ''}`}>
              <img
                className="h-[340px] w-full rounded-[18px] object-cover transition duration-500 hover:scale-105 md:h-[230px]"
                src={row.image}
                alt={row.badge}
                loading="lazy"
              />
            </div>

            <div>
              <div className="mb-5 inline-block rounded-full bg-[#eaf1f8] px-3 py-1.5 text-[10px] font-extrabold tracking-[1.3px] text-[#315f89]">
                {row.badge}
              </div>
              <h3 className="mb-4 text-[34px] font-bold leading-tight text-[#142b48]">{row.title}</h3>
              <ul className="mb-5 pl-6 text-[16px] leading-relaxed text-[#5f6d80]">
                {row.points.map((p) => (
                  <li className="mb-2.5" key={p}>{p}</li>
                ))}
              </ul>
              <p className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#173f73,#2c6bb4)] px-4 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(23,63,115,0.25)]">
                {row.ours}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}