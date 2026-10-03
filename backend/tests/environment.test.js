import test from 'node:test'
import assert from 'node:assert/strict'
import { aqiStatus, wasteScore } from '../utils/environmentalStatus.js'
import { temperatureStatus } from '../config/temperatureThresholds.js'
import { validateCoordinates } from '../utils/coordinates.js'
import { normalizeAirResponse } from '../services/airQualityService.js'
import { normalizeWeatherResponse } from '../services/weatherService.js'
import { getWaterQuality, normalizeWaterResponse } from '../services/waterQualityService.js'
import { getWasteData, normalizeWasteResponse } from '../services/wasteService.js'
import { createEnvironmentService } from '../services/environmentService.js'

test('AQI status follows the configured US AQI bands', () => {
  assert.deepEqual([0, 51, 101, 151, 201, 301, 501].map(aqiStatus), [
    'Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy',
    'Very Unhealthy', 'Hazardous', 'Data unavailable',
  ])
})

test('temperature status follows configured thresholds', () => {
  assert.deepEqual([19, 20, 30, 31, 35, 39, 40].map(temperatureStatus), [
    'Normal', 'Normal', 'Normal', 'High', 'Very High', 'Very High', 'Extreme',
  ])
})

test('coordinates accept numeric strings and reject invalid ranges', () => {
  assert.deepEqual(validateCoordinates('28.98', '77.70'), { latitude: 28.98, longitude: 77.7 })
  assert.throws(() => validateCoordinates(91, 0), /latitude/)
  assert.throws(() => validateCoordinates(0, -181), /longitude/)
  assert.throws(() => validateCoordinates('north', 0), /latitude/)
})

test('air response normalizes current US AQI and particulate values', () => {
  assert.deepEqual(normalizeAirResponse({ current: { us_aqi: 154, pm2_5: 34.2, pm10: 45 } }), {
    value: 154, status: 'Unhealthy', pm25: 34.2, pm10: 45, available: true,
  })
  assert.throws(() => normalizeAirResponse({ current: {} }), /US AQI/)
})

test('weather response normalizes current values and temperature status', () => {
  assert.deepEqual(normalizeWeatherResponse({ current: {
    temperature_2m: 36.1, relative_humidity_2m: 43, apparent_temperature: 39.8,
  } }), {
    value: 36.1, status: 'Very High', humidity: 43, apparentTemperature: 39.8, available: true,
  })
  assert.throws(() => normalizeWeatherResponse({ current: {} }), /temperature/)
})

test('unconfigured water and waste sources report unavailable', async () => {
  assert.deepEqual(await getWaterQuality({ apiUrl: '' }), { status: 'Data unavailable', available: false })
  assert.deepEqual(await getWasteData({ apiUrl: '' }), { status: 'Data unavailable', available: false })
  assert.deepEqual(normalizeWaterResponse({}), { status: 'Data unavailable', available: false })
  assert.deepEqual(normalizeWasteResponse({}), { status: 'Data unavailable', available: false })
})

test('waste score requires real metrics and discounts open dumping', () => {
  const metrics = {
    collection_efficiency: 80,
    segregation_rate: 60,
    processing_rate: 70,
    open_dumping_rate: 20,
  }
  assert.equal(wasteScore(metrics), 73)
  assert.equal(normalizeWasteResponse({ data: { ...metrics, status: '' } }).score, 73)
  assert.equal(normalizeWasteResponse({ data: { segregation_rate: 60 } }).score, undefined)
})

test('aggregation keeps successful services when another source fails', async () => {
  const service = createEnvironmentService({
    air: async () => ({ value: 84, status: 'Moderate', pm25: 11, pm10: 18, available: true }),
    weather: async () => { throw new Error('upstream unavailable') },
    water: async () => ({ status: 'Data unavailable', available: false }),
    waste: async () => ({ status: 'Data unavailable', available: false }),
  })
  const result = await service({ latitude: 12, longitude: 34 })
  assert.equal(result.location.latitude, 12)
  assert.equal(result.air.value, 84)
  assert.equal(result.heat.status, 'Data unavailable')
  assert.equal(result.water.available, false)
  assert.equal(Number.isNaN(Date.parse(result.updatedAt)), false)
})