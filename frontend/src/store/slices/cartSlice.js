import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const loadCart = () => {
  try { return JSON.parse(localStorage.getItem('dc_cart')) || { items: [], restaurantId: null, restaurantName: '' }
  } catch { return { items: [], restaurantId: null, restaurantName: '' } }
}

const saveCart = (state) => {
  localStorage.setItem('dc_cart', JSON.stringify({ items: state.items, restaurantId: state.restaurantId, restaurantName: state.restaurantName }))
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { ...loadCart(), isOpen: false },
  reducers: {
    addItem: (state, { payload: { item, restaurantId, restaurantName } }) => {
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        // Different restaurant — clear and start fresh
        state.items = []
        state.restaurantId = restaurantId
        state.restaurantName = restaurantName
        toast.error('Cart cleared — starting order from new restaurant')
      }
      if (!state.restaurantId) {
        state.restaurantId = restaurantId
        state.restaurantName = restaurantName
      }
      const existing = state.items.find(i => i._id === item._id)
      if (existing) {
        existing.quantity += 1
      } else {
        state.items.push({ ...item, quantity: 1 })
      }
      saveCart(state)
    },
    removeItem: (state, { payload: id }) => {
      state.items = state.items.filter(i => i._id !== id)
      if (state.items.length === 0) { state.restaurantId = null; state.restaurantName = '' }
      saveCart(state)
    },
    updateQuantity: (state, { payload: { id, quantity } }) => {
      if (quantity <= 0) {
        state.items = state.items.filter(i => i._id !== id)
        if (state.items.length === 0) { state.restaurantId = null; state.restaurantName = '' }
      } else {
        const item = state.items.find(i => i._id === id)
        if (item) item.quantity = quantity
      }
      saveCart(state)
    },
    clearCart: (state) => {
      state.items = []; state.restaurantId = null; state.restaurantName = ''
      localStorage.removeItem('dc_cart')
    },
    toggleCart: (state) => { state.isOpen = !state.isOpen },
    openCart:   (state) => { state.isOpen = true },
    closeCart:  (state) => { state.isOpen = false },
  },
})

// Selectors
export const selectCartItems      = (s) => s.cart.items
export const selectCartTotal      = (s) => s.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
export const selectCartCount      = (s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0)
export const selectRestaurantId   = (s) => s.cart.restaurantId
export const selectRestaurantName = (s) => s.cart.restaurantName
export const selectCartOpen       = (s) => s.cart.isOpen

export const { addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart } = cartSlice.actions
export default cartSlice.reducer
