const requestTimeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000

export async function fetchEnvironmentData(location, signal) {
  const url = new URL('/api/environment', window.location.origin)
  if (location) {
    url.searchParams.set('latitude', location.latitude)
    url.searchParams.set('longitude', location.longitude)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  const abortRequest = () => controller.abort()
  signal?.addEventListener('abort', abortRequest, { once: true })

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Environment API returned ${response.status}`)
    const data = await response.json()
    if (!isEnvironmentResponse(data)) throw new TypeError('Environment API returned an invalid response')
    return data
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abortRequest)
  }
}

function isEnvironmentResponse(data) {
  return data && typeof data === 'object'
    && Number.isFinite(data.location?.latitude)
    && Number.isFinite(data.location?.longitude)
    && ['air', 'heat', 'water', 'waste'].every((key) => typeof data[key]?.available === 'boolean')
}