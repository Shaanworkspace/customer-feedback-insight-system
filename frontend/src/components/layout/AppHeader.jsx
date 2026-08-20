export default function AppHeader({ tab, setTab, onUpload }) {
  const tabs = ['dashboard', 'analyzer', 'explorer']

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon">CF</div>
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