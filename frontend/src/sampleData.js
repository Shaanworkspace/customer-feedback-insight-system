export const stats = {
  total_reviews: 20000,
  sentiment_distribution: { positive: 12400, negative: 7600 },
  ranked_concerns: [
    { concern: 'battery', count: 3100, negative_pct: 78.0, impact: 100, priority: 1 },
    { concern: 'delivery', count: 1500, negative_pct: 55.0, impact: 60, priority: 2 },
    { concern: 'price', count: 1200, negative_pct: 33.3, impact: 40, priority: 3 },
    { concern: 'camera', count: 2100, negative_pct: 19.0, impact: 30, priority: 4 },
  ],
  representative_reviews: [
    { review_id: 'r1', text: 'battery dies quickly', sentiment: 'negative' },
    { review_id: 'r2', text: 'great camera quality', sentiment: 'positive' },
  ],
}

export const analysis = {
  review_text: 'the camera is excellent but battery drains fast and delivery was late',
  overall_sentiment: 'mixed',
  overall_confidence: 0.72,
  concerns: [
    { name: 'camera', sentiment: 'positive', matched_terms: ['camera'], confidence: 0.91 },
    { name: 'battery', sentiment: 'negative', matched_terms: ['battery', 'drains fast'], confidence: 0.84 },
    { name: 'delivery', sentiment: 'negative', matched_terms: ['delivery', 'late'], confidence: 0.7 },
  ],
  similar_reviews: [
    { review_id: 'abc123', text_preview: 'battery dies in 2 hours, camera is fine', similarity: 0.83 },
  ],
}