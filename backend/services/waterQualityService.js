import { config } from '../config.js'
import { getCached } from '../utils/cache.js'
import { fetchJson } from '../utils/fetchJson.js'

const unavailable = () => ({ status: 'Data unavailable', available: false })
const metricNames = ['ph', 'dissolved_oxygen', 'bod', 'tds', 'turbidity']

export function normalizeWaterResponse(response) {
  const record = firstRecord(response)
  if (!record) return unavailable()

  const metrics = Object.fromEntries(metricNames
    .map((name) => [name, optionalNumber(record[name])])
    .filter(([, value]) => value !== null))
  if (!Object.keys(metrics).length) return unavailable()

  return {
    ...metrics,
    status: typeof record.status === 'string' && record.status.trim()
      ? record.status
      : 'Measurements available',
    available: true,
  }
}

function firstRecord(response) {
  let record = response?.data ?? response?.result ?? response
  if (Array.isArray(record)) record = record[0]
  return record && typeof record === 'object' && !Array.isArray(record) ? record : null
}

function optionalNumber(value) {
  const number = Number(value)
  return value !== null && value !== undefined && Number.isFinite(number) ? number : null
}

export async function getWaterQuality({ apiUrl = config.waterUrl } = {}) {
  if (!apiUrl) return unavailable()
  return getCached(`water:${apiUrl}`, config.cacheTtlMs, async () => normalizeWaterResponse(await fetchJson(apiUrl)))
}

export { unavailable as unavailableWater }