import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Analyzer from './components/Analyzer'
import Explorer from './components/Explorer'

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="app">
      <header>
        <h1>Customer Feedback Insight System</h1>
        <nav>
          <button onClick={() => setTab('dashboard')}>Dashboard</button>
          <button onClick={() => setTab('analyzer')}>Analyzer</button>
          <button onClick={() => setTab('explorer')}>Explorer</button>
        </nav>
      </header>
      <main>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'analyzer' && <Analyzer />}
        {tab === 'explorer' && <Explorer />}
      </main>
    </div>
  )
}