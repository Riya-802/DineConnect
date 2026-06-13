import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axiosClient'

// ── Async Thunks ────────────────────────────────────────────────
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const verifyOTP = createAsyncThunk('auth/verifyOtp', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify-otp', payload)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'OTP verification failed')
  }
})

export const completeProfile = createAsyncThunk('auth/completeProfile', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/complete-profile', payload)
    return data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to complete profile')
  }
})

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/me')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile')
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  } catch (err) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    return rejectWithValue(err.response?.data?.message)
  }
})

export const refreshToken = createAsyncThunk('auth/refresh', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('refreshToken')
    const { data } = await api.post('/auth/refresh', { refreshToken: token })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
  } catch (err) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    return rejectWithValue('Session expired')
  }
})

// ── Slice ────────────────────────────────────────────────────────
const initialState = {
  user:          null,
  accessToken:   localStorage.getItem('accessToken') || null,
  isAuthenticated: false,
  isLoading:     false,
  error:         null,
  otpSent:       false,
  otpPhone:      null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError:  (state) => { state.error = null },
    setOtpSent:  (state, action) => { state.otpSent = true; state.otpPhone = action.payload },
    clearOtp:    (state) => { state.otpSent = false; state.otpPhone = null },
    setUser:     (state, action) => { state.user = action.payload; state.isAuthenticated = true },
    clearAuth:   (state) => {
      state.user = null; state.accessToken = null;
      state.isAuthenticated = false; state.otpSent = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending,  (s) => { s.isLoading = true; s.error = null })
      .addCase(loginUser.fulfilled,(s, a) => {
        s.isLoading = false; s.isAuthenticated = true;
        s.user = a.payload.user; s.accessToken = a.payload.accessToken
      })
      .addCase(loginUser.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })

    // Register
    builder
      .addCase(registerUser.pending,  (s) => { s.isLoading = true; s.error = null })
      .addCase(registerUser.fulfilled,(s, a) => { s.isLoading = false; s.otpSent = true; s.otpPhone = a.payload.phone })
      .addCase(registerUser.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })

    // Verify OTP
    builder
      .addCase(verifyOTP.pending,  (s) => { s.isLoading = true; s.error = null })
      .addCase(verifyOTP.fulfilled,(s, a) => {
        s.isLoading = false; s.isAuthenticated = true;
        s.user = a.payload.user; s.accessToken = a.payload.accessToken; s.otpSent = false
      })
      .addCase(verifyOTP.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })

    // Fetch profile
    builder
      .addCase(fetchProfile.pending,  (s) => { s.isLoading = true })
      .addCase(fetchProfile.fulfilled,(s, a) => { s.isLoading = false; s.user = a.payload; s.isAuthenticated = true })
      .addCase(fetchProfile.rejected, (s) => { s.isLoading = false; s.isAuthenticated = false })

    // Complete profile
    builder
      .addCase(completeProfile.pending, (s) => { s.isLoading = true; s.error = null })
      .addCase(completeProfile.fulfilled, (s, a) => { s.isLoading = false; s.user = a.payload })
      .addCase(completeProfile.rejected, (s, a) => { s.isLoading = false; s.error = a.payload })

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null; s.accessToken = null; s.isAuthenticated = false
      })

    // Refresh
    builder
      .addCase(refreshToken.fulfilled, (s, a) => { s.accessToken = a.payload.accessToken })
      .addCase(refreshToken.rejected,  (s) => { s.user = null; s.isAuthenticated = false; s.accessToken = null })
  },
})

export const { clearError, setOtpSent, clearOtp, setUser, clearAuth } = authSlice.actions
export default authSlice.reducer
