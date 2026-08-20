export default function ProofPanel({ reviews }) {
  return (
    <section className="panel proof-panel">
      <div className="panel-header">
        <div>
          <h3>Customer Proof</h3>
          <p>Representative feedback from your customers</p>
        </div>
        <span className="review-count">{reviews.length} reviews</span>
      </div>

      <div className="proof-grid">
        {reviews.map((review) => (
          <div className="proof-card" key={review.review_id}>
            <div className="quote-mark">“</div>
            <p>{review.text}</p>
            <div className="proof-footer">
              <span className="review-id">Review #{review.review_id}</span>
              <span className={`sentiment-pill ${review.sentiment}`}>{review.sentiment}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}