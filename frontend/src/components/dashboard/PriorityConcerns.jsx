export default function PriorityConcerns({ concerns }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>Priority Concerns</h3>
          <p>Issues requiring the most attention</p>
        </div>
        <span className="priority-label">TOP {concerns.length}</span>
      </div>

      <div className="priority-list">
        {concerns.map((item, index) => (
          <div className="priority-item" key={item.concern}>
            <div className="priority-number">{index + 1}</div>

            <div className="priority-info">
              <div className="priority-title">
                <strong>{item.concern}</strong>
                <span>{item.count.toLocaleString()} mentions</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${item.impact}%` }}></div>
              </div>
              <small>{item.negative_pct}% negative sentiment</small>
            </div>

            <div className="impact-score">{item.impact}</div>
          </div>
        ))}
      </div>
    </div>
  )
}