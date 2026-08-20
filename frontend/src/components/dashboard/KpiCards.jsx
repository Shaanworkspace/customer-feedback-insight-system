export default function KpiCards({ total, positive, negative, positivePct, negativePct, concernCount }) {
  const cards = [
    { label: 'Total Reviews', value: total.toLocaleString(), sub: '● Dataset analyzed', cls: '' },
    { label: 'Positive Reviews', value: positive.toLocaleString(), sub: `${positivePct}% of all reviews`, cls: 'positive-card' },
    { label: 'Negative Reviews', value: negative.toLocaleString(), sub: `${negativePct}% of all reviews`, cls: 'negative-card' },
    { label: 'Priority Issues', value: concernCount, sub: 'Customer concerns detected', cls: '' },
  ]

  return (
    <section className="stats-grid">
      {cards.map((c) => (
        <div className={`stat-card ${c.cls}`} key={c.label}>
          <div className="stat-top">
            <span className="stat-label">{c.label}</span>
            <span className="stat-icon">▤</span>
          </div>
          <strong>{c.value}</strong>
          <div className="stat-bottom">
            <span className="positive-text">{c.sub}</span>
          </div>
        </div>
      ))}
    </section>
  )
}