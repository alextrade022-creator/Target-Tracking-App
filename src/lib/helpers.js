export const pad2 = (n) => (n < 10 ? '0' : '') + n

export function fmt(y, m, d) {
  return y + '-' + pad2(m + 1) + '-' + pad2(d)
}

export function iso(d) {
  return fmt(d.getFullYear(), d.getMonth(), d.getDate())
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function pretty(s) {
  if (!s) return '—'
  const p = String(s).split('-')
  if (p.length !== 3) return s
  const mo = SHORT_MONTHS[Number(p[1]) - 1]
  return p[2] + ' ' + mo + ' ' + p[0].slice(2)
}

export function todayLabel(now = new Date()) {
  return now.getDate() + ' ' + SHORT_MONTHS[now.getMonth()] + ' ' + now.getFullYear()
}

// Tiny classNames joiner (falsy values dropped).
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}
