import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useSelector } from 'react-redux'

/**
 * useSocket
 * Creates and manages a Socket.io connection tied to the authenticated user.
 * Only connects when the user is authenticated. Automatically joins a user-
 * specific room and cleans up the socket on unmount.
 */
const useSocket = () => {
  const socketRef = useRef(null)
  const listenersRef = useRef({}) // { event: Set<callback> }

  const { user, isAuthenticated } = useSelector((state) => state.auth)

  // ─── Connect / Disconnect ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const serverUrl =
      import.meta.env.VITE_API_URL || window.location.origin

    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    // Join the user's personal room after connecting
    socket.on('connect', () => {
      socket.emit('join:room', { userId: user.id })
    })

    socket.on('connect_error', (err) => {
      console.error('[useSocket] Connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
      console.warn('[useSocket] Disconnected:', reason)
    })

    // Re-attach any listeners that were registered before connect
    Object.entries(listenersRef.current).forEach(([event, callbacks]) => {
      callbacks.forEach((cb) => socket.on(event, cb))
    })

    return () => {
      // Remove all registered listeners cleanly
      Object.entries(listenersRef.current).forEach(([event, callbacks]) => {
        callbacks.forEach((cb) => socket.off(event, cb))
      })
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, user?.id])

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Subscribe to a socket event.
   * Safe to call before the socket is connected – listeners are stored and
   * replayed on (re)connect.
   */
  const on = useCallback((event, cb) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = new Set()
    }
    listenersRef.current[event].add(cb)

    if (socketRef.current) {
      socketRef.current.on(event, cb)
    }
  }, [])

  /**
   * Unsubscribe from a socket event.
   */
  const off = useCallback((event, cb) => {
    if (listenersRef.current[event]) {
      listenersRef.current[event].delete(cb)
      if (listenersRef.current[event].size === 0) {
        delete listenersRef.current[event]
      }
    }

    if (socketRef.current) {
      socketRef.current.off(event, cb)
    }
  }, [])

  /**
   * Emit an event to the server.
   */
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn(`[useSocket] Cannot emit "${event}": socket not connected.`)
    }
  }, [])

  return {
    socket: socketRef,
    on,
    off,
    emit,
  }
}

export default useSocket
