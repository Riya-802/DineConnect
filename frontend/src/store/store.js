import { configureStore } from '@reduxjs/toolkit'
import authReducer    from './slices/authSlice'
import cartReducer    from './slices/cartSlice'
import bookingReducer from './slices/bookingSlice'

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    cart:    cartReducer,
    booking: bookingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

export default store
