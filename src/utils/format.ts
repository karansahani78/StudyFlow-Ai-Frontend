import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

function safeParse(d?: string): Date | null {
  if (!d) return null
  try {
    const dt = parseISO(d)
    return isValid(dt) ? dt : null
  } catch { return null }
}

export const fmtDate     = (d?: string) => { const dt = safeParse(d); return dt ? format(dt, 'MMM d, yyyy') : '—' }
export const fmtDateTime = (d?: string) => { const dt = safeParse(d); return dt ? format(dt, 'MMM d, yyyy h:mm a') : '—' }
export const fmtRelative = (d?: string) => { const dt = safeParse(d); return dt ? formatDistanceToNow(dt, { addSuffix: true }) : '—' }
export const fmtCurrency = (n?: number | null, currency = 'USD') =>
  n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n) : '—'
export const fmtNumber   = (n?: number | null) => n != null ? new Intl.NumberFormat('en-US').format(n) : '0'
export const fmtPercent  = (n?: number | null) => n != null ? `${Number(n).toFixed(1)}%` : '—'
export const initials    = (name: string) =>
  name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
