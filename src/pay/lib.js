// Client payments: plans, allocation of part payments, due items, reminders and
// receipts. A "sale" is one piece of paid work — from the lead pipeline (won
// lead) or added directly (referral, repeat work, retainer, workshop…).

import { iso } from '../lib/helpers'

export const MODES = ['UPI', 'Bank transfer', 'Cash', 'Cheque', 'Card']
export const SERVICES = ['Finance', 'Operation', 'Marketing', 'Sales', 'Other']

export const DEFAULT_SETTINGS = {
  name: '',
  upi: '',
  prefix: 'BC',
  business: 'Business Consultation',
  address: '',
  phone: '',
  gstin: '',
  template:
    'Hi {client}, this is a {kind} reminder that {amount} for {work} {when}.\n\n' +
    'You can pay by UPI to {upi}. Please share the payment screenshot once done.\n\nThank you,\n{name}',
  counters: {}, // financial year -> last receipt number used
}

export const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])
export const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0 }
export const todayIso = () => iso(new Date())
export const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN')
export function shortInr(n) {
  n = n || 0
  if (n >= 1e7) return '₹' + +(n / 1e7).toFixed(2) + ' Cr'
  if (n >= 1e5) return '₹' + +(n / 1e5).toFixed(2) + 'L'
  if (n >= 1e3) return '₹' + Math.round(n / 1e3) + 'k'
  return '₹' + Math.round(n)
}
export function addDays(n, from = todayIso()) {
  const [y, m, d] = from.split('-').map(Number)
  return iso(new Date(y, m - 1, d + n))
}
export function daysBetween(a, b) {
  const t = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((t(b) - t(a)) / 864e5)
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const longDate = (s) => { if (!s) return '—'; const [y, m, d] = s.split('-').map(Number); return `${d} ${MON[m - 1]} ${y}` }
export const shortDate = (s) => { if (!s) return '—'; const [, m, d] = s.split('-').map(Number); return `${d} ${MON[m - 1]}` }

export const workFor = (s, lower = false) =>
  s?.title || (lower ? `the ${String(s?.service || '').toLowerCase()} consultation` : `${s?.service || 'Consultation'} consultation`)

/* ---------- money ---------- */
export const paidOf = (s) => arr(s?.pays).reduce((t, p) => t + num(p.amount), 0)
export const balanceOf = (s) => Math.max(0, num(s?.deal) - paidOf(s))

/** Payments fill the earliest instalment first. `extra` previews an unsaved payment. */
export function allocate(s, extra = 0) {
  let pool = paidOf(s) + extra
  return arr(s?.inst).slice().sort((a, b) => String(a.due).localeCompare(String(b.due))).map((i) => {
    const amount = num(i.amount)
    const paid = Math.min(amount, pool)
    pool -= paid
    return { i, paid, left: amount - paid }
  })
}

/** Unpaid amounts with a date: instalments, or a flexible plan's next expected payment. */
export function dueItems(s) {
  if (!s?.plan) return []
  if (s.plan === 'flexible') {
    const b = balanceOf(s)
    if (!b || !s.expect?.date) return []
    return [{ s, label: 'Next payment', due: s.expect.date, left: Math.min(num(s.expect.amount) || b, b), of: 0, part: 0 }]
  }
  return allocate(s).filter((a) => a.left > 0).map((a) => ({ s, label: a.i.label || 'Instalment', due: a.i.due, left: a.left, of: num(a.i.amount), part: a.paid }))
}
export const nextDue = (s) => dueItems(s)[0] || null

export function dueStatus(due, today = todayIso()) {
  const d = daysBetween(today, due)
  if (d < 0) return { k: 'overdue', d, label: `${-d}d overdue`, tone: 'red' }
  if (d === 0) return { k: 'today', d, label: 'Due today', tone: 'amber' }
  if (d <= 7) return { k: 'week', d, label: `Due in ${d}d`, tone: 'blue' }
  return { k: 'later', d, label: shortDate(due), tone: 'slate' }
}

/* ---------- receipts ---------- */
/** Indian financial year label for a date, e.g. 2026-10-08 -> "26-27". */
export function fyOf(date) {
  const [y, m] = date.split('-').map(Number)
  const start = m >= 4 ? y : y - 1
  return String(start).slice(2) + '-' + String(start + 1).slice(2)
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''))
const three = (n) => { const h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '') }
/** Rupees in words with lakh / crore grouping. */
export function inWords(n) {
  n = Math.round(n || 0)
  if (!n) return 'Zero'
  const parts = []
  const cr = Math.floor(n / 1e7), lk = Math.floor(n / 1e5) % 100, th = Math.floor(n / 1e3) % 100, rest = n % 1000
  if (cr) parts.push(inWords(cr) + ' Crore')
  if (lk) parts.push(two(lk) + ' Lakh')
  if (th) parts.push(two(th) + ' Thousand')
  if (rest) parts.push(three(rest))
  return parts.join(' ')
}

/** Paid-to-date and balance as at a given payment (for its receipt). */
export function receiptFigures(s, p) {
  const pays = arr(s.pays).slice().sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt))
  const idx = pays.findIndex((x) => x.id === p.id)
  const upto = pays.slice(0, idx + 1).reduce((t, x) => t + num(x.amount), 0)
  return { upto, balance: Math.max(0, num(s.deal) - upto) }
}

export function receiptText(s, p, st) {
  const { upto, balance } = receiptFigures(s, p)
  return [
    `PAYMENT RECEIPT · ${p.receipt}`,
    st.business || 'Business Consultation',
    st.gstin ? 'GSTIN: ' + st.gstin : '',
    '',
    `Received from: ${s.name}${s.person ? ' (' + s.person + ')' : ''}`,
    `Amount: ${inr(p.amount)} (Rupees ${inWords(p.amount)} Only)`,
    `Date: ${longDate(p.date)}`,
    `Mode: ${p.mode}${p.ref ? ' · Ref ' + p.ref : ''}`,
    `For: ${workFor(s)}`,
    '',
    `Total fee: ${inr(s.deal)}`,
    `Paid to date: ${inr(upto)}`,
    `Balance: ${inr(balance)}`,
    '',
    'Thank you,',
    st.name || st.business || '',
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n')
}

/* ---------- reminders ---------- */
export function reminderMessage(s, st, today = todayIso()) {
  const n = nextDue(s)
  if (!n) return ''
  const over = n.due < today
  const overdueTotal = dueItems(s).filter((x) => x.due <= today).reduce((t, x) => t + x.left, 0)
  const amount = over && overdueTotal > n.left ? overdueTotal : n.left
  const first = (s.person || s.name || '').split(' ')[0]
  return String(st.template || DEFAULT_SETTINGS.template)
    .replace(/\{client\}/g, first)
    .replace(/\{kind\}/g, over ? 'gentle' : 'friendly')
    .replace(/\{amount\}/g, inr(amount))
    .replace(/\{work\}/g, workFor(s, true))
    .replace(/\{service\}/g, String(s.service || '').toLowerCase())
    .replace(/\{when\}/g, over ? 'was due on ' + longDate(n.due) : n.due === today ? 'is due today' : 'is due on ' + longDate(n.due))
    .replace(/\{upi\}/g, st.upi || '(your UPI ID)')
    .replace(/\{name\}/g, st.name || st.business || '')
}

/** wa.me link; 10-digit numbers are treated as Indian (+91). */
export function waLink(phone, text) {
  let d = String(phone || '').replace(/\D/g, '')
  if (d.length === 10) d = '91' + d
  if (d.length === 11 && d.startsWith('0')) d = '91' + d.slice(1)
  return `https://wa.me/${d}?text=${encodeURIComponent(text || '')}`
}
export const hasPhone = (phone) => String(phone || '').replace(/\D/g, '').length >= 10

/* ---------- plan templates ---------- */
export function splitPlan(deal, parts, start = todayIso()) {
  const labels = parts.length === 1 ? ['Full payment']
    : parts.length === 2 ? ['Advance', 'Balance']
      : parts.length === 3 ? ['Advance', 'Mid-way', 'Final']
        : parts.map((_, i) => 'Month ' + (i + 1))
  const gap = parts.length > 3 ? 30 : 21
  let acc = 0
  return parts.map((pc, i) => {
    const amount = i === parts.length - 1 ? deal - acc : Math.round((deal * pc) / 100 / 500) * 500
    acc += amount
    return { label: labels[i], due: addDays(i * gap, start), amount }
  })
}
