import { useState } from 'react'

export default function ReviewExplorer({ reviews, concernNames }) {
  const [concernFilter, setConcernFilter] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')

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
    <section className="panel reviews-panel">
      <div className="panel-header">
        <div>
          <h3>Review Explorer</h3>
          <p>Filter representative customer feedback</p>
        </div>
      </div>

      <div className="filters">
        <select value={concernFilter} onChange={(e) => setConcernFilter(e.target.value)}>
          <option value="">All concerns</option>
          {concernNames.map((concern) => (
            <option key={concern} value={concern}>{concern}</option>
          ))}
        </select>

        <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
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
          const matchedConcern = concernNames.find((concern) =>
            review.text.toLowerCase().includes(concern.toLowerCase())
          )
          return (
            <div className="review-row" key={review.review_id}>
              <span>{review.text}</span>
              <span className="concern-badge">{matchedConcern || 'General'}</span>
              <span className={`sentiment-pill ${review.sentiment}`}>{review.sentiment}</span>
            </div>
          )
        })}

        {filteredReviews.length === 0 && (
          <div className="empty-state">No reviews match the selected filters.</div>
        )}
      </div>
    </section>
  )
}