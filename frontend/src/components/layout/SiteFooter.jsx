export default function SiteFooter() {
  return (
    <footer className="site-footer glass">
      <div>
        <div className="site-logo">CF</div>
        <p>
          Customer Feedback Insight System turns raw reviews into
          ranked, proof-backed actions.
        </p>
      </div>
      <div className="footer-links">
        <div>
          <strong>Product</strong>
          <span>Dashboard</span>
          <span>Analyzer</span>
          <span>Explorer</span>
        </div>
        <div>
          <strong>Company</strong>
          <span>About</span>
          <span>Contact</span>
        </div>
      </div>
      <div className="footer-note">
        <span>© 2026 Customer Feedback Insight System</span>
        <span>Built for the Cognizant hackathon.</span>
      </div>
    </footer>
  )
}