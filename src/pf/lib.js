import { iso } from '../lib/helpers'

/* ------------------------------ formatting ------------------------------ */
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const inr = (n) => INR.format(Math.round(Number(n) || 0))

export const num = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])
export const sumBy = (list, k) => arr(list).reduce((t, x) => t + num(x?.[k]), 0)

export const monthKey = (d = new Date()) => iso(d).slice(0, 7)
export function addMonths(ym, k) {
  const [y, m] = String(ym).split('-').map(Number)
  return monthKey(new Date(y, m - 1 + k, 1))
}
export function monthLabel(ym, short = false) {
  const [y, m] = String(ym || '').split('-').map(Number)
  if (!y || !m) return 'N/A'
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: short ? 'short' : 'long', year: short ? '2-digit' : 'numeric' })
}
export function monthsBetween(from, toIso) {
  if (!toIso) return null
  const t = new Date(toIso)
  if (Number.isNaN(t.getTime())) return null
  return (t.getFullYear() - from.getFullYear()) * 12 + (t.getMonth() - from.getMonth())
}

/* ------------------------------ categories ------------------------------ */
// Keywords of 3 chars or fewer must match a whole word; longer ones match the
// start of a word (so "zomato" also catches "ZOMATOLTD").
const C = (k, label, color, kw = []) => ({ k, label, color, kw })

export const EXPENSE_CATS = [
  C('food', 'Food & dining', '#DD6A1E', ['swiggy', 'zomato', 'restaurant', 'cafe', 'dominos', 'pizza', 'kfc', 'mcdonald', 'burger', 'bakery', 'coffee', 'starbucks', 'chai', 'eatsure', 'biryani', 'hotel']),
  C('groceries', 'Groceries', '#16A34A', ['bigbasket', 'blinkit', 'zepto', 'instamart', 'grocery', 'grocer', 'supermarket', 'hypermarket', 'dmart', 'reliance fresh', 'reliance smart', 'more retail', 'lulu', 'vegetable', 'fruits', 'milk', 'dairy', 'milma']),
  C('transport', 'Transport & fuel', '#2D74D8', ['uber', 'ola', 'olacabs', 'rapido', 'petrol', 'fuel', 'diesel', 'hpcl', 'bpcl', 'iocl', 'indian oil', 'bharat petroleum', 'hindustan petroleum', 'metro', 'irctc', 'railway', 'fastag', 'parking', 'toll', 'redbus', 'indigo', 'air india', 'makemytrip', 'goibibo', 'cleartrip', 'ksrtc']),
  C('shopping', 'Shopping', '#7C5AE8', ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'decathlon', 'croma', 'reliance digital', 'ikea', 'lifestyle', 'westside', 'trends', 'mall']),
  C('bills', 'Bills & subscriptions', '#0FA3A3', ['electricity', 'kseb', 'bescom', 'tneb', 'msedcl', 'water', 'gas', 'lpg', 'indane', 'broadband', 'wifi', 'airtel', 'jio', 'vodafone', 'vi', 'bsnl', 'recharge', 'dth', 'tata play', 'netflix', 'prime video', 'hotstar', 'spotify', 'youtube premium', 'google one', 'icloud', 'apple com bill', 'subscription', 'bill pay', 'billpay', 'bbps']),
  C('rent', 'Rent & housing', '#5B6B7C', ['rent', 'maintenance', 'society', 'nobroker', 'housing']),
  C('investment', 'Investments', '#15803D', ['sip', 'mutual fund', 'mf', 'zerodha', 'groww', 'upstox', 'kuvera', 'coin by', 'nps', 'ppf', 'indmoney', 'paytm money', 'angel one', 'smallcase', 'sgb', 'gold bond', 'icicipru', 'sbimf', 'hdfcmf']),
  C('emi', 'EMI & loan payments', '#DC4A63', ['emi', 'loan', 'nach', 'ach d', 'bajaj fin', 'home credit', 'credit card payment', 'cc payment', 'card payment', 'cred']),
  C('health', 'Health & insurance', '#B45FD6', ['pharmacy', 'medical', 'hospital', 'clinic', 'apollo', 'medplus', '1mg', 'pharmeasy', 'netmeds', 'doctor', 'diagnostic', 'lab', 'insurance', 'premium', 'lic', 'star health', 'hdfc ergo', 'icici lombard', 'niva bupa', 'care health']),
  C('education', 'Education', '#C6871B', ['school', 'college', 'tuition', 'course', 'udemy', 'coursera', 'fees', 'books', 'byju', 'unacademy']),
  C('lifestyle', 'Personal & lifestyle', '#DB2777', ['salon', 'spa', 'gym', 'fitness', 'cult', 'movie', 'pvr', 'inox', 'bookmyshow', 'gift', 'clothing', 'apparel']),
  C('transfer', 'Transfers (own accounts)', '#94A3B8', ['self transfer', 'own account', 'to self', 'transfer to own']),
  C('other', 'Other', '#64748B'),
]

export const INCOME_CATS = [
  C('salary', 'Salary', '#16A34A', ['salary', 'sal cr', 'payroll']),
  C('business', 'Business income', '#2563EB', ['invoice', 'professional fee', 'consult', 'edusolve', 'skillfly', 'edudot', 'qissa', 'ebc']),
  C('interest', 'Interest & dividends', '#0FA3A3', ['interest', 'int pd', 'int cr', 'int credit', 'dividend', 'div']),
  C('refund', 'Refunds & cashback', '#7C5AE8', ['refund', 'reversal', 'reversed', 'cashback', 'rev']),
  C('transfer_in', 'Transfers (own accounts)', '#94A3B8', ['self transfer', 'own account', 'from self']),
  C('other_income', 'Other income', '#64748B'),
]

const ALL_CATS = EXPENSE_CATS.concat(INCOME_CATS)
const OTHER = { k: 'other', label: 'Other', color: '#64748B' }
export const catDef = (k) => ALL_CATS.find((c) => c.k === k) || OTHER
export const catsFor = (type) => (type === 'income' ? INCOME_CATS : EXPENSE_CATS)

const norm = (s) => ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' '
const COMPILED = ALL_CATS.map((c) => ({ ...c, kw: c.kw.map((w) => norm(w).trim()) }))

export function autoCategory(desc, type) {
  const text = norm(desc)
  const pool = COMPILED.filter((c) => (type === 'income' ? INCOME_CATS : EXPENSE_CATS).some((x) => x.k === c.k))
  for (const c of pool) {
    for (const w of c.kw) {
      if (!w) continue
      if (w.length <= 3 ? text.includes(' ' + w + ' ') : text.includes(' ' + w)) return c.k
    }
  }
  return type === 'income' ? 'other_income' : 'other'
}

/* ------------------------------- summaries ------------------------------- */
// "Spend" is living expenses: it excludes investments and own-account transfers.
export function monthTotals(txns, ym) {
  let income = 0, spend = 0, invested = 0
  for (const t of arr(txns)) {
    if (!t.date || (ym && !t.date.startsWith(ym))) continue
    const a = num(t.amount)
    if (t.type === 'income') { if (t.category !== 'transfer_in') income += a }
    else if (t.category === 'investment') invested += a
    else if (t.category !== 'transfer') spend += a
  }
  return { income, spend, invested, saved: income - spend - invested, rate: income > 0 ? ((income - spend) / income) * 100 : null }
}

export function categoryTotals(txns, ym) {
  const m = {}
  for (const t of arr(txns)) {
    if (t.type !== 'expense' || !t.date?.startsWith(ym) || t.category === 'transfer' || t.category === 'investment') continue
    m[t.category] = (m[t.category] || 0) + num(t.amount)
  }
  return Object.entries(m).map(([k, total]) => ({ ...catDef(k), total })).sort((a, b) => b.total - a.total)
}

/** Average of the last `months` complete months that have data. */
export function avgMonthly(txns, field = 'spend', months = 3) {
  const cur = monthKey()
  let sum = 0, n = 0
  for (let i = 1; i <= months; i++) {
    const v = monthTotals(txns, addMonths(cur, -i))[field]
    if (v > 0) { sum += v; n++ }
  }
  return n ? sum / n : 0
}

export function cashflow(txns, months = 6) {
  const cur = monthKey()
  return Array.from({ length: months }, (_, i) => {
    const ym = addMonths(cur, i - months + 1)
    return { ym, ...monthTotals(txns, ym) }
  })
}

/* ------------------------ earmarking / goals / EF ------------------------ */
export function earmarked(purpose, savings, investments) {
  let total = 0, sources = 0
  for (const s of arr(savings)) if (s.purpose === purpose) { total += num(s.balance); sources++ }
  for (const i of arr(investments)) if (i.purpose === purpose) { total += num(i.current); sources++ }
  return { total, sources }
}

export function emergencyStatus({ txns, savings, investments, settings }) {
  const auto = avgMonthly(txns, 'spend', 3)
  const override = num(settings?.expenseOverride)
  const monthly = override > 0 ? override : auto
  const months = num(settings?.emergencyMonths) || 6
  const { total, sources } = earmarked('emergency', savings, investments)
  const target = monthly * months
  const coverage = monthly > 0 ? total / monthly : null
  const status = !monthly ? 'unknown' : coverage >= months ? 'healthy' : coverage >= 3 ? 'building' : 'low'
  return {
    auto, monthly, months, total, sources, target, coverage, status,
    progress: target > 0 ? Math.min(100, (total / target) * 100) : 0,
    gap: Math.max(0, target - total),
    manual: override > 0,
  }
}

export function goalProgress(g, savings, investments) {
  const linked = earmarked(g?.id, savings, investments)
  const current = linked.total + num(g?.extraSaved)
  const target = num(g?.target)
  const left = monthsBetween(new Date(), g?.targetDate)
  const need = Math.max(0, target - current)
  const perMonth = need === 0 ? 0 : left && left > 0 ? need / left : need
  const sip = arr(investments).filter((i) => i.purpose === g?.id).reduce((t, i) => t + num(i.monthlySip), 0)
  const status = target > 0 && need === 0 ? 'done' : left !== null && left <= 0 ? 'overdue' : sip > 0 && sip >= perMonth ? 'on-track' : 'behind'
  return {
    linked: linked.total, sources: linked.sources, current, target, left, need, perMonth, sip, status,
    progress: target > 0 ? Math.min(100, (current / target) * 100) : 0,
  }
}

export const PURPOSE_NONE = ''
export function purposeOptions(goals) {
  return [{ value: '', label: 'Not set aside' }, { value: 'emergency', label: 'Emergency fund' }]
    .concat(arr(goals).map((g) => ({ value: g.id, label: 'Goal: ' + (g.name || 'Untitled') })))
}
export function purposeLabel(p, goals) {
  if (!p) return ''
  if (p === 'emergency') return 'Emergency fund'
  const g = arr(goals).find((x) => x.id === p)
  return g ? g.name || 'Goal' : ''
}

/* --------------------------------- loans --------------------------------- */
export function loanMonthsLeft(l) {
  const left = monthsBetween(new Date(), l?.endDate)
  if (left !== null) return Math.max(0, left + 1)
  const P = num(l?.outstanding), E = num(l?.emi), r = num(l?.rate) / 1200
  if (!P || !E) return null
  if (!r) return Math.ceil(P / E)
  if (E <= P * r) return Infinity // EMI doesn't even cover interest
  return Math.ceil(-Math.log(1 - (r * P) / E) / Math.log(1 + r))
}

export function nextDue(l, now = new Date()) {
  const day = Math.min(Math.max(Math.round(num(l?.dueDay)) || 1, 1), 31)
  const at = (y, m) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()))
  const paid = arr(l?.paidMonths).includes(monthKey(now))
  return iso(paid ? at(now.getFullYear(), now.getMonth() + 1) : at(now.getFullYear(), now.getMonth()))
}

export const INVEST_KINDS = ['Mutual fund', 'Stocks', 'Fixed deposit', 'Recurring deposit', 'PPF', 'EPF', 'NPS', 'Gold', 'Bonds', 'Real estate', 'Crypto', 'Other']
export const SAVINGS_KINDS = ['Savings account', 'Current account', 'Cash', 'Wallet / UPI', 'Other']
export const LOAN_KINDS = ['Home loan', 'Car loan', 'Personal loan', 'Education loan', 'Gold loan', 'Business loan', 'Credit card', 'Other']
