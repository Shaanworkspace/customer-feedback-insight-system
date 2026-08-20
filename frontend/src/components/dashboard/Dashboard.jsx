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
      <div className="flex flex-col gap-5" aria-label="Loading insights">
        <div className="h-[140px] animate-pulse rounded-[14px] bg-[#e6ecf3]"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="h-[120px] animate-pulse rounded-[14px] bg-[#e6ecf3]"></div>
          <div className="h-[120px] animate-pulse rounded-[14px] bg-[#e6ecf3]"></div>
          <div className="h-[120px] animate-pulse rounded-[14px] bg-[#e6ecf3]"></div>
          <div className="h-[120px] animate-pulse rounded-[14px] bg-[#e6ecf3]"></div>
        </div>
        <div className="h-[260px] animate-pulse rounded-[14px] bg-[#e6ecf3]"></div>
        <div className="h-[260px] animate-pulse rounded-[14px] bg-[#e6ecf3]"></div>
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

  const emailBody = encodeURIComponent(
    `Customer Feedback Insight System — Summary\n\n` +
    `Total reviews: ${total.toLocaleString()}\n` +
    `Positive: ${positive.toLocaleString()} (${positivePct}%)\n` +
    `Negative: ${negative.toLocaleString()} (${negativePct}%)\n\n` +
    `Priority concerns:\n` +
    concerns.map((c, i) => `${i + 1}. ${c.concern} — ${c.count.toLocaleString()} mentions, ${c.negative_pct}% negative (impact ${c.impact})`).join('\n')
  )

  return (
    <div className="w-full">
      <section className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-[#47739e]">CUSTOMER INTELLIGENCE</div>
          <h2 className="m-0 text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-[#142b48]">
            Understand what your customers are saying.
          </h2>
          <p className="mt-2 text-[15px] text-[#718097]">
            Turn thousands of customer reviews into clear, actionable insights.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="rounded-full border border-[#ccebd7] bg-[#edf8f1] px-3.5 py-2 text-[12px] font-bold text-[#23834a]">
            <span className="mr-2 inline-block h-[7px] w-[7px] rounded-full bg-[#2eaf62]"></span>
            Analysis ready
          </div>
          <a
            className="rounded-full border border-[#173f73] bg-[#173f73] px-4 py-2 text-[12px] font-bold text-white shadow-[0_5px_14px_rgba(23,63,115,0.22)] transition hover:-translate-y-0.5 hover:bg-[#12345f]"
            href={`mailto:?subject=${encodeURIComponent('Customer Feedback Summary')}&body=${emailBody}`}
          >
            Send as email
          </a>
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

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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