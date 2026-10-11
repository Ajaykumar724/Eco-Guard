const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')

export function apiUrl(path) {
  const normalizedPath = `/${path.replace(/^\/+/, '')}`
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath
}
