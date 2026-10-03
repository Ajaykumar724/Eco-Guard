import { config } from '../config.js'
import { validateCoordinates } from '../utils/coordinates.js'
import { getAirQuality } from './airQualityService.js'
import { getWeather } from './weatherService.js'
import { getWaterQuality } from './waterQualityService.js'
import { getWasteData } from './wasteService.js'

const unavailableAir = () => ({ value: null, unit: 'AQI', status: 'Data unavailable', available: false })
const unavailableHeat = () => ({ value: null, unit: '°C', status: 'Data unavailable', available: false })
const unavailableWater = () => ({ status: 'Data unavailable', available: false })
const unavailableWaste = () => ({ status: 'Data unavailable', available: false })

export function createEnvironmentService(services = {}) {
  const airService = services.air ?? getAirQuality
  const weatherService = services.weather ?? getWeather
  const waterService = services.water ?? getWaterQuality
  const wasteService = services.waste ?? getWasteData

  return async function getEnvironmentData(input = {}) {
    const coordinates = validateCoordinates(
      input.latitude ?? config.defaultLatitude,
      input.longitude ?? config.defaultLongitude,
    )
    const [airResult, heatResult, waterResult, wasteResult] = await Promise.allSettled([
      airService(coordinates),
      weatherService(coordinates),
      waterService(),
      wasteService(),
    ])

    const air = fulfilledOr(airResult, unavailableAir())
    const heat = fulfilledOr(heatResult, unavailableHeat())
    const water = fulfilledOr(waterResult, unavailableWater())
    const waste = fulfilledOr(wasteResult, unavailableWaste())

    return {
      location: coordinates,
      air: { ...air, unit: 'AQI' },
      heat: { ...heat, unit: '°C' },
      water,
      waste,
      updatedAt: new Date().toISOString(),
    }
  }
}

function fulfilledOr(result, fallback) {
  return result.status === 'fulfilled' && result.value && typeof result.value === 'object'
    ? result.value
    : fallback
}

export const getEnvironmentData = createEnvironmentService()