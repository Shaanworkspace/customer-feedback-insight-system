import { useState, useEffect } from 'react'
import { login, signup, setToken, setUser, setApiBase } from '../../api'

const LOCAL_BASE = 'http://localhost:8000'
const DEPLOYED_BASE = 'https://cfa-api.onrender.com'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [baseMode, setBaseMode] = useState(
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'local'
      : 'deployed'
  )

  useEffect(() => {
    setApiBase(baseMode === 'local' ? LOCAL_BASE : DEPLOYED_BASE)
  }, [baseMode])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = mode === 'login'
        ? await login(email.trim(), password)
        : await signup(email.trim(), password, firstName.trim())
      setToken(data.token)
      setUser({ first_name: data.first_name, email: data.email })
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

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
          <div className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</div>
          <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p>
            {mode === 'login'
              ? 'Sign in to analyze your customer feedback.'
              : 'Sign up to start analyzing feedback.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {['local', 'deployed'].map((bm) => (
            <button
              key={bm}
              type="button"
              onClick={() => setBaseMode(bm)}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: `1px solid ${baseMode === bm ? '#173f73' : '#c9d4e0'}`,
                background: baseMode === bm ? '#173f73' : '#fff',
                color: baseMode === bm ? '#fff' : '#173f73',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {bm === 'local' ? 'Local' : 'Deployed'}
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              <span>First name</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Aarav"
                autoComplete="given-name"
                required
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="primary-action full-width" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setError('')
            setMode(mode === 'login' ? 'signup' : 'login')
          }}
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
