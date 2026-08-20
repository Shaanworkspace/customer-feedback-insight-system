export default function HowItWorks() {
  const steps = [
    { n: '1', title: 'Upload', desc: 'Drop your existing reviews CSV.' },
    { n: '2', title: 'Analyze', desc: 'AI reads every review, tags sentiment and concerns.' },
    { n: '3', title: 'Act', desc: 'Get ranked problems with customer proof.' },
  ]

  return (
    <section className="landing-section how-section">
      <div className="section-heading">
        <div className="landing-badge">HOW IT WORKS</div>
        <h2>Three simple steps</h2>
      </div>

      <div className="steps-grid">
        {steps.map((s) => (
          <div className="step-card" key={s.n}>
            <span>{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}