import { stats as sampleStats } from '../../sampleData'

export default function Explorer() {
  const reviews = sampleStats.representative_reviews

  return (
    <section className="explorer-page">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Review Explorer</h3>
            <p>Browse representative customer feedback</p>
          </div>
        </div>

        <div className="review-table">
          <div className="review-header">
            <span>Review</span>
            <span>Sentiment</span>
          </div>

          {reviews.map((r) => (
            <div className="review-row" key={r.review_id}>
              <span>{r.text}</span>
              <span className={`sentiment-pill ${r.sentiment}`}>{r.sentiment}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}