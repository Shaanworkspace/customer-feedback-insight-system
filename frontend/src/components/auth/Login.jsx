export default function Login({ onLogin }) {
  return (
    <div className="auth-page">
      <div className="auth-bg" role="presentation"></div>
      <div className="auth-card glass-card">
        <div className="auth-brand">
          <div className="brand-icon">CF</div>
          <div>
            <strong>Customer Feedback</strong>
            <span>Insight System</span>
          </div>
        </div>

        <div className="auth-heading">
          <div className="eyebrow">WELCOME BACK</div>
          <h1>Sign in</h1>
          <p>Sign in to analyze your customer feedback.</p>
        </div>

        <button type="button" className="primary-action full-width" onClick={onLogin}>
          Continue to app
        </button>
      </div>
    </div>
  )
}