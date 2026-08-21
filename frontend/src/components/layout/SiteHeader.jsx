import logo from '../../assets/logo.svg'

export default function SiteHeader() {
  return (
    <header className="site-header glass">
      <div className="site-brand">
        <img src={logo} alt="Customer Feedback Insight System" className="site-logo" />
        <div>
          <strong>Customer Feedback</strong>
          <span>Insight System</span>
        </div>
      </div>
      <div className="site-header-badge">AI-powered insights</div>
    </header>
  )
}