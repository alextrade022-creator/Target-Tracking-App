// Bank-statement import: reads CSV / Excel, finds the header row, guesses the
// column mapping, and turns rows into transactions (with de-duplication).
import { iso } from '../lib/helpers'
import { autoCategory, num, arr } from './lib'

// Row cells must keep their positions (empty cells included) — never filter them.
export const cells = (r) => (Array.isArray(r) ? r : [])

export async function readRows(file) {
  const XLSX = await import('xlsx')
  const name = (file?.name || '').toLowerCase()
  let wb
  if (/\.(csv|txt)$/.test(name) || file?.type === 'text/csv') {
    // raw: keep every cell as typed text, so "01/10/26" isn't reinterpreted as a US date
    wb = XLSX.read(await file.text(), { type: 'string', raw: true })
  } else {
    wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  }
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '', blankrows: false })
  return rows.map((r) => cells(r).map((c) => (typeof c === 'string' ? c.trim() : c)))
}

const pad = (n) => String(n).padStart(2, '0')
function ymd(y, m, d) {
  y = +y; m = +m; d = +d
  if (!(y > 1900 && y < 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return ''
  if (new Date(y, m - 1, d).getMonth() !== m - 1) return '' // e.g. 31 Feb
  return `${y}-${pad(m)}-${pad(d)}`
}
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const yr = (y) => (String(y).length === 2 ? '20' + y : y)

export function parseDate(v, order = 'dmy') {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'number') {
    if (v > 20000 && v < 80000) { // Excel serial date
      const d = new Date(Math.round((v - 25569) * 86400000))
      return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
    }
    return ''
  }
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? '' : iso(v)
  const s = String(v).trim()
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return ymd(m[1], m[2], m[3])
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/)
  if (m) return order === 'mdy' ? ymd(yr(m[3]), m[1], m[2]) : ymd(yr(m[3]), m[2], m[1])
  m = s.match(/^(\d{1,2})[-\s/.]*([A-Za-z]{3,9})[-\s/.,]*(\d{2,4})\b/)
  if (m) { const i = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()); return i >= 0 ? ymd(yr(m[3]), i + 1, m[1]) : '' }
  m = s.match(/^([A-Za-z]{3,9})[-\s.]+(\d{1,2}),?[-\s]+(\d{4})/)
  if (m) { const i = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()); return i >= 0 ? ymd(m[3], i + 1, m[2]) : '' }
  return ''
}

/** "1,245.00", "₹ 1245 Dr", "(500.00)", -300 → { n, drcr } or null */
export function parseAmount(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? { n: v, drcr: '' } : null
  let s = String(v ?? '').trim()
  if (!s) return null
  let drcr = ''
  if (/\bdr\.?$/i.test(s)) drcr = 'dr'
  else if (/\bcr\.?$/i.test(s)) drcr = 'cr'
  const neg = /^\(.*\)$/.test(s) || /^-/.test(s) || /-$/.test(s)
  s = s.replace(/[^0-9.]/g, '')
  const n = parseFloat(s)
  if (!Number.isFinite(n)) return null
  return { n: neg ? -n : n, drcr }
}

export function findHeader(rows) {
  const lim = Math.min(rows.length, 40)
  for (let i = 0; i < lim; i++) {
    const lower = cells(rows[i]).map((c) => String(c ?? '').toLowerCase())
    if (lower.some((c) => /date/.test(c)) && lower.some((c) => /amount|amt|debit|credit|withdraw|deposit|\bdr\b|\bcr\b/.test(c))) return i
  }
  for (let i = 0; i < lim; i++) if (cells(rows[i]).filter((c) => String(c ?? '').trim()).length >= 2) return i
  return 0
}

export function guessMapping(header) {
  const h = cells(header).map((c) => String(c ?? '').toLowerCase().trim())
  const find = (re, not) => h.findIndex((c) => c && re.test(c) && !(not && not.test(c)))
  let date = find(/(txn|tran|transaction|posting|booking).*date/)
  if (date < 0) date = find(/date/, /value/)
  if (date < 0) date = find(/date/)
  const desc = find(/narration|description|particular|detail|remark|merchant|payee/)
  const debit = find(/withdraw|debit|\bdr\b|paid out|money out|spent/, /credit|\bcr\b/)
  const credit = find(/deposit|credit|\bcr\b|paid in|money in|received/, /debit|\bdr\b/)
  const amount = find(/amount|amt/, /balance/)
  const typeCol = find(/^(type|txn type|transaction type|dr ?\/ ?cr|cr ?\/ ?dr|debit ?\/ ?credit|credit ?\/ ?debit)$/)
  const mode = debit >= 0 && credit >= 0 ? 'split' : typeCol >= 0 ? 'type' : 'sign'
  return {
    date, desc, debit, credit, typeCol, mode,
    amount: amount >= 0 ? amount : debit >= 0 ? debit : credit,
    rule: 'sign', order: 'dmy',
  }
}

const txnKey = (t) =>
  [t.date, Math.round(num(t.amount) * 100), t.type, String(t.desc || '').toLowerCase().replace(/\s+/g, ' ').trim()].join('|')

export function buildImport(rows, cfg, existing = []) {
  const counts = new Map()
  arr(existing).forEach((t) => { const k = txnKey(t); counts.set(k, (counts.get(k) || 0) + 1) })
  const fresh = []
  let skipped = 0, dupes = 0
  for (let i = cfg.headerRow + 1; i < rows.length; i++) {
    const r = cells(rows[i])
    const date = parseDate(r[cfg.date], cfg.order)
    if (!date) { skipped++; continue }
    let amount = 0, type = ''
    if (cfg.mode === 'split') {
      const dr = parseAmount(r[cfg.debit]), cr = parseAmount(r[cfg.credit])
      if (dr && Math.abs(dr.n) > 0) { amount = Math.abs(dr.n); type = 'expense' }
      else if (cr && Math.abs(cr.n) > 0) { amount = Math.abs(cr.n); type = 'income' }
    } else {
      const a = parseAmount(r[cfg.amount])
      if (a && a.n !== 0) {
        amount = Math.abs(a.n)
        if (cfg.mode === 'type') {
          const tv = String(r[cfg.typeCol] ?? '').trim().toLowerCase()
          type = /^(c|cr|credit|deposit|in)/.test(tv) ? 'income' : /^(d|dr|debit|withdraw|out)/.test(tv) ? 'expense' : a.n < 0 ? 'expense' : 'income'
        } else if (a.drcr) type = a.drcr === 'cr' ? 'income' : 'expense'
        else if (cfg.rule === 'allExpense') type = 'expense'
        else type = a.n < 0 ? 'expense' : 'income'
      }
    }
    if (!amount || !type) { skipped++; continue }
    const desc = String(r[cfg.desc] ?? '').replace(/\s+/g, ' ').trim() || 'N/A'
    const t = { date, desc, amount: Math.round(amount * 100) / 100, type, category: autoCategory(desc, type) }
    const k = txnKey(t)
    if ((counts.get(k) || 0) > 0) { counts.set(k, counts.get(k) - 1); dupes++; continue }
    fresh.push(t)
  }
  return { fresh, skipped, dupes }
}
