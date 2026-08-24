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
    '"The battery lasts all day and the camera takes stunning photos. Absolutely love it!",5,2024-01-01,USA',
    '"Excellent build quality and fast performance, highly recommend this phone.",5,2024-01-05,UK',
    '"Sound quality is rich and the fit is very comfortable for long calls.",5,2024-01-09,Canada',
    '"Delivery was late and customer support was extremely rude. Worst experience ever.",1,2024-01-02,UK',
    '"The screen cracked within a week and the battery drains fast. Terrible product.",2,2024-01-06,India',
    '"Customer service hung up on me and never resolved my issue. Avoid this brand.",1,2024-01-11,Germany',
    '"The camera is sharp but the battery drains quickly. Mixed feelings overall.",3,2024-01-03,India',
    '"Great design, though the software feels slow and sometimes lags during use.",4,2024-01-04,Canada',
    '"Good value for money, but the screen flickers sometimes when brightness is low.",3,2024-01-07,Canada',
    '"Fast shipping and the price is fair, yet the packaging felt a bit cheap.",3,2024-01-12,Australia',
    '"This phone has a 6.1 inch display and weighs 170 grams. Bought it last week.",3,2024-01-08,Germany',
    '"The package includes a charger and a USB cable. Setup was straightforward.",3,2024-01-09,USA',
    '"It runs on the latest operating system with regular monthly security updates.",4,2024-01-10,Australia',
    '"Comes with a one year warranty and supports Bluetooth 5.3 connectivity.",4,2024-01-13,USA',
    '"The manual lists all features and the device paired without any issues.",3,2024-01-14,UK',
    '"Available in three colors and ships from the local warehouse within two days.",4,2024-01-15,India',
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
