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

/* ---------- EMI expenses linked to loans ---------- */

/** EMI expenses linked to a loan, oldest first. */
export const loanPayments = (l, txns) =>
  arr(txns).filter((t) => t.loanId && t.loanId === l?.id && t.type === 'expense')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))

/** Amount paid towards a loan in a month (YYYY-MM) through linked expenses. */
export const loanPaidIn = (l, txns, ym) =>
  loanPayments(l, txns).filter((t) => String(t.date).startsWith(ym)).reduce((s, t) => s + num(t.amount), 0)

/** 'paid' | 'part' | 'due' for a month. Paid = ticked by hand, or linked payments cover ~the EMI. */
export const isFlexible = (l) => l?.mode === 'flexible'

export function loanStatus(l, txns, ym) {
  if (isFlexible(l)) return { status: 'flex', paid: loanPaidIn(l, txns, ym) }
  if (arr(l?.paidMonths).includes(ym)) return { status: 'paid', paid: num(l?.emi), manual: true }
  const paid = loanPaidIn(l, txns, ym)
  if (paid > 0 && paid >= num(l?.emi) * 0.95) return { status: 'paid', paid }
  return { status: paid > 0 ? 'part' : 'due', paid }
}

/** Every month counted as paid (for the next due date). */
export function loanPaidMonths(l, txns) {
  const out = new Set(arr(l?.paidMonths))
  const months = new Set(loanPayments(l, txns).map((t) => String(t.date).slice(0, 7)))
  months.forEach((ym) => { if (loanStatus(l, txns, ym).status === 'paid') out.add(ym) })
  return [...out]
}

/** Best guess at which loan an EMI payment is for, or ''. */
export function matchLoan(txn, loans) {
  const list = arr(loans)
  if (!list.length) return ''
  const amt = num(txn?.amount)
  const byAmount = list.filter((l) => num(l.emi) && Math.abs(amt - num(l.emi)) <= num(l.emi) * 0.03)
  if (byAmount.length === 1) return byAmount[0].id
  const text = norm(txn?.desc)
  const byName = list.filter((l) => [l.lender, l.name, l.kind].some((w) => {
    const words = norm(w).split(' ').filter((x) => x.length >= 3 && !['loan', 'emi'].includes(x))
    return words.some((x) => text.includes(x))
  }))
  if (byName.length === 1) return byName[0].id
  return list.length === 1 ? list[0].id : ''
}

/** Where a loan stood when it was added (or last re-entered): balance, plus principal
 *  and interest already paid before that date. Older loans only had `outstanding`. */
export function loanOpening(l) {
  const o = l?.opening || {}
  return {
    date: o.date || l?.asOf || (l?.createdAt ? iso(new Date(l.createdAt)) : ''),
    balance: num(o.balance ?? l?.outstanding),
    principal: num(o.principal),
    interest: num(o.interest),
  }
}

/** Payment ledger of a loan, built from the expenses linked to it (oldest first).
 *  Principal / interest come from what you typed (loanPrincipal / loanInterest);
 *  payments without a typed split are estimated (interest charged once a month on
 *  the balance) and flagged. loanFunded lists other people's share of a payment. */
export function loanLedger(l, txns) {
  const open = loanOpening(l)
  const r = num(l?.rate) / 1200
  let bal = open.balance
  const monthInterest = {}, interestPaid = {}, rows = []
  const by = {}
  for (const t of loanPayments(l, txns)) {
    if (open.date && String(t.date) < open.date) continue // already reflected in the opening balance
    const amount = num(t.amount)
    const ym = String(t.date).slice(0, 7)
    let principal, interest
    const typed = t.loanPrincipal != null || t.loanInterest != null
    if (typed) {
      principal = num(t.loanPrincipal)
      interest = num(t.loanInterest)
    } else {
      if (monthInterest[ym] === undefined) monthInterest[ym] = Math.round(bal * r)
      interest = Math.min(amount, Math.max(0, monthInterest[ym] - (interestPaid[ym] || 0)))
      principal = Math.min(bal, amount - interest)
    }
    interestPaid[ym] = (interestPaid[ym] || 0) + interest
    bal = Math.max(0, bal - principal)
    const others = arr(t.loanFunded).filter((f) => num(f.amount) > 0)
    const mine = Math.max(0, amount - others.reduce((s, f) => s + num(f.amount), 0))
    const funded = (mine ? [{ who: 'me', amount: mine }] : []).concat(others.map((f) => ({ who: f.who, amount: num(f.amount) })))
    funded.forEach((f) => { by[f.who] = (by[f.who] || 0) + f.amount })
    rows.push({ t, principal, interest, estimated: !typed, funded, after: Math.round(bal) })
  }
  const principalSince = rows.reduce((s, x) => s + x.principal, 0)
  const interestSince = rows.reduce((s, x) => s + x.interest, 0)
  return {
    open, rows, by,
    balance: Math.max(0, Math.round(bal)),
    principalSince, interestSince,
    principalPaid: open.principal + principalSince,
    interestPaid: open.interest + interestSince,
    estimated: rows.filter((x) => x.estimated).length,
  }
}

/** Current balance after linked payments (kept for callers that only need the number). */
export const loanBalance = (l, txns) => loanLedger(l, txns)

export function nextDue(l, now = new Date(), paidMonths) {
  const day = Math.min(Math.max(Math.round(num(l?.dueDay)) || 1, 1), 31)
  const at = (y, m) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()))
  const paid = arr(paidMonths || l?.paidMonths).includes(monthKey(now))
  return iso(paid ? at(now.getFullYear(), now.getMonth() + 1) : at(now.getFullYear(), now.getMonth()))
}

export const INVEST_KINDS = ['Mutual fund', 'Stocks', 'Fixed deposit', 'Recurring deposit', 'PPF', 'EPF', 'NPS', 'Gold', 'Bonds', 'Real estate', 'Crypto', 'Other']
export const SAVINGS_KINDS = ['Savings account', 'Current account', 'Cash', 'Wallet / UPI', 'Other']
export const LOAN_KINDS = ['Home loan', 'Car loan', 'Personal loan', 'Education loan', 'Gold loan', 'Business loan', 'Credit card', 'Other']
