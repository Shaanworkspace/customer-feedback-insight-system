export default function SentimentPanel({ positive, negative, positivePct, negativePct }) {
  return (
    <div className="panel sentiment-panel">
      <div className="panel-header">
        <div>
          <h3>Sentiment Distribution</h3>
          <p>Overall customer sentiment</p>
        </div>
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
  )
}