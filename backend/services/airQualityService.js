import { config } from '../config.js'
import { aqiStatus } from '../utils/environmentalStatus.js'
import { fetchJson } from '../utils/fetchJson.js'
import { getCached } from '../utils/cache.js'

const unavailable = () => ({ value: null, status: 'Data unavailable', available: false })

export function normalizeAirResponse(response) {
  const current = response?.current
  const value = Number(current?.us_aqi)
  if (!Number.isFinite(value) || value < 0 || value > 500) {
    throw new TypeError('Air quality response is missing a valid US AQI value')
  }

  return {
    value,
    status: aqiStatus(value),
    pm25: optionalNumber(current.pm2_5),
    pm10: optionalNumber(current.pm10),
    available: true,
  }
}

function optionalNumber(value) {
  const number = Number(value)
  return value !== null && value !== undefined && Number.isFinite(number) ? number : null
}

export async function getAirQuality(coordinates) {
  const url = new URL(config.airUrl)
  url.searchParams.set('latitude', coordinates.latitude)
  url.searchParams.set('longitude', coordinates.longitude)
  url.searchParams.set('current', 'us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone')

  return getCached(`air:${url}`, config.cacheTtlMs, async () => normalizeAirResponse(await fetchJson(url)))
}

export { unavailable as unavailableAir }