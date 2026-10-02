const entries = new Map()
const maxEntries = 1000

export async function getCached(key, ttlMs, loader) {
  const now = Date.now()
  const entry = entries.get(key)
  if (entry && entry.expiresAt > now) return entry.value

  const value = Promise.resolve().then(loader)
  if (entries.size >= maxEntries) {
    for (const [entryKey, cached] of entries) {
      if (cached.expiresAt <= now) entries.delete(entryKey)
    }
    if (entries.size >= maxEntries) entries.delete(entries.keys().next().value)
  }
  entries.set(key, { value, expiresAt: now + ttlMs })

  try {
    return await value
  } catch (error) {
    if (entries.get(key)?.value === value) entries.delete(key)
    throw error
  }
}

export function clearCache() {
  entries.clear()
}