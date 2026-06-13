import axios from 'axios'
import { store } from '@/store/store'
import { refreshToken, clearAuth } from '@/store/slices/authSlice'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // send refresh token cookie
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach access token ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken || localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

// ── Response interceptor: auto-refresh on 401 ────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (original.url.includes('/auth/refresh') || original.url.includes('/auth/login')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const result = await store.dispatch(refreshToken())
        if (refreshToken.fulfilled.match(result)) {
          const newToken = result.payload.accessToken
          processQueue(null, newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } else {
          processQueue(new Error('Refresh failed'))
          store.dispatch(clearAuth())
          window.location.href = '/login'
        }
      } catch (e) {
        processQueue(e)
        store.dispatch(clearAuth())
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
