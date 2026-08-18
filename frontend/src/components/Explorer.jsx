import { stats as sampleStats } from '../sampleData'

export default function Explorer() {
  const reviews = sampleStats.representative_reviews

  return (
    <section>
      <h2>Review Explorer</h2>
      <ul>
        {reviews.map((r) => (
          <li key={r.review_id}>
            <b>{r.sentiment}</b>: {r.text}
          </li>
        ))}
      </ul>
    </section>
  )
}