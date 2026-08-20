import { useEffect, useState } from 'react'
import { getStats } from '../api'
import { stats as sampleStats } from '../sampleData'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [concernFilter, setConcernFilter] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(sampleStats))
  }, [])

  if (!stats) {
    return (
      <div className="loading-card">
        <div className="loader"></div>
        <p>Loading customer insights...</p>
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

  const concernNames = [
    ...new Set(concerns.map((item) => item.concern)),
  ]

  const filteredReviews = reviews.filter((review) => {
    const concernMatch =
      !concernFilter ||
      review.text.toLowerCase().includes(concernFilter.toLowerCase())

    const sentimentMatch =
      !sentimentFilter ||
      review.sentiment === sentimentFilter

    return concernMatch && sentimentMatch
  })

  return (
    <div className="dashboard">

      {/* PAGE HEADER */}
      <section className="hero">
        <div>
          <div className="eyebrow">
            CUSTOMER INTELLIGENCE
          </div>

          <h2>Understand what your customers are saying.</h2>

          <p>
            Turn thousands of customer reviews into clear,
            actionable insights.
          </p>
        </div>

        <div className="hero-badge">
          <span className="status-dot"></span>
          Analysis ready
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Total Reviews</span>
            <span className="stat-icon">▤</span>
          </div>

          <strong>{total.toLocaleString()}</strong>

          <div className="stat-bottom">
            <span className="positive-text">● Dataset analyzed</span>
          </div>
        </div>

        <div className="stat-card positive-card">
          <div className="stat-top">
            <span className="stat-label">Positive Reviews</span>
            <span className="stat-icon positive-icon">↑</span>
          </div>

          <strong>{positive.toLocaleString()}</strong>

          <div className="stat-bottom">
            <span>{positivePct}% of all reviews</span>
          </div>
        </div>

        <div className="stat-card negative-card">
          <div className="stat-top">
            <span className="stat-label">Negative Reviews</span>
            <span className="stat-icon negative-icon">↓</span>
          </div>

          <strong>{negative.toLocaleString()}</strong>

          <div className="stat-bottom">
            <span>{negativePct}% of all reviews</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Priority Issues</span>
            <span className="stat-icon">!</span>
          </div>

          <strong>{concerns.length}</strong>

          <div className="stat-bottom">
            <span>Customer concerns detected</span>
          </div>
        </div>

      </section>

      {/* MAIN ANALYTICS */}
      <section className="analytics-grid">

        {/* SENTIMENT */}
        <div className="panel sentiment-panel">

          <div className="panel-header">
            <div>
              <h3>Sentiment Distribution</h3>
              <p>Overall customer sentiment</p>
            </div>

            <span className="panel-menu">•••</span>
          </div>

          <div className="sentiment-content">

            <div
              className="donut"
              style={{
                background: `conic-gradient(
                  #173f73 0 ${positivePct}%,
                  #e05252 ${positivePct}% 100%
                )`,
              }}
            >
              <div className="donut-inner">
                <strong>{positivePct}%</strong>
                <span>Positive</span>
              </div>
            </div>

            <div className="sentiment-legend">

              <div className="legend-item">
                <span className="legend-dot positive-dot"></span>

                <div>
                  <strong>Positive</strong>
                  <span>{positive.toLocaleString()} reviews</span>
                </div>

                <b>{positivePct}%</b>
              </div>

              <div className="legend-item">
                <span className="legend-dot negative-dot"></span>

                <div>
                  <strong>Negative</strong>
                  <span>{negative.toLocaleString()} reviews</span>
                </div>

                <b>{negativePct}%</b>
              </div>

            </div>

          </div>
        </div>

        {/* PRIORITY CONCERNS */}
        <div className="panel">

          <div className="panel-header">
            <div>
              <h3>Priority Concerns</h3>
              <p>Issues requiring the most attention</p>
            </div>

            <span className="priority-label">
              TOP {concerns.length}
            </span>
          </div>

          <div className="priority-list">

            {concerns.map((item, index) => (

              <div className="priority-item" key={item.concern}>

                <div className="priority-number">
                  {index + 1}
                </div>

                <div className="priority-info">

                  <div className="priority-title">
                    <strong>{item.concern}</strong>

                    <span>
                      {item.count.toLocaleString()} mentions
                    </span>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${item.impact}%`,
                      }}
                    ></div>
                  </div>

                  <small>
                    {item.negative_pct}% negative sentiment
                  </small>

                </div>

                <div className="impact-score">
                  {item.impact}
                </div>

              </div>

            ))}

          </div>
        </div>

      </section>

      {/* CUSTOMER PROOF */}
      <section className="panel proof-panel">

        <div className="panel-header">
          <div>
            <h3>Customer Proof</h3>
            <p>Representative feedback from your customers</p>
          </div>

          <span className="review-count">
            {reviews.length} reviews
          </span>
        </div>

        <div className="proof-grid">

          {reviews.map((review) => (

            <div className="proof-card" key={review.review_id}>

              <div className="quote-mark">“</div>

              <p>{review.text}</p>

              <div className="proof-footer">

                <span className="review-id">
                  Review #{review.review_id}
                </span>

                <span
                  className={`sentiment-pill ${review.sentiment}`}
                >
                  {review.sentiment}
                </span>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* REVIEWS */}
      <section className="panel reviews-panel">

        <div className="panel-header">
          <div>
            <h3>Review Explorer</h3>
            <p>Filter representative customer feedback</p>
          </div>
        </div>

        <div className="filters">

          <select
            value={concernFilter}
            onChange={(e) => setConcernFilter(e.target.value)}
          >
            <option value="">All concerns</option>

            {concernNames.map((concern) => (
              <option key={concern} value={concern}>
                {concern}
              </option>
            ))}
          </select>

          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
          >
            <option value="">All sentiment</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>

          <button
            className="clear-btn"
            onClick={() => {
              setConcernFilter('')
              setSentimentFilter('')
            }}
          >
            Clear filters
          </button>

        </div>

        <div className="review-table">

          <div className="review-header">
            <span>Review</span>
            <span>Concern</span>
            <span>Sentiment</span>
          </div>

          {filteredReviews.map((review) => {

            const matchedConcern =
              concernNames.find((concern) =>
                review.text.toLowerCase().includes(
                  concern.toLowerCase()
                )
              )

            return (
              <div
                className="review-row"
                key={review.review_id}
              >

                <span>{review.text}</span>

                <span className="concern-badge">
                  {matchedConcern || 'General'}
                </span>

                <span
                  className={`sentiment-pill ${review.sentiment}`}
                >
                  {review.sentiment}
                </span>

              </div>
            )
          })}

          {filteredReviews.length === 0 && (
            <div className="empty-state">
              No reviews match the selected filters.
            </div>
          )}

        </div>

      </section>

    </div>
  )
}