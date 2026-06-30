// Date formatting helpers used across the whole app.
// Always use these instead of writing date logic directly in components.

/**
 * Formats an ISO date string into Indonesian locale format.
 * Example: "2024-01-15T10:00:00Z" → "15 Januari 2024"
 */
export function formatDate(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formats an ISO date string with time.
 * Example: "2024-01-15T10:00:00Z" → "15 Januari 2024, 10.00 WIB"
 */
export function formatDateTime(isoString) {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/**
 * Returns a relative time string.
 * Example: "2 hari yang lalu"
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '-'
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
  const diff = (new Date(isoString) - new Date()) / 1000
  const intervals = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ]
  for (const { unit, seconds } of intervals) {
    const value = Math.round(diff / seconds)
    if (Math.abs(value) >= 1) return rtf.format(value, unit)
  }
  return 'baru saja'
}
