import { useEffect, useState } from 'react'
import { getStats } from '../../api'
import { stats as sampleStats } from '../../sampleData'
import KpiCards from './KpiCards'
import SentimentPanel from './SentimentPanel'
import PriorityConcerns from './PriorityConcerns'
import ProofPanel from './ProofPanel'
import ReviewExplorer from './ReviewExplorer'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(sampleStats))
  }, [])

  if (!stats) {
    return (
      <div className="dashboard-skeleton" aria-label="Loading insights">
        <div className="skel skel-hero"></div>
        <div className="skel-grid">
          <div className="skel skel-card"></div>
          <div className="skel skel-card"></div>
          <div className="skel skel-card"></div>
          <div className="skel skel-card"></div>
        </div>
        <div className="skel skel-panel"></div>
        <div className="skel skel-panel"></div>
      </div>
    )
  }

  const total = stats.total_reviews || 0
  const positive = stats.sentiment_distribution?.positive || 0
  const negative = stats.sentiment_distribution?.negative || 0
  const positivePct = total ? Math.round((positive / total) * 100) : 0
  const negativePct = total ? Math.round((negative / total) * 100) : 0
  const concerns = stats.ranked_concerns || []
  const reviews = stats.representative_reviews || []
  const concernNames = [...new Set(concerns.map((item) => item.concern))]

  return (
    <div className="dashboard">
      <section className="hero">
        <div>
          <div className="eyebrow">CUSTOMER INTELLIGENCE</div>
          <h2>Understand what your customers are saying.</h2>
          <p>Turn thousands of customer reviews into clear, actionable insights.</p>
        </div>
        <div className="hero-badge">
          <span className="status-dot"></span>
          Analysis ready
        </div>
      </section>

      <KpiCards
        total={total}
        positive={positive}
        negative={negative}
        positivePct={positivePct}
        negativePct={negativePct}
        concernCount={concerns.length}
      />

      <section className="analytics-grid">
        <SentimentPanel
          positive={positive}
          negative={negative}
          positivePct={positivePct}
          negativePct={negativePct}
        />
        <PriorityConcerns concerns={concerns} />
      </section>

      <ProofPanel reviews={reviews} />

      <ReviewExplorer reviews={reviews} concernNames={concernNames} />
    </div>
  )
}