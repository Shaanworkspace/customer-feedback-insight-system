import { useState } from 'react'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import AppHeader from './components/layout/AppHeader'
import Landing from './components/landing/Landing'
import Login from './components/auth/Login'
import Upload from './components/upload/Upload'
import Dashboard from './components/Dashboard'
import Analyzer from './components/Analyzer'
import Explorer from './components/Explorer'

export default function App() {
  const [stage, setStage] = useState('landing')
  const [tab, setTab] = useState('dashboard')
  const [signedIn, setSignedIn] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [reload, setReload] = useState(0)

  const handleLogin = () => {
    setSignedIn(true)
    setStage('upload')
  }

  const handleUploadStart = () => {
    setStage('app')
    setTab('dashboard')
    setAnalyzing(true)
  }

  const handleUploaded = () => {
    setAnalyzing(false)
    setReload((r) => r + 1)
  }

  if (!signedIn) {
    if (stage === 'landing') {
      return (
        <div className="site-page">
          <SiteHeader />
          <Landing onStart={() => setStage('login')} />
          <SiteFooter />
        </div>
      )
    }
    return (
      <div className="site-page">
        <SiteHeader />
        <Login onLogin={handleLogin} />
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="page-with-chrome">
      <AppHeader tab={tab} setTab={setTab} onUpload={() => setStage('upload')} />
      <main className="page-container">
        {tab === 'dashboard' && <Dashboard analyzing={analyzing} reloadKey={reload} />}
        {tab === 'analyzer' && <Analyzer />}
        {tab === 'explorer' && <Explorer />}
      </main>
      {stage === 'upload' && (
        <Upload onStart={handleUploadStart} onDone={handleUploaded} onCancel={() => setStage('app')} />
      )}
    </div>
  )
}
