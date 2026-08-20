import { useState } from 'react'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import AppHeader from './components/layout/AppHeader'
import Landing from './components/landing/Landing'
import Login from './components/auth/Login'
import Upload from './components/upload/Upload'
import Dashboard from './components/dashboard/Dashboard'
import Analyzer from './components/analyzer/Analyzer'
import Explorer from './components/explorer/Explorer'

export default function App() {
  const [stage, setStage] = useState('landing')
  const [tab, setTab] = useState('dashboard')

  const handleLogin = () => {
    localStorage.setItem('cfa_signed_in', 'true')
    setStage('upload')
  }

  const handleUploadDone = () => {
    setStage('app')
    setTab('dashboard')
  }

  const handleUploadCancel = () => {
    setStage('app')
  }

  if (stage === 'landing') {
    return (
      <div className="site-page">
        <SiteHeader />
        <Landing onStart={() => setStage('login')} />
        <SiteFooter />
      </div>
    )
  }

  if (stage === 'login') {
    return (
      <div className="site-page">
        <SiteHeader />
        <Login onLogin={handleLogin} />
        <SiteFooter />
      </div>
    )
  }

  if (stage === 'upload') {
    return (
      <div className="site-page">
        <SiteHeader />
        <Upload onDone={handleUploadDone} onCancel={handleUploadCancel} />
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <AppHeader tab={tab} setTab={setTab} onUpload={() => setStage('upload')} />
      <main className="page-container">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'analyzer' && <Analyzer />}
        {tab === 'explorer' && <Explorer />}
      </main>
      <footer className="footer">
        <span>Customer Feedback Insight System</span>
        <span>AI-powered customer intelligence</span>
      </footer>
    </div>
  )
}