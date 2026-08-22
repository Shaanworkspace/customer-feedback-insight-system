import logo from '../../assets/logo.svg'

export default function AppHeader({ tab, setTab, onUpload }) {
  const tabs = ['dashboard', 'analyzer', 'explorer', 'history']

  return (
    <header className="topbar glass">
      <div className="brand">
        <img src={logo} alt="Customer Feedback Insight System" className="brand-icon" />
        <div>
          <h1>Customer Feedback</h1>
          <span>Insight System</span>
        </div>
      </div>

      <nav className="main-nav">
        {tabs.map((t) => (
          <button
            key={t}
            className={tab === t ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button className="upload-nav-btn" onClick={onUpload}>
          + Upload
        </button>
      </nav>
    </header>
  )
}