import { useCallback, useEffect, useRef, useState } from 'react'
import { getState, putSlice } from '../lib/api'
import { uid } from '../ws/lib'
import { arr, num, todayIso, fyOf, DEFAULT_SETTINGS } from './lib'

/* Client payments live in two MongoDB slices: paySales (one record per piece of
   paid work, with its plan, payments, reminders and notes) and paySettings
   (sign-off, UPI ID, receipt details, message template, receipt counters). */

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})

export function usePayments() {
  const [s, setS] = useState({
    sales: [],
    settings: DEFAULT_SETTINGS,
    view: 'due', // due | clients | history
    origin: 'all', // all | pipeline | direct
    openId: '',
  })
  const update = useCallback((p) => setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) })), [])

  const hydrated = useRef(false)
  useEffect(() => {
    let alive = true
    getState().then((d) => {
      if (alive && d) update({ sales: arr(d.paySales), settings: { ...DEFAULT_SETTINGS, ...obj(d.paySettings) } })
      hydrated.current = true
    })
    return () => { alive = false }
  }, [update])

  const persist = useCallback((k, v) => { if (hydrated.current) putSlice(k, v) }, [])
  useEffect(() => persist('paySales', s.sales), [s.sales, persist])
  useEffect(() => persist('paySettings', s.settings), [s.settings, persist])

  const edit = useCallback((id, fn) => update((p) => ({ sales: arr(p.sales).map((x) => (x.id === id ? fn(x) : x)) })), [update])

  const setView = useCallback((view) => update({ view }), [update])
  const setOrigin = useCallback((origin) => update({ origin }), [update])
  const openSale = useCallback((openId) => update({ openId: openId || '' }), [update])
  const setSettings = useCallback((patch) => update((p) => ({ settings: { ...p.settings, ...patch } })), [update])

  /** New sale. Returns its id. */
  const addSale = useCallback((d) => {
    const id = uid('s')
    update((p) => (d.leadId && arr(p.sales).some((x) => x.leadId === d.leadId) ? {} : {
      sales: arr(p.sales).concat([{
        id,
        origin: d.origin || 'direct',
        leadId: d.leadId || '',
        title: (d.title || '').trim(),
        name: (d.name || '').trim(),
        person: (d.person || '').trim(),
        phone: (d.phone || '').trim(),
        service: d.service || 'Other',
        deal: num(d.deal),
        won: d.won || todayIso(),
        plan: d.plan || null,
        inst: arr(d.inst).map((i) => ({ id: uid('i'), label: i.label, due: i.due, amount: num(i.amount) })),
        expect: d.expect || null,
        pays: [],
        reminders: [],
        notes: [],
        createdAt: Date.now(),
      }]),
    }))
    return id
  }, [update])

  /** Create the sale for a won lead. A lead never gets a second sale. */
  const addFromLead = useCallback((lead, deal) => addSale({
    origin: 'pipeline', leadId: lead.id, name: lead.name, person: lead.person, phone: lead.phone,
    service: lead.service, deal: num(deal) || num(lead.deal), won: todayIso(),
  }), [addSale])

  const patchSale = useCallback((id, patch) => edit(id, (x) => ({ ...x, ...patch })), [edit])

  const setPlan = useCallback((id, plan, rows, expect) => {
    edit(id, (x) => ({
      ...x,
      plan,
      inst: plan === 'instalments' ? arr(rows).map((r) => ({ id: uid('i'), label: (r.label || '').trim() || 'Instalment', due: r.due || todayIso(), amount: num(r.amount) })) : [],
      expect: plan === 'flexible' ? { date: expect?.date || '', amount: num(expect?.amount) } : null,
    }))
  }, [edit])

  const removeSale = useCallback((id) => {
    update((p) => ({ sales: arr(p.sales).filter((x) => x.id !== id), openId: p.openId === id ? '' : p.openId }))
  }, [update])

  /** Record a payment and give it the next receipt number for its financial year.
   *  Returns the new payment id. */
  const recordPayment = useCallback((saleId, { amount, date, mode, ref, nextDate }) => {
    const id = uid('p')
    const day = date || todayIso()
    update((p) => {
      const st = { ...DEFAULT_SETTINGS, ...p.settings }
      const fy = fyOf(day)
      const n = num(st.counters?.[fy]) + 1
      const receipt = `${st.prefix || 'BC'}/${fy}/${String(n).padStart(3, '0')}`
      return {
        settings: { ...st, counters: { ...st.counters, [fy]: n } },
        sales: arr(p.sales).map((x) => {
          if (x.id !== saleId) return x
          const pays = arr(x.pays).concat([{ id, date: day, amount: num(amount), mode, ref: (ref || '').trim(), receipt, createdAt: Date.now() }])
          const next = { ...x, pays }
          if (x.plan === 'flexible') next.expect = nextDate ? { date: nextDate, amount: 0 } : null
          return next
        }),
      }
    })
    return id
  }, [update])

  const removePayment = useCallback((saleId, payId) => {
    edit(saleId, (x) => ({ ...x, pays: arr(x.pays).filter((p) => p.id !== payId) }))
  }, [edit])

  const logReminder = useCallback((saleId, note = 'WhatsApp reminder') => {
    edit(saleId, (x) => ({ ...x, reminders: [{ id: uid('r'), date: todayIso(), note }].concat(arr(x.reminders)) }))
  }, [edit])

  const addNote = useCallback((saleId, text) => {
    const t = (text || '').trim()
    if (!t) return
    edit(saleId, (x) => ({ ...x, notes: [{ id: uid('n'), date: todayIso(), text: t }].concat(arr(x.notes)) }))
  }, [edit])

  const removeNote = useCallback((saleId, noteId) => {
    edit(saleId, (x) => ({ ...x, notes: arr(x.notes).filter((n) => n.id !== noteId) }))
  }, [edit])

  return {
    state: s,
    actions: {
      setView, setOrigin, openSale, setSettings,
      addSale, addFromLead, patchSale, setPlan, removeSale,
      recordPayment, removePayment, logReminder, addNote, removeNote,
    },
  }
}
