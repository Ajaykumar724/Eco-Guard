import { config } from '../config.js'

export async function fetchJson(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.apiTimeoutMs)
  timeout.unref?.()

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...options.headers },
    })
    if (!response.ok) throw new Error(`Upstream request failed with ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}