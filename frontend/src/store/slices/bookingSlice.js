import { createSlice } from '@reduxjs/toolkit'

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    step:          1,   // 1-date, 2-time, 3-party, 4-table, 5-preorder, 6-summary, 7-payment
    restaurantId:  null,
    restaurantName:'',
    date:          null,
    timeSlot:      null,
    partySize:     2,
    selectedTable: null,
    preOrderItems: [],  // [{ menuItemId, name, price, quantity, specialNote }]
    specialRequests: '',
    availableTables: [],
    isLoading:     false,
    bookingResult: null,
  },
  reducers: {
    initBooking: (state, { payload }) => {
      state.restaurantId   = payload.restaurantId
      state.restaurantName = payload.restaurantName
      state.step = 1
      state.date = null; state.timeSlot = null; state.selectedTable = null
      state.preOrderItems = []; state.specialRequests = ''
    },
    setStep:          (state, { payload }) => { state.step = payload },
    nextStep:         (state) => { state.step = Math.min(state.step + 1, 7) },
    prevStep:         (state) => { state.step = Math.max(state.step - 1, 1) },
    setDate:          (state, { payload }) => { state.date = payload; state.timeSlot = null; state.selectedTable = null },
    setTimeSlot:      (state, { payload }) => { state.timeSlot = payload; state.selectedTable = null },
    setPartySize:     (state, { payload }) => { state.partySize = payload },
    setSelectedTable: (state, { payload }) => { state.selectedTable = payload },
    setAvailableTables: (state, { payload }) => { state.availableTables = payload },
    addPreOrderItem: (state, { payload }) => {
      const existing = state.preOrderItems.find(i => i.menuItemId === payload.menuItemId)
      if (existing) existing.quantity += 1
      else state.preOrderItems.push({ ...payload, quantity: 1, specialNote: '' })
    },
    removePreOrderItem: (state, { payload: menuItemId }) => {
      state.preOrderItems = state.preOrderItems.filter(i => i.menuItemId !== menuItemId)
    },
    updatePreOrderQuantity: (state, { payload: { menuItemId, quantity } }) => {
      if (quantity <= 0) {
        state.preOrderItems = state.preOrderItems.filter(i => i.menuItemId !== menuItemId)
      } else {
        const item = state.preOrderItems.find(i => i.menuItemId === menuItemId)
        if (item) item.quantity = quantity
      }
    },
    updateSpecialNote: (state, { payload: { menuItemId, note } }) => {
      const item = state.preOrderItems.find(i => i.menuItemId === menuItemId)
      if (item) item.specialNote = note
    },
    setSpecialRequests: (state, { payload }) => { state.specialRequests = payload },
    setLoading:   (state, { payload }) => { state.isLoading = payload },
    setBookingResult: (state, { payload }) => { state.bookingResult = payload },
    resetBooking: (state) => {
      Object.assign(state, { step: 1, date: null, timeSlot: null, partySize: 2,
        selectedTable: null, preOrderItems: [], specialRequests: '', bookingResult: null })
    },
  },
})

// Selectors
export const selectBookingStep     = (s) => s.booking.step
export const selectBookingDate     = (s) => s.booking.date
export const selectBookingTimeSlot = (s) => s.booking.timeSlot
export const selectBookingPartySize= (s) => s.booking.partySize
export const selectSelectedTable   = (s) => s.booking.selectedTable
export const selectPreOrderItems   = (s) => s.booking.preOrderItems
export const selectPreOrderTotal   = (s) => s.booking.preOrderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
export const selectAvailableTables = (s) => s.booking.availableTables

export const {
  initBooking, setStep, nextStep, prevStep, setDate, setTimeSlot, setPartySize,
  setSelectedTable, setAvailableTables, addPreOrderItem, removePreOrderItem,
  updatePreOrderQuantity, updateSpecialNote, setSpecialRequests, setLoading,
  setBookingResult, resetBooking,
} = bookingSlice.actions
export default bookingSlice.reducer
