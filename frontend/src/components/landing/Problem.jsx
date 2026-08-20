export default function Problem() {
  return (
    <section className="landing-section problem-section">
      <div className="section-heading">
        <div className="landing-badge">THE PROBLEM</div>
        <h2>Feedback tools ask you to do extra work</h2>
        <p>
          Review-collection tools beg your customers for new surveys.
          Analytics toolkits dump charts on you without telling you what matters.
        </p>
      </div>

      <div className="compare-grid">
        <div className="compare-card">
          <h3>Survey tools</h3>
          <p>
            Ask customers for feedback again and again. Slow, low response,
            and you still have to read everything yourself.
          </p>
        </div>

        <div className="compare-card">
          <h3>Analytics toolkits</h3>
          <p>
            Hand you dozens of charts and dashboards. No clear answer to the
            only question you care about: what do we fix first?
          </p>
        </div>

        <div className="compare-card ours">
          <h3>Our way</h3>
          <p>
            Use the reviews you already have. Get a ranked list of problems,
            each backed by real customer quotes. Zero extra work.
          </p>
        </div>
      </div>
    </section>
  )
}