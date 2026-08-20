export default function StatsSection() {
  const stats = [
    { value: '20,000+', label: 'Reviews analyzed' },
    { value: '4', label: 'Priority concerns detected' },
    { value: '62%', label: 'Positive sentiment' },
    { value: '100%', label: 'Proof-backed insights' },
  ]

  return (
    <section className="landing-section stats-section">
      <div className="stats-panel">
        {stats.map((s) => (
          <div key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}