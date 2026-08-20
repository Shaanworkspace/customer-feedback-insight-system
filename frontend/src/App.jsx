import { useEffect, useState } from 'react'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import AppHeader from './components/layout/AppHeader'
import Landing from './components/landing/Landing'
import Login from './components/auth/Login'
import Upload from './components/upload/Upload'
import Dashboard from './components/dashboard/Dashboard'
import Analyzer from './components/analyzer/Analyzer'
import Explorer from './components/explorer/Explorer'

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const [segment, tab] = hash.split('/')

  if (segment === 'login') return { stage: 'login', tab: 'dashboard' }
  if (segment === 'upload') return { stage: 'upload', tab: 'dashboard' }
  if (segment === 'app') return { stage: 'app', tab: tab || 'dashboard' }
  return { stage: 'landing', tab: 'dashboard' }
}

export default function App() {
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    const onHash = () => {
      setRoute(parseRoute())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (stage, tab = 'dashboard') => {
    if (stage === 'app') {
      window.location.hash = `#/app/${tab}`
    } else {
      window.location.hash = `#/${stage}`
    }
    setRoute({ stage, tab })
  }

  const { stage, tab } = route

  const handleLogin = () => {
    localStorage.setItem('cfa_signed_in', 'true')
    go('upload')
  }

  const handleUploadDone = () => {
    go('app', 'dashboard')
  }

  const handleUploadCancel = () => {
    go('app')
  }

  if (stage === 'landing') {
    return (
      <div className="flex min-h-screen flex-col bg-[#f4f6f9]">
        <SiteHeader onStart={() => go('login')} />
        <Landing onStart={() => go('login')} />
        <SiteFooter />
      </div>
    )
  }

  if (stage === 'login') {
    return (
      <div className="flex min-h-screen flex-col bg-[#f4f6f9]">
        <SiteHeader onStart={() => go('login')} />
        <Login onLogin={handleLogin} onBack={() => go('landing')} />
        <SiteFooter />
      </div>
    )
  }

  if (stage === 'upload') {
    return (
      <div className="flex min-h-screen flex-col bg-[#f4f6f9]">
        <SiteHeader onStart={() => go('login')} />
        <Upload onDone={handleUploadDone} onCancel={handleUploadCancel} />
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(39,92,145,0.08),transparent_30%),#f4f6f9]">
      <AppHeader tab={tab} setTab={(t) => go('app', t)} onUpload={() => go('upload')} />
      <main className="mx-auto w-[min(1180px,92%)] py-10 pb-14">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'analyzer' && <Analyzer />}
        {tab === 'explorer' && <Explorer />}
      </main>
      <footer className="mx-auto flex w-[min(1180px,92%)] justify-between border-t border-[#e2e7ee] py-6 text-[11px] text-[#8b98a9]">
        <span>Customer Feedback Insight System</span>
        <span>AI-powered customer intelligence</span>
      </footer>
    </div>
  )
}