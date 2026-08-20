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
      <div className="flex min-h-screen flex-col bg-[#f4f6f9]">
        <SiteHeader />
        <Landing onStart={() => setStage('login')} />
        <SiteFooter />
      </div>
    )
  }

  if (stage === 'login') {
    return (
      <div className="flex min-h-screen flex-col bg-[#f4f6f9]">
        <SiteHeader />
        <Login onLogin={handleLogin} />
        <SiteFooter />
      </div>
    )
  }

  if (stage === 'upload') {
    return (
      <div className="flex min-h-screen flex-col bg-[#f4f6f9]">
        <SiteHeader />
        <Upload onDone={handleUploadDone} onCancel={handleUploadCancel} />
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(39,92,145,0.08),transparent_30%),#f4f6f9]">
      <AppHeader tab={tab} setTab={setTab} onUpload={() => setStage('upload')} />
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