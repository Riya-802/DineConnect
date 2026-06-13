// ─────────────────────────────────────────────────────────────────────────────
// DineConnect — status / domain formatters
// Warm Hearth palette colours used in Tailwind text classes:
//   flame=#D85A30  ember=#993C1D  sage=#5A7A5C  clay=#B07850
// ─────────────────────────────────────────────────────────────────────────────

// ─── Order Status ─────────────────────────────────────────────────────────────

const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

/**
 * Human-readable label for an order status string.
 * @param {string} status
 * @returns {string}
 */
export const orderStatusLabel = (status) =>
  ORDER_STATUS_LABELS[status] ?? capitalise(status ?? 'unknown')

const ORDER_STATUS_COLORS = {
  pending: 'text-amber-600',
  confirmed: 'text-blue-600',
  preparing: 'text-orange-500',
  ready: 'text-sage',          // custom class expected in Tailwind config
  out_for_delivery: 'text-indigo-500',
  delivered: 'text-green-600',
  completed: 'text-green-700',
  cancelled: 'text-red-600',
  refunded: 'text-gray-500',
}

/**
 * Tailwind text colour class for an order status.
 * @param {string} status
 * @returns {string}
 */
export const orderStatusColor = (status) =>
  ORDER_STATUS_COLORS[status] ?? 'text-clay'

// ─── Booking Status ───────────────────────────────────────────────────────────

const BOOKING_STATUS_LABELS = {
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  seated: 'Seated',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  waitlisted: 'Waitlisted',
}

/**
 * Human-readable label for a booking status string.
 * @param {string} status
 * @returns {string}
 */
export const bookingStatusLabel = (status) =>
  BOOKING_STATUS_LABELS[status] ?? capitalise(status ?? 'unknown')

const BOOKING_STATUS_COLORS = {
  pending: 'text-amber-600',
  confirmed: 'text-blue-600',
  seated: 'text-sage',
  completed: 'text-green-700',
  cancelled: 'text-red-600',
  no_show: 'text-red-400',
  waitlisted: 'text-purple-500',
}

/**
 * Tailwind text colour class for a booking status.
 * @param {string} status
 * @returns {string}
 */
export const bookingStatusColor = (status) =>
  BOOKING_STATUS_COLORS[status] ?? 'text-clay'

// ─── Table Status ─────────────────────────────────────────────────────────────

const TABLE_STATUS_HEX = {
  available: '#5A7A5C',   // sage
  occupied: '#D85A30',    // flame
  reserved: '#B07850',    // clay
  cleaning: '#D97706',    // amber-600 approx
  maintenance: '#9CA3AF', // gray-400
  blocked: '#EF4444',     // red-500
}

/**
 * Hex colour string representing a table's current status.
 * Useful for floor-plan canvas rendering.
 * @param {string} status
 * @returns {string} Hex colour
 */
export const tableStatusColor = (status) =>
  TABLE_STATUS_HEX[status] ?? '#9CA3AF'

// ─── Payment Status ───────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABELS = {
  pending: 'Payment Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Payment Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
  disputed: 'Disputed',
  waived: 'Waived',
}

/**
 * Human-readable label for a payment status string.
 * @param {string} status
 * @returns {string}
 */
export const paymentStatusLabel = (status) =>
  PAYMENT_STATUS_LABELS[status] ?? capitalise(status ?? 'unknown')

// ─── Cuisine Emojis ───────────────────────────────────────────────────────────

const CUISINE_EMOJIS = {
  // Indian sub-types
  indian: '🍛',
  north_indian: '🫓',
  south_indian: '🥘',
  street_food: '🌮',
  biryani: '🍚',
  thali: '🍽️',

  // International
  chinese: '🥢',
  italian: '🍕',
  mexican: '🌮',
  japanese: '🍣',
  thai: '🍜',
  american: '🍔',
  mediterranean: '🥗',
  french: '🥐',
  korean: '🍱',
  middle_eastern: '🧆',
  seafood: '🦐',
  pizza: '🍕',
  burger: '🍔',
  sushi: '🍱',
  steak: '🥩',
  bbq: '🍖',

  // Generic
  vegetarian: '🥦',
  vegan: '🌱',
  dessert: '🍰',
  bakery: '🥖',
  cafe: '☕',
  fast_food: '🍟',
  healthy: '🥙',
  fusion: '🍴',
}

/**
 * Emoji representing a cuisine type.
 * @param {string} cuisineType
 * @returns {string} Emoji character
 */
export const cuisineEmoji = (cuisineType) => {
  if (!cuisineType) return '🍽️'
  const key = cuisineType.toLowerCase().replace(/[\s-]+/g, '_')
  return CUISINE_EMOJIS[key] ?? '🍽️'
}

// ─── Internal Helper ──────────────────────────────────────────────────────────

const capitalise = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
