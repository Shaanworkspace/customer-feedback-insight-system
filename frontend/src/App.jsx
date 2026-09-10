import { useEffect, useState } from 'react'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import AppHeader from './components/layout/AppHeader'
import Landing from './components/landing/Landing'
import Login from './components/auth/Login'
import Upload from './components/upload/Upload'
import Dashboard from './components/Dashboard'
import Analyzer from './components/Analyzer'
import Explorer from './components/Explorer'
import Profile from './components/Profile'
import { getToken, getUser } from './api'

const APP_VIEWS = ['dashboard', 'analyzer', 'explorer', 'profile']

export default function App() {
  const [signedIn, setSignedIn] = useState(() => !!getToken())
  const [analyzing, setAnalyzing] = useState(false)
  const [reload, setReload] = useState(0)
  const [view, setView] = useState(
    () => new URLSearchParams(window.location.search).get('view') || 'landing'
  )

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get('view')) {
      window.history.replaceState({ view }, '', window.location.pathname)
    }
    const onPop = () => {
      const v = new URLSearchParams(window.location.search).get('view') || 'landing'
      setView(v)
      setAnalyzing(false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (v) => {
    window.history.pushState({ view: v }, '', `?view=${v}`)
    setView(v)
  }

  const handleLogin = () => {
    setSignedIn(true)
    navigate('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('cfa_token')
    localStorage.removeItem('cfa_user')
    setSignedIn(false)
    navigate('landing')
  }

  const handleUploadStart = () => {
    setAnalyzing(true)
    navigate('dashboard')
  }

  const handleUploaded = () => {
    setAnalyzing(false)
    setReload((r) => r + 1)
  }

  let v = view
  // Session: if already signed in, login page should not show — go to dashboard
  if (signedIn && v === 'login') v = 'dashboard'
  if (!signedIn && (v === 'upload' || APP_VIEWS.includes(v))) v = 'login'

  if (v === 'landing') {
    return (
      <div className="site-page">
        <SiteHeader signedIn={signedIn} />
        <Landing onStart={() => navigate(signedIn ? 'dashboard' : 'login')} />
        <SiteFooter />
      </div>
    )
  }

  if (v === 'login') {
    return (
      <div className="site-page">
        <SiteHeader signedIn={signedIn} />
        <Login onLogin={handleLogin} />
        <SiteFooter />
      </div>
    )
  }

  if (v === 'upload') {
    return (
      <div className="page-with-chrome">
        <AppHeader tab="upload" setTab={(t) => navigate(t)} onUpload={() => navigate('upload')} signedIn={signedIn} onLogout={handleLogout} onProfile={() => navigate('profile')} />
        <Upload onStart={handleUploadStart} onDone={handleUploaded} onCancel={() => navigate('dashboard')} />
      </div>
    )
  }

  if (v === 'profile') {
    return (
      <div className="page-with-chrome">
        <AppHeader tab="profile" setTab={(t) => navigate(t)} onUpload={() => navigate('upload')} signedIn={signedIn} onLogout={handleLogout} onProfile={() => navigate('profile')} />
        <main className="page-container">
          <Profile onBack={() => navigate('dashboard')} />
        </main>
      </div>
    )
  }

  return (
    <div className="page-with-chrome">
      <AppHeader tab={v} setTab={(t) => navigate(t)} onUpload={() => navigate('upload')} signedIn={signedIn} onLogout={handleLogout} onProfile={() => navigate('profile')} />
      <main className="page-container">
        {v === 'dashboard' && <Dashboard analyzing={analyzing} reloadKey={reload} onUpload={() => navigate('upload')} onReload={() => setReload((r) => r + 1)} />}
        {v === 'analyzer' && <Analyzer />}
        {v === 'explorer' && <Explorer />}
      </main>
    </div>
  )
}
