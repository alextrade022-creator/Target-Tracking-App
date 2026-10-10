// Consultation leads: stages, options and pure helpers.
//
// Money rule: before "Proposal sent" we only know what the client says they can
// afford (`budget`). From Proposal sent onwards the lead carries the quoted /
// agreed `deal` value, and moving a lead there requires one.

import { iso } from '../lib/helpers'

export const STAGES = [
  { k: 'new', label: 'New', color: '#64748B' },
  { k: 'contacted', label: 'Contacted', color: '#2D74D8' },
  { k: 'discovery', label: 'Discovery meeting', color: '#7C5AE8' },
  { k: 'proposal', label: 'Proposal sent', color: '#C6871B' },
  { k: 'negotiation', label: 'Negotiation', color: '#DD6A1E' },
  { k: 'won', label: 'Won', color: '#16A34A' },
  { k: 'lost', label: 'Lost', color: '#DC4A63' },
]
export const IDX = Object.fromEntries(STAGES.map((s, i) => [s.k, i]))
export const OPEN = ['new', 'contacted', 'discovery', 'proposal', 'negotiation']
export const DEAL_FROM = IDX.proposal

export const SERVICES = ['Finance', 'Operation', 'Marketing', 'Sales', 'Other']
export const SOURCES = ['Ads', 'Reference', 'Website', 'Organic', 'Event', 'Walk-in', 'Other']
export const LOST_REASONS = [
  'Not qualified', 'Not reachable / wrong number', 'Budget too low', 'Chose another consultant',
  'Not interested right now', 'Enquiry for another service', 'Other',
]

// Leads belong to this workspace business (meetings scheduled from a lead go there).
export const CONSULTING_ID = 'consulting'

export const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])
export const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0 }
export const stageDef = (k) => STAGES[IDX[k]] || STAGES[0]
export const stageLabel = (k) => stageDef(k).label
export const isOpen = (l) => OPEN.includes(l?.stage)
export const todayIso = () => iso(new Date())

export function addDays(n, from = new Date()) {
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return iso(d)
}

/** Whole days from ISO date a to ISO date b (b − a). */
export function daysBetween(a, b) {
  if (!a || !b) return 0
  const t = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((t(b) - t(a)) / 864e5)
}

export const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN')
export function shortInr(n) {
  n = n || 0
  if (n >= 1e7) return '₹' + +(n / 1e7).toFixed(1) + ' Cr'
  if (n >= 1e5) return '₹' + +(n / 1e5).toFixed(1) + 'L'
  if (n >= 1e3) return '₹' + Math.round(n / 1e3) + 'k'
  return '₹' + Math.round(n)
}

/** The figure a card shows: deal value from Proposal sent on, else "can afford". */
export function money(l) {
  if (l?.stage !== 'lost' && IDX[l?.stage] >= DEAL_FROM && num(l?.deal)) return { kind: 'deal', v: num(l.deal) }
  return { kind: 'afford', v: num(l?.budget) }
}

/** Follow-up state: null (closed / none), or { days, late, today }. */
export function followState(l, today = todayIso()) {
  if (!isOpen(l) || !l.followUp) return null
  const d = daysBetween(today, l.followUp)
  return { days: d, late: d < 0, today: d === 0 }
}
export const isDue = (l, today = todayIso()) => { const f = followState(l, today); return !!f && f.days <= 0 }

export const QUIET_DAYS = 7
export function quietDays(l, today = todayIso()) {
  if (!isOpen(l)) return 0
  const d = daysBetween(l.lastAt || l.createdAt, today)
  return d >= QUIET_DAYS ? d : 0
}

export const phoneKey = (s) => String(s || '').replace(/\D/g, '').slice(-10)

export function matchesFilters(l, f, today = todayIso()) {
  if (f.service !== 'all' && l.service !== f.service) return false
  if (f.source !== 'all' && l.source !== f.source) return false
  if (f.due && !isDue(l, today)) return false
  const c = l.createdAt || ''
  if (f.range === 'month' && c.slice(0, 7) !== today.slice(0, 7)) return false
  if (f.range === '3m' && c < addDays(-90)) return false
  if (f.range === 'custom') {
    if (f.from && c < f.from) return false
    if (f.to && c > f.to) return false
  }
  const q = (f.q || '').trim().toLowerCase()
  if (q && ![l.name, l.person, l.phone, l.place, l.bizType, l.email].join(' ').toLowerCase().includes(q)) return false
  return true
}

/** Sort for a pipeline column: soonest follow-up first, then most recent activity. */
export function boardSort(a, b) {
  const fa = a.followUp || '9999', fb = b.followUp || '9999'
  return fa.localeCompare(fb) || String(b.lastAt || '').localeCompare(String(a.lastAt || ''))
}

export function summary(list) {
  const open = list.filter(isOpen)
  const won = list.filter((l) => l.stage === 'won')
  const lost = list.filter((l) => l.stage === 'lost')
  const early = open.filter((l) => IDX[l.stage] < DEAL_FROM).reduce((t, l) => t + num(l.budget), 0)
  const inPlay = open.filter((l) => IDX[l.stage] >= DEAL_FROM).reduce((t, l) => t + num(l.deal), 0)
  const wonValue = won.reduce((t, l) => t + num(l.deal), 0)
  const rate = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : null
  const days = won.filter((l) => l.closedAt).map((l) => daysBetween(l.createdAt, l.closedAt))
  const avgDays = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null
  const avgDeal = won.length ? wonValue / won.length : null
  return { open, won, lost, early, inPlay, wonValue, rate, avgDays, avgDeal }
}

/* ---------- one-time import of the old lead pipeline ---------- */

const SERVICE_OF = { finance: 'Finance', operation: 'Operation', marketing: 'Marketing', sales: 'Sales', other: 'Other' }

function legacyStage(l) {
  const sub = String(l?.substatus || '')
  switch (l?.stage) {
    case 'contacted':
      if (sub === 'Not Qualified') return ['lost', 'Not qualified']
      if (sub === 'Not Inquiry / Wrong Number') return ['lost', 'Not reachable / wrong number']
      if (sub === 'Enquiry for other service') return ['lost', 'Enquiry for another service']
      return ['contacted']
    case 'active':
      return sub === 'Meeting Scheduled' ? ['discovery'] : ['contacted']
    case 'meeting_sch':
    case 'meeting_done':
      return ['discovery']
    case 'proposal':
      return ['proposal']
    case 'final':
      if (sub === 'Closed Won') return ['won']
      if (sub.startsWith('Lost')) return ['lost', 'Not qualified']
      return ['negotiation']
    default:
      return ['new']
  }
}

/** Map records from the old `leads` slice into consultation leads. */
export function migrateLegacy(list, makeId) {
  const today = todayIso()
  return arr(list).map((o) => {
    const [stage, lostReason = ''] = legacyStage(o)
    const created = /^\d{4}-\d{2}-\d{2}/.test(o.date || '') ? o.date.slice(0, 10) : today
    const closed = stage === 'won' || stage === 'lost'
    const notes = arr(o.notes).map((n) => ({
      id: makeId('a'), at: n.at || n.date || created, kind: 'note', text: String(n.text || '').trim(),
    })).filter((n) => n.text)
    const service = SERVICE_OF[o.dept] || 'Other'
    return {
      id: makeId('l'),
      name: String(o.brand || o.name || 'N/A').trim(),
      person: o.brand ? String(o.name || '').trim() : '',
      phone: String(o.phone || '').trim(),
      email: '',
      source: 'Other',
      service,
      bizType: o.businessType || '',
      place: o.place || '',
      since: o.businessSince || '',
      turnover: o.sales || '',
      situation: [o.situation, service === 'Other' && o.deptOther ? 'Asked for: ' + o.deptOther : ''].filter(Boolean).join('\n'),
      stage,
      reached: stage === 'lost' ? IDX.contacted : IDX[stage],
      budget: 0,
      deal: 0,
      followUp: '',
      lostReason,
      closedAt: closed ? created : '',
      startDate: '',
      createdAt: created,
      lastAt: created,
      meetingIds: [],
      timeline: notes.concat([{ id: makeId('a'), at: created, kind: 'created', text: 'Imported from the old lead pipeline' }]),
    }
  })
}
