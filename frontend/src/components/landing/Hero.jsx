export default function Hero({ onStart }) {
  return (
    <section className="landing-hero">
      <div className="landing-content">
        <div className="landing-badge">CUSTOMER INTELLIGENCE PLATFORM</div>
        <h1>
          Customer Feedback
          <span> Insight System</span>
        </h1>
        <p>
          Upload the reviews you already have. We find what customers hate,
          why they hate it, and what to fix first — with real proof.
        </p>
        <div className="landing-actions">
          <button className="primary-action" onClick={onStart}>
            Start free
          </button>
        </div>
      </div>
    </section>
  )
}