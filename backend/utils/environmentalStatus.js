export function aqiStatus(value) {
  if (!Number.isFinite(value) || value < 0 || value > 500) return 'Data unavailable'
  if (value <= 50) return 'Good'
  if (value <= 100) return 'Moderate'
  if (value <= 150) return 'Unhealthy for Sensitive Groups'
  if (value <= 200) return 'Unhealthy'
  if (value <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export function wasteScore(metrics) {
  const values = [
    metrics.collection_efficiency,
    metrics.segregation_rate,
    metrics.processing_rate,
    metrics.open_dumping_rate,
  ]

  if (!values.every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) return null
  return Math.round((values[0] + values[1] + values[2] + (100 - values[3])) / 4)
}

export function wasteStatus(score) {
  if (!Number.isFinite(score)) return 'Data unavailable'
  if (score >= 80) return 'Good'
  if (score >= 60) return 'Moderate'
  if (score >= 40) return 'Needs improvement'
  return 'Poor'
}