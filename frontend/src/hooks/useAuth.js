import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import {
  loginUser as loginThunk,
  logoutUser as logoutThunk,
} from '../store/slices/authSlice'

/**
 * useAuth
 * Centralises auth state access and common auth operations.
 * Consumers never need to know the exact Redux slice shape.
 *
 * Returns:
 *  user            – The authenticated user object (or null)
 *  isAuthenticated – Boolean
 *  isLoading       – Boolean (login / logout in-flight)
 *  error           – String | null
 *  role            – 'customer' | 'restaurant' | 'admin' | null
 *  login(creds)    – Dispatches login thunk; returns the unwrapped result
 *  logout()        – Dispatches logout thunk
 *  isRole(r)       – Returns true if user's role matches r
 */
const useAuth = () => {
  const dispatch = useDispatch()

  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state) => state.auth
  )

  const role = user?.role ?? null

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Attempt to log in with the provided credentials.
   * @param {{ email: string, password: string }} creds
   * @returns {Promise<any>} Resolves with user data or rejects with error
   */
  const login = useCallback(
    async (creds) => {
      const result = await dispatch(loginThunk(creds))
      // loginThunk should be built with createAsyncThunk;
      // unwrapResult is not imported here to avoid tight coupling.
      // Callers can check result.error themselves, or we re-throw:
      if (result.error) {
        throw new Error(result.error.message || 'Login failed')
      }
      return result.payload
    },
    [dispatch]
  )

  /**
   * Log out the current user and clear auth state.
   */
  const logout = useCallback(() => {
    dispatch(logoutThunk())
  }, [dispatch])

  /**
   * Check if the current user has the given role.
   * @param {string} r – Role string to check
   * @returns {boolean}
   */
  const isRole = useCallback(
    (r) => {
      if (!user) return false
      return user.role === r
    },
    [user]
  )

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    role,
    login,
    logout,
    isRole,
  }
}

export default useAuth
