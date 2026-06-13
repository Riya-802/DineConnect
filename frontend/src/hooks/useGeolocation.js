import { useState, useEffect, useCallback } from 'react'

/**
 * useGeolocation
 * Requests the browser's Geolocation API on mount and exposes the result.
 *
 * Returns:
 *  lat      – Latitude number or null
 *  lng      – Longitude number or null
 *  error    – GeolocationPositionError message string or null
 *  loading  – Boolean; true while the position is being fetched
 *  refresh  – Function to manually re-fetch the position
 */
const useGeolocation = (options = {}) => {
  const [position, setPosition] = useState({ lat: null, lng: null })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [requestId, setRequestId] = useState(0) // increment to trigger refresh

  const defaultOptions = {
    enableHighAccuracy: false,
    timeout: 10_000,   // 10 s
    maximumAge: 60_000, // cache for 60 s
    ...options,
  }

  useEffect(() => {
    if (!navigator?.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        if (cancelled) return
        // Map GeolocationPositionError codes to friendly messages
        const messages = {
          1: 'Location access denied. Please allow location permission.',
          2: 'Location information is unavailable.',
          3: 'Location request timed out.',
        }
        setError(messages[err.code] || err.message || 'Unknown location error.')
        setLoading(false)
      },
      defaultOptions
    )

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  /**
   * Re-fetch the current position.
   */
  const refresh = useCallback(() => {
    setRequestId((id) => id + 1)
  }, [])

  return {
    lat: position.lat,
    lng: position.lng,
    error,
    loading,
    refresh,
  }
}

export default useGeolocation
