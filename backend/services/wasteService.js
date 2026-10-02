import { config } from '../config.js'
import { wasteScore, wasteStatus } from '../utils/environmentalStatus.js'
import { getCached } from '../utils/cache.js'
import { fetchJson } from '../utils/fetchJson.js'

const unavailable = () => ({ status: 'Data unavailable', available: false })
const metricNames = ['collection_efficiency', 'segregation_rate', 'processing_rate', 'open_dumping_rate']

export function normalizeWasteResponse(response) {
  const record = firstRecord(response)
  if (!record) return unavailable()

  const metrics = Object.fromEntries(metricNames
    .map((name) => [name, validPercentage(record[name])])
    .filter(([, value]) => value !== null))
  if (!Object.keys(metrics).length) return unavailable()

  const score = metricNames.every((name) => metrics[name] !== undefined)
    ? wasteScore(metrics)
    : null
  return {
    ...metrics,
    ...(score === null ? {} : { score }),
    status: typeof record.status === 'string' && record.status.trim()
      ? record.status
      : score === null ? 'Measurements available' : wasteStatus(score),
    available: true,
  }
}

function firstRecord(response) {
  let record = response?.data ?? response?.result ?? response
  if (Array.isArray(record)) record = record[0]
  return record && typeof record === 'object' && !Array.isArray(record) ? record : null
}

function validPercentage(value) {
  const number = Number(value)
  return value !== null && value !== undefined && Number.isFinite(number) && number >= 0 && number <= 100
    ? number
    : null
}

export async function getWasteData({ apiUrl = config.wasteUrl } = {}) {
  if (!apiUrl) return unavailable()
  return getCached(`waste:${apiUrl}`, config.cacheTtlMs, async () => normalizeWasteResponse(await fetchJson(apiUrl)))
}

export { unavailable as unavailableWaste }