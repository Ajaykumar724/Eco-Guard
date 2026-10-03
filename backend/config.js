import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const envFile = resolve(process.cwd(), '.env')

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match || match[1] in process.env) continue
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2')
    process.env[match[1]] = value
  }
}

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) ? value : fallback
}

function urlFromEnv(name, fallback = '') {
  const value = process.env[name] ?? fallback
  if (!value) return ''

  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must use HTTP or HTTPS`)
  }
  return url.toString()
}

export const config = {
  port: numberFromEnv('PORT', 3001),
  apiTimeoutMs: numberFromEnv('API_TIMEOUT_MS', 8000),
  cacheTtlMs: numberFromEnv('API_CACHE_TTL_MS', numberFromEnv('ENVIRONMENT_REFRESH_INTERVAL', 300000)),
  airUrl: urlFromEnv('OPEN_METEO_AIR_URL', 'https://air-quality-api.open-meteo.com/v1/air-quality'),
  weatherUrl: urlFromEnv('OPEN_METEO_WEATHER_URL', 'https://api.open-meteo.com/v1/forecast'),
  waterUrl: urlFromEnv('WATER_API_URL'),
  wasteUrl: urlFromEnv('WASTE_API_URL'),
  defaultLatitude: numberFromEnv('DEFAULT_LATITUDE', 28.9845),
  defaultLongitude: numberFromEnv('DEFAULT_LONGITUDE', 77.7064),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
}