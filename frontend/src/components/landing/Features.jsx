export default function Features() {
  const features = [
    {
      icon: '01',
      title: 'Analyze sentiment',
      desc: 'Every review tagged positive, negative, neutral, or mixed automatically.',
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
    <section className="landing-section features-section">
      <div className="section-heading">
        <div className="landing-badge">WHAT WE DO</div>
        <h2>From raw reviews to a fix-it list</h2>
        <p>Four steps. No manual tagging, no spreadsheets, no guesswork.</p>
      </div>

      <div className="feature-grid">
        {features.map((f) => (
          <div className="feature-card" key={f.icon}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}