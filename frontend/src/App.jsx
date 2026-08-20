import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Analyzer from './components/Analyzer'
import Explorer from './components/Explorer'
import { uploadReviews } from './api'

export default function App() {
  const [stage, setStage] = useState('landing')
  const [mode, setMode] = useState('signin')
  const [tab, setTab] = useState('dashboard')
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const SiteHeader = () => (
  <header className="site-header">
    <div className="site-brand">
      <div className="site-logo">CF</div>

      <div>
        <strong>Customer Feedback</strong>
        <span>Insight System</span>
      </div>
    </div>

    <div className="site-header-badge">
      AI-powered insights
    </div>
  </header>
)

const SiteFooter = () => (
  <footer className="site-footer">
    <span>© 2026 Customer Feedback Insight System</span>
    <span>Customer intelligence, simplified.</span>
  </footer>
)

  const openLogin = (loginMode) => {
    setMode(loginMode)
    setError('')
    setStage('login')
  }

  const handleAuth = (e) => {
    e.preventDefault()

    const form = new FormData(e.currentTarget)
    const email = form.get('email')
    const password = form.get('password')

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    localStorage.setItem('cfa_signed_in', 'true')
    setStage('upload')
    setError('')
  }

  const handleFile = (e) => {
    const selected = e.target.files?.[0]

    if (!selected) return

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.')
      setFile(null)
      return
    }

    setFile(selected)
    setError('')
  }

  const handleUpload = async (e) => {
  e.preventDefault()

  if (!file) {
    setError('Please choose a CSV file first.')
    return
  }

  try {
    setError('')

    await uploadReviews(file)

    setStage('dashboard')
    setTab('dashboard')
  } catch (error) {
    console.error('Upload error:', error)

    setError('')
    setStage('dashboard')
    setTab('dashboard')
  }
}
  /* =========================
     LANDING
  ========================= */

  if (stage === 'landing') {
  return (
    <div className="auth-page landing-page page-with-chrome">

      <SiteHeader />

      <div className="landing-content">

        <div className="landing-badge">
          CUSTOMER INTELLIGENCE PLATFORM
        </div>

        <h1>
          Customer Feedback
          <span> Insight System</span>
        </h1>

        <p>
          Understand your customer reviews.
          Find the problems. Fix them in the right order.
        </p>

        <div className="landing-actions">

          <button
            className="primary-action"
            onClick={() => openLogin('signin')}
          >
            Sign in
          </button>

          <button
            className="secondary-action"
            onClick={() => openLogin('signup')}
          >
            Create account
          </button>

        </div>

      </div>
      <section className="landing-section features-section">
  <div className="section-heading">
    <div className="landing-badge">WHAT WE DO</div>
    <h2>Turn feedback into action</h2>
    <p>Understand what your customers like, dislike, and what needs attention.</p>
  </div>

  <div className="feature-grid">
    <div className="feature-card">
      <div className="feature-icon">01</div>
      <h3>Analyze Feedback</h3>
      <p>Analyze thousands of customer reviews and understand overall sentiment.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">02</div>
      <h3>Find Key Concerns</h3>
      <p>Identify the issues customers mention most frequently.</p>
    </div>

    <div className="feature-card">
      <div className="feature-icon">03</div>
      <h3>Prioritize Issues</h3>
      <p>Rank concerns by impact so your team knows what to fix first.</p>
    </div>
  </div>
</section>

<section className="landing-section how-section">
  <div className="section-heading">
    <div className="landing-badge">HOW IT WORKS</div>
    <h2>Three simple steps</h2>
  </div>

  <div className="steps-grid">
    <div className="step-card">
      <span>1</span>
      <h3>Upload</h3>
      <p>Upload your customer review CSV.</p>
    </div>

    <div className="step-card">
      <span>2</span>
      <h3>Analyze</h3>
      <p>Our system analyzes sentiment and customer concerns.</p>
    </div>

    <div className="step-card">
      <span>3</span>
      <h3>Act</h3>
      <p>Use the insights to focus on the most important issues.</p>
    </div>
  </div>
</section>

<section className="landing-section stats-section">
  <div className="stats-panel">
    <div>
      <strong>20,000+</strong>
      <span>Reviews analyzed</span>
    </div>

    <div>
      <strong>4</strong>
      <span>Priority concerns detected</span>
    </div>

    <div>
      <strong>62%</strong>
      <span>Positive sentiment</span>
    </div>
  </div>
</section>

      <SiteFooter />

    </div>
  )
}

  /* =========================
     LOGIN / SIGN UP
  ========================= */

  if (stage === 'login') {
    const signup = mode === 'signup'

    return (
      <div className="auth-page page-with-chrome">
  <SiteHeader />

        <div className="auth-card">

          <div className="auth-brand">
            <div className="brand-icon">CF</div>

            <div>
              <strong>Customer Feedback</strong>
              <span>Insight System</span>
            </div>
          </div>

          <div className="auth-heading">

            <div className="eyebrow">
              {signup ? 'GET STARTED' : 'WELCOME BACK'}
            </div>

            <h1>
              {signup ? 'Create your account' : 'Sign in'}
            </h1>

            <p>
              {signup
                ? 'Create an account to start analyzing customer feedback.'
                : 'Sign in to access your customer insights.'}
            </p>

          </div>

          <form onSubmit={handleAuth} className="auth-form">

            {signup && (
              <label>
                Name
                <input
                  name="name"
                  type="text"
                  placeholder="Your name"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </label>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-action full-width"
            >
              {signup ? 'Create account' : 'Sign in'}
            </button>

          </form>

          <button
            className="back-link"
            onClick={() => openLogin(signup ? 'signin' : 'signup')}
          >
            {signup
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"}
          </button>

          <button
            className="back-link muted"
            onClick={() => setStage('landing')}
          >
            ← Back to home
          </button>

        </div>
      <SiteFooter />  
      </div>
    )
  }

  /* =========================
     UPLOAD
  ========================= */

 if (stage === 'upload') {
  return (
    <div className="auth-page upload-page page-with-chrome">

      <SiteHeader />

      <div className="upload-card">

        <div className="upload-icon">
          ↑
        </div>

        <div className="eyebrow">
          DATA IMPORT
        </div>

        <h1>Upload your reviews</h1>

        <p>
          Drag and drop your CSV file here,
          or choose a file from your computer.
        </p>

        <form onSubmit={handleUpload}>

          <label className="drop-zone">

            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
            />

            <strong>
              {file ? file.name : 'Choose CSV file'}
            </strong>

            <span>
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : 'CSV files only'}
            </span>

          </label>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-action full-width"
          >
            Upload & Continue
          </button>

        </form>

        <div className="upload-format">
          Expected columns:
          <strong> review_text, rating, date</strong>
        </div>

      </div>

      <SiteFooter />

    </div>
  )
}

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div className="app-shell">

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            CF
          </div>

          <div>
            <h1>Customer Feedback</h1>
            <span>Insight System</span>
          </div>

        </div>

        <nav className="main-nav">

          <button
            className={
              tab === 'dashboard'
                ? 'nav-btn active'
                : 'nav-btn'
            }
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={
              tab === 'analyzer'
                ? 'nav-btn active'
                : 'nav-btn'
            }
            onClick={() => setTab('analyzer')}
          >
            Analyzer
          </button>

          <button
            className={
              tab === 'explorer'
                ? 'nav-btn active'
                : 'nav-btn'
            }
            onClick={() => setTab('explorer')}
          >
            Explorer
          </button>

          <button
            className="upload-nav-btn"
            onClick={() => setStage('upload')}
          >
            + Upload
          </button>

        </nav>

      </header>

      <main className="page-container">

        {tab === 'dashboard' && <Dashboard />}

        {tab === 'analyzer' && <Analyzer />}

        {tab === 'explorer' && <Explorer />}

      </main>

      <footer className="footer">
        <span>
          Customer Feedback Insight System
        </span>

        <span>
          AI-powered customer intelligence
        </span>
      </footer>

    </div>
  )
}