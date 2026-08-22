export function downloadText(filename, text, mime = 'text/csv') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function sampleCsvText() {
  return [
    'review_text,rating,date,country',
    '"The battery lasts long and the camera is sharp.",5,2024-01-01,USA',
    '"Delivery was late and support was rude.",2,2024-01-02,UK',
    '"Good value for money, but the screen flickers sometimes.",3,2024-01-03,India',
    '"I love the design, though the software feels slow.",4,2024-01-04,Canada',
  ].join('\n')
}

export function reportToCsv(report) {
  const lines = ['Concern,Mentions,NegativePct,Impact']
  for (const c of report.ranked_concerns || []) {
    lines.push(`${c.concern},${c.count},${c.negative_pct},${c.impact}`)
  }
  const sd = report.sentiment_distribution || {}
  lines.push('')
  lines.push('Sentiment,Count')
  for (const [k, v] of Object.entries(sd)) lines.push(`${k},${v}`)
  return lines.join('\n')
}
