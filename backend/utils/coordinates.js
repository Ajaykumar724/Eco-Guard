export function validateCoordinates(latitude, longitude) {
  if (latitude === null || latitude === undefined || String(latitude).trim() === '') {
    throw new RangeError('latitude must be between -90 and 90')
  }
  if (longitude === null || longitude === undefined || String(longitude).trim() === '') {
    throw new RangeError('longitude must be between -180 and 180')
  }

  const lat = Number(latitude)
  const lon = Number(longitude)

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new RangeError('latitude must be between -90 and 90')
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new RangeError('longitude must be between -180 and 180')
  }
  return { latitude: lat, longitude: lon }
}