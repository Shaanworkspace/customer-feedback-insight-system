import { useEffect, useState } from 'react'
import { getStats } from '../api'
import { stats as sampleStats } from '../sampleData'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(sampleStats))
  }, [])

  if (!stats) return <p>Loading...</p>

  const total = stats.total_reviews
  const pos = stats.sentiment_distribution.positive
  const neg = stats.sentiment_distribution.negative
  const posPct = Math.round((pos / total) * 100)
  const negPct = 100 - posPct

  return (
    <section>
      <h2>Dashboard</h2>
      <div className="cards">
        <div className="card">
          <h3>{total}</h3>
          <p>Total reviews</p>
        </div>
        <div className="card">
          <h3>{pos} / {neg}</h3>
          <p>Positive / Negative ({posPct}% / {negPct}%)</p>
        </div>
      </div>
      <h3>Priority concerns</h3>
      <table>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Concern</th>
            <th>Count</th>
            <th>Negative %</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
          {stats.ranked_concerns.map((c) => (
            <tr key={c.concern}>
              <td>{c.priority}</td>
              <td>{c.concern}</td>
              <td>{c.count}</td>
              <td>{c.negative_pct}</td>
              <td>{c.impact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}