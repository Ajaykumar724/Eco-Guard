export const temperatureThresholds = Object.freeze({
  normalMax: 30,
  highMax: 35,
  veryHighMax: 40,
})

export function temperatureStatus(value) {
  if (!Number.isFinite(value)) return 'Data unavailable'
  if (value <= temperatureThresholds.normalMax) return 'Normal'
  if (value < temperatureThresholds.highMax) return 'High'
  if (value < temperatureThresholds.veryHighMax) return 'Very High'
  return 'Extreme'
}