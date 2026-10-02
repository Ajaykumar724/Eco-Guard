const unavailable = { value: null, status: 'Data unavailable', available: false }

export function EnvironmentCard({ type, icon, title, source, loading }) {
  const item = source ?? unavailable
  const isAvailable = item.available === true
  const value = getValue(type, item)
  const detail = getDetail(type, item)
  const status = loading ? 'Loading...' : isAvailable ? item.status : 'Data unavailable'

  return (
    <article className={`metric-card metric-${type}`} aria-busy={loading} aria-live="polite">
      <div className="metric-icon">{icon}</div>
      <div className="metric-label">{title} <span>›</span></div>
      <strong className={`metric-value ${loading || !isAvailable ? 'metric-value-muted' : ''}`}>
        {loading ? <span className="metric-skeleton" aria-label="Loading" /> : value}
      </strong>
      <small>{loading ? 'Loading...' : detail}</small>
      <span className={`status-pill ${loading ? 'status-loading' : statusClass(item.status)}`}>{status}</span>
    </article>
  )
}

function getValue(type, item) {
  if (!item.available) return 'Data unavailable'
  if (type === 'air') return Number.isFinite(item.value) ? Math.round(item.value) : 'Data unavailable'
  if (type === 'heat') return Number.isFinite(item.value) ? `${item.value.toFixed(1)}°C` : 'Data unavailable'
  if (type === 'water') return getWaterReading(item)?.value ?? item.status ?? 'Data unavailable'
  if (type === 'waste' && Number.isFinite(item.score)) return `${item.score}%`
  return item.status || 'Data unavailable'
}

function getDetail(type, item) {
  if (type === 'air') return 'AQI'
  if (type === 'heat') return 'Temperature'
  if (type === 'water') return getWaterReading(item)?.label ?? 'Water quality'
  return Number.isFinite(item.score) ? 'Waste score' : 'Waste status'
}

function getWaterReading(item) {
  const readings = [
    ['ph', 'pH', (value) => `pH ${value.toFixed(1)}`],
    ['dissolved_oxygen', 'Dissolved oxygen', (value) => `${value} mg/L`],
    ['bod', 'BOD', (value) => `${value} mg/L`],
    ['tds', 'TDS', (value) => `${value} mg/L`],
    ['turbidity', 'Turbidity', (value) => `${value} NTU`],
  ]
  const reading = readings.find(([key]) => Number.isFinite(item[key]))
  return reading ? { label: reading[1], value: reading[2](item[reading[0]]) } : null
}

function statusClass(status) {
  if (['Good', 'Normal'].includes(status)) return 'status-good'
  if (['Moderate', 'High'].includes(status)) return 'status-warn'
  if (['Very High', 'Extreme', 'Unhealthy', 'Very Unhealthy', 'Hazardous', 'Unhealthy for Sensitive Groups'].includes(status)) return 'status-bad'
  return 'status-unavailable'
}