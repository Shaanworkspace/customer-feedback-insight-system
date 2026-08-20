import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Analyzer from './components/Analyzer'
import Explorer from './components/Explorer'
import Upload from './components/Upload'
import { uploadReviews } from './api'

export default function App() {
  const [stage, setStage] = useState('landing')
  const [mode, setMode] = useState('signin')
  const [tab, setTab] = useState('dashboard')
  const [error, setError] = useState('')

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

  const handleUpload = async (file) => {
    try {
      await uploadReviews(file)
      setStage('dashboard')
      setTab('dashboard')
      return true
    } catch (err) {
      console.error('Upload failed:', err)
      return false
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
      <Upload onUpload={handleUpload} onBack={() => setStage('landing')} />
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