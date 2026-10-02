import { config } from '../config.js'
import { temperatureStatus } from '../config/temperatureThresholds.js'
import { fetchJson } from '../utils/fetchJson.js'
import { getCached } from '../utils/cache.js'

export function normalizeWeatherResponse(response) {
  const current = response?.current
  const value = Number(current?.temperature_2m)
  if (!Number.isFinite(value)) throw new TypeError('Weather response is missing a valid temperature')

  return {
    value,
    status: temperatureStatus(value),
    humidity: optionalNumber(current.relative_humidity_2m),
    apparentTemperature: optionalNumber(current.apparent_temperature),
    available: true,
  }
}

function optionalNumber(value) {
  const number = Number(value)
  return value !== null && value !== undefined && Number.isFinite(number) ? number : null
}

export async function getWeather(coordinates) {
  const url = new URL(config.weatherUrl)
  url.searchParams.set('latitude', coordinates.latitude)
  url.searchParams.set('longitude', coordinates.longitude)
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature')

  return getCached(`weather:${url}`, config.cacheTtlMs, async () => normalizeWeatherResponse(await fetchJson(url)))
}