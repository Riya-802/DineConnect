// ─────────────────────────────────────────────────────────────────────────────
// DineConnect — utility helpers
// ─────────────────────────────────────────────────────────────────────────────

// ─── Currency ────────────────────────────────────────────────────────────────

/**
 * Format a numeric amount as Indian Rupees with comma grouping.
 * @param {number} amount
 * @returns {string} e.g. '₹1,234'
 */
export const formatCurrency = (amount) => {
  if (amount == null || isNaN(Number(amount))) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

// ─── Date & Time ─────────────────────────────────────────────────────────────

/**
 * Format an ISO date string to a friendly weekday + month/day/year.
 * @param {string|Date} dateStr
 * @returns {string} e.g. 'Mon, Jun 13 2026'
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return String(dateStr)
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a time string (HH:MM or HH:MM:SS) to 12-hour AM/PM.
 * Accepts both ISO datetime strings and bare time strings like '19:30'.
 * @param {string} timeStr
 * @returns {string} e.g. '7:30 PM'
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return ''

  // If it looks like a full ISO string, parse as Date
  if (timeStr.includes('T') || timeStr.includes('-')) {
    const d = new Date(timeStr)
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    }
  }

  // Bare "HH:MM" or "HH:MM:SS"
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return timeStr
  const date = new Date(1970, 0, 1, hours, minutes)
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Return a relative time string from a past date.
 * @param {string|Date} dateStr
 * @returns {string} e.g. '2 hours ago', 'just now'
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return String(dateStr)

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWk = Math.floor(diffDay / 7)
  const diffMo = Math.floor(diffDay / 30)
  const diffYr = Math.floor(diffDay / 365)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec} seconds ago`
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
  if (diffWk < 5) return `${diffWk} week${diffWk !== 1 ? 's' : ''} ago`
  if (diffMo < 12) return `${diffMo} month${diffMo !== 1 ? 's' : ''} ago`
  return `${diffYr} year${diffYr !== 1 ? 's' : ''} ago`
}

// ─── Text ─────────────────────────────────────────────────────────────────────

/**
 * Extract uppercase initials from a full name (up to 2 letters).
 * @param {string} name
 * @returns {string} e.g. 'JD'
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Truncate a string to `len` characters, appending '…' when shortened.
 * @param {string} str
 * @param {number} [len=100]
 * @returns {string}
 */
export const truncate = (str, len = 100) => {
  if (!str) return ''
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + '…'
}

/**
 * Merge class name strings / falsy values — clsx-style utility.
 * @param {...(string|boolean|null|undefined)} classes
 * @returns {string}
 */
export const classNames = (...classes) =>
  classes.filter(Boolean).join(' ')

// ─── Time Slots ──────────────────────────────────────────────────────────────

/**
 * Generate an array of { start, end } time-slot strings between two times.
 * @param {string} openTime   – 'HH:MM' (24-hour)
 * @param {string} closeTime  – 'HH:MM' (24-hour)
 * @param {number} [intervalMins=30]
 * @returns {{ start: string, end: string }[]} Each string is formatted '7:00 PM'
 */
export const generateTimeSlots = (openTime, closeTime, intervalMins = 30) => {
  const slots = []

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const toTimeStr = (minutes) => {
    const d = new Date(1970, 0, 1, Math.floor(minutes / 60), minutes % 60)
    return d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const startMin = toMinutes(openTime)
  const endMin = toMinutes(closeTime)

  if (endMin <= startMin) return slots // guard against invalid range

  for (let m = startMin; m + intervalMins <= endMin; m += intervalMins) {
    slots.push({
      start: toTimeStr(m),
      end: toTimeStr(m + intervalMins),
    })
  }

  return slots
}

// ─── Geography ───────────────────────────────────────────────────────────────

/**
 * Calculate the great-circle distance between two lat/lng points using the
 * Haversine formula.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometres
 */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
