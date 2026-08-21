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

const APP_VIEWS = ['dashboard', 'analyzer', 'explorer']

export default function App() {
  const [signedIn, setSignedIn] = useState(false)
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
    navigate('upload')
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
  if (!signedIn && (v === 'upload' || APP_VIEWS.includes(v))) v = 'login'

  if (v === 'landing') {
    return (
      <div className="site-page">
        <SiteHeader />
        <Landing onStart={() => navigate('login')} />
        <SiteFooter />
      </div>
    )
  }

  if (v === 'login') {
    return (
      <div className="site-page">
        <SiteHeader />
        <Login onLogin={handleLogin} />
        <SiteFooter />
      </div>
    )
  }

  if (v === 'upload') {
    return (
      <Upload onStart={handleUploadStart} onDone={handleUploaded} onCancel={() => navigate('dashboard')} />
    )
  }

  return (
    <div className="page-with-chrome">
      <AppHeader tab={v} setTab={(t) => navigate(t)} onUpload={() => navigate('upload')} />
      <main className="page-container">
        {v === 'dashboard' && <Dashboard analyzing={analyzing} reloadKey={reload} />}
        {v === 'analyzer' && <Analyzer />}
        {v === 'explorer' && <Explorer />}
      </main>
    </div>
  )
}
