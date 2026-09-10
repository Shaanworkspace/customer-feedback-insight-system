import { useState } from 'react'
import { login, signup, setToken, setUser } from '../../api'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
