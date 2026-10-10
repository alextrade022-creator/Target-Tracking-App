import { useCallback, useEffect, useRef, useState } from 'react'
import { getState, putSlice } from '../lib/api'
import { uid } from '../ws/lib'
import { arr, num, IDX, OPEN, todayIso, migrateLegacy, stageLabel } from './lib'

/* Consultation leads live in two MongoDB slices: crmLeads (the records) and
   crmSettings ({ migrated }). The old `leads` slice is read once and imported. */

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const entry = (kind, text) => ({ id: uid('a'), at: new Date().toISOString(), kind, text })

function applyMove(l, stage, { deal, lostReason, startDate, note } = {}) {
  const from = l.stage
  if (from === stage) return l
  const today = todayIso()
  const next = { ...l, stage, lastAt: today }
  if (deal !== undefined) next.deal = num(deal)
  if (stage === 'won') Object.assign(next, { reached: IDX.won, closedAt: today, followUp: '', startDate: startDate || '', lostReason: '' })
  else if (stage === 'lost') Object.assign(next, { closedAt: today, followUp: '', lostReason: lostReason || 'Other' })
  else Object.assign(next, { reached: Math.max(num(l.reached), IDX[stage]), closedAt: '', lostReason: '' })
  const extra = stage === 'lost' ? next.lostReason : stage === 'won' && startDate ? 'engagement starts ' + startDate : ''
  const text = 'Moved from ' + stageLabel(from) + ' to ' + stageLabel(stage) + (extra ? ' · ' + extra : '') + (note ? ' · ' + note : '')
  return { ...next, timeline: [entry('stage', text)].concat(arr(l.timeline)) }
}

const DEFAULT_FILTERS = { q: '', service: 'all', source: 'all', range: 'all', from: '', to: '', due: false }

export function useLeads() {
  const [s, setS] = useState({
    leads: [],
    settings: {},
    view: 'pipeline', // pipeline | list | insights
    filters: DEFAULT_FILTERS,
    openId: '',
  })
  const update = useCallback((p) => setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) })), [])

  const hydrated = useRef(false)
  useEffect(() => {
    let alive = true
    getState().then((d) => {
      if (alive && d) {
        let leads = arr(d.crmLeads)
        const settings = obj(d.crmSettings)
        if (!settings.migrated) {
          if (!leads.length) leads = migrateLegacy(d.leads, uid)
          settings.migrated = true
        }
        update({ leads, settings })
      }
      hydrated.current = true
    })
    return () => { alive = false }
  }, [update])

  const persist = useCallback((k, v) => { if (hydrated.current) putSlice(k, v) }, [])
  useEffect(() => persist('crmLeads', s.leads), [s.leads, persist])
  useEffect(() => persist('crmSettings', s.settings), [s.settings, persist])

  const setView = useCallback((view) => update({ view }), [update])
  const setFilter = useCallback((patch) => update((p) => ({ filters: { ...p.filters, ...patch } })), [update])
  const openLead = useCallback((openId) => update({ openId: openId || '' }), [update])

  const edit = useCallback((id, fn) => update((p) => ({ leads: arr(p.leads).map((l) => (l.id === id ? fn(l) : l)) })), [update])

  const addLead = useCallback((d) => {
    const id = uid('l')
    const today = todayIso()
    update((p) => ({
      leads: [{
        id, name: d.name.trim(), person: (d.person || '').trim(), phone: d.phone.trim(), email: '',
        source: d.source, service: d.service, bizType: '', place: '', since: '', turnover: '', situation: '',
        stage: 'new', reached: 0, budget: num(d.budget), deal: 0, followUp: d.followUp || '',
        lostReason: '', closedAt: '', startDate: '', createdAt: today, lastAt: today, meetingIds: [],
        timeline: [entry('created', 'Lead added from ' + d.source)],
      }].concat(arr(p.leads)),
    }))
    return id
  }, [update])

  /** Plain field edits (contact, profile, money, follow-up). */
  const patchLead = useCallback((id, patch) => edit(id, (l) => ({ ...l, ...patch })), [edit])

  /** Stage change. Callers must ensure a deal value exists from Proposal sent on. */
  const moveLead = useCallback((id, stage, opts) => edit(id, (l) => applyMove(l, stage, opts)), [edit])

  /** Reopen a won/lost lead at the furthest open stage it had reached. */
  const reopenLead = useCallback((id) => {
    edit(id, (l) => applyMove(l, OPEN[Math.min(num(l.reached), OPEN.length - 1)]))
  }, [edit])

  const logActivity = useCallback((id, kind, text, patch = {}) => {
    edit(id, (l) => ({ ...l, ...patch, lastAt: todayIso(), timeline: [entry(kind, text)].concat(arr(l.timeline)) }))
  }, [edit])

  const removeEntry = useCallback((id, entryId) => {
    edit(id, (l) => ({ ...l, timeline: arr(l.timeline).filter((t) => t.id !== entryId) }))
  }, [edit])

  const removeLead = useCallback((id) => {
    update((p) => ({ leads: arr(p.leads).filter((l) => l.id !== id), openId: p.openId === id ? '' : p.openId }))
  }, [update])

  return {
    state: s,
    actions: { setView, setFilter, openLead, addLead, patchLead, moveLead, reopenLead, logActivity, removeEntry, removeLead },
  }
}
