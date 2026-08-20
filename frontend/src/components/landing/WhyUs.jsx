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
    <section className="landing-section why-section">
      <div className="section-heading">
        <div className="landing-badge">WHY WE ARE BETTER</div>
        <h2>See the difference</h2>
        <p>Three ways we beat the alternatives.</p>
      </div>

      <div className="why-rows">
        {rows.map((row, i) => (
          <div className={`why-row ${i % 2 === 1 ? 'reverse' : ''}`} key={row.badge}>
            <div className="why-media">
              <img src={row.image} alt={row.badge} loading="lazy" />
            </div>

            <div className="why-text">
              <div className="landing-badge">{row.badge}</div>
              <h3>{row.title}</h3>
              <ul>
                {row.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="why-ours">{row.ours}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}