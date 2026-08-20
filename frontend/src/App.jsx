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

    const result = await uploadReviews(file)

    console.log('Upload result:', result)

    setStage('dashboard')
    setTab('dashboard')
  } catch (err) {
    console.error('Upload failed:', err)
    setError(err.message || 'Upload failed. Please try again.')
  }
}
  /* =========================
     LANDING
  ========================= */

  if (stage === 'landing') {
    return (
      <div className="auth-page landing-page">

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

      </div>
    )
  }

  /* =========================
     LOGIN / SIGN UP
  ========================= */

  if (stage === 'login') {
    const signup = mode === 'signup'

    return (
      <div className="auth-page">

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

      </div>
    )
  }

  /* =========================
     UPLOAD
  ========================= */

  if (stage === 'upload') {
    return (
      <div className="auth-page upload-page">

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