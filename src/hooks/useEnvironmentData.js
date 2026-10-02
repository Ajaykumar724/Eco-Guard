import { useEffect, useRef, useState } from 'react'
import { fetchEnvironmentData } from '../services/environmentApi.js'

const refreshIntervalMs = Math.max(1000, Number(import.meta.env.VITE_ENVIRONMENT_REFRESH_INTERVAL) || 300000)
const defaultLatitude = Number(import.meta.env.VITE_DEFAULT_LATITUDE)
const defaultLongitude = Number(import.meta.env.VITE_DEFAULT_LONGITUDE)
const configuredDefaultLocation = Number.isFinite(defaultLatitude) && defaultLatitude >= -90 && defaultLatitude <= 90
  && Number.isFinite(defaultLongitude) && defaultLongitude >= -180 && defaultLongitude <= 180
  ? { latitude: defaultLatitude, longitude: defaultLongitude }
  : null

export function useEnvironmentData() {
  const [location, setLocation] = useState(configuredDefaultLocation)
  const [locationReady, setLocationReady] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const hasLoaded = useRef(false)

  useEffect(() => {
    let active = true
    const resolveFallback = () => {
      if (active) {
        setLocation(configuredDefaultLocation)
        setLocationReady(true)
      }
    }

    if (!navigator.geolocation) {
      resolveFallback()
    } else {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (!active) return
          setLocation({ latitude: coords.latitude, longitude: coords.longitude })
          setLocationReady(true)
        },
        resolveFallback,
        { enableHighAccuracy: false, maximumAge: refreshIntervalMs, timeout: 8000 },
      )
    }

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!locationReady) return undefined

    let active = true
    let controller
    const load = async () => {
      controller?.abort()
      controller = new AbortController()
      if (!hasLoaded.current) setLoading(true)
      try {
        const result = await fetchEnvironmentData(location, controller.signal)
        if (active) {
          setData(result)
          hasLoaded.current = true
        }
      } catch {
        if (active) setData(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    const interval = window.setInterval(load, refreshIntervalMs)
    return () => {
      active = false
      window.clearInterval(interval)
      controller?.abort()
    }
  }, [location, locationReady, refreshKey])

  return {
    data,
    loading,
    location: data?.location ?? location,
    refresh: () => setRefreshKey((key) => key + 1),
  }
}