import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getState, putSlice } from '../lib/api'
import { uid } from '../ws/lib'
import { iso } from '../lib/helpers'
import { arr, monthKey, addMonths, autoCategory, matchLoan, liveAccount, liveInvestment, normalizeTxn } from './lib'

// list name -> MongoDB slice
const LISTS = { txns: 'pfTxns', investments: 'pfInvestments', goals: 'pfGoals', savings: 'pfSavings', loans: 'pfEmis' }
const DEFAULT_SETTINGS = { emergencyMonths: 6, expenseOverride: 0, imports: [], contributors: [] }
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})

export function usePersonalFinance() {
  const [s, setS] = useState({
    txns: [], investments: [], goals: [], savings: [], loans: [],
    settings: DEFAULT_SETTINGS,
    tab: 'overview',
    month: monthKey(),
    loanId: '', // loan page open in Loans & EMIs
  })
  const update = useCallback((p) => setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) })), [])

  const hydrated = useRef(false)
  useEffect(() => {
    let alive = true
    getState().then((d) => {
      if (alive && d) {
        update({
          txns: arr(d.pfTxns).map(normalizeTxn), investments: arr(d.pfInvestments), goals: arr(d.pfGoals),
          savings: arr(d.pfSavings), loans: arr(d.pfEmis),
          settings: { ...DEFAULT_SETTINGS, ...obj(d.pfSettings) },
        })
      }
      hydrated.current = true
    })
    return () => { alive = false }
  }, [update])

  const persist = useCallback((k, v) => { if (hydrated.current) putSlice(k, v) }, [])
  useEffect(() => persist(LISTS.txns, s.txns), [s.txns, persist])
  useEffect(() => persist(LISTS.investments, s.investments), [s.investments, persist])
  useEffect(() => persist(LISTS.goals, s.goals), [s.goals, persist])
  useEffect(() => persist(LISTS.savings, s.savings), [s.savings, persist])
  useEffect(() => persist(LISTS.loans, s.loans), [s.loans, persist])
  useEffect(() => persist('pfSettings', s.settings), [s.settings, persist])

  const setTab = useCallback((tab) => update({ tab, loanId: '' }), [update])
  // intent: '' | 'edit' | 'record' | 'split' — what to open straight away on the loan page
  const openLoan = useCallback((loanId, intent = '') => update({ tab: 'loans', loanId: loanId || '', loanIntent: intent }), [update])
  const clearLoanIntent = useCallback(() => update({ loanIntent: '' }), [update])

  /* People who sometimes give money towards a loan ("Me" is implicit). */
  const addContributor = useCallback((name) => {
    const n = (name || '').trim()
    if (!n) return ''
    const id = uid('c')
    update((p) => ({ settings: { ...p.settings, contributors: arr(p.settings?.contributors).concat([{ id, name: n }]) } }))
    return id
  }, [update])
  const renameContributor = useCallback((id, name) => {
    update((p) => ({ settings: { ...p.settings, contributors: arr(p.settings?.contributors).map((c) => (c.id === id ? { ...c, name } : c)) } }))
  }, [update])
  const removeContributor = useCallback((id) => {
    update((p) => ({ settings: { ...p.settings, contributors: arr(p.settings?.contributors).filter((c) => c.id !== id) } }))
  }, [update])
  const setMonth = useCallback((month) => update({ month }), [update])
  const shiftMonth = useCallback((k) => update((p) => ({ month: addMonths(p.month, k) })), [update])

  // A balance / value typed in by hand becomes the new starting point (see balanceBase in lib.js).
  const stampBase = (kind, change) => {
    const typed = kind === 'savings' ? 'balance' in change : kind === 'investments' ? 'invested' in change || 'current' in change : false
    return typed ? { ...change, asOf: iso(new Date()), balanceAt: Date.now(), ...(kind === 'savings' ? { updatedAt: iso(new Date()) } : {}) } : change
  }

  const add = useCallback((kind, item) => {
    const id = uid(kind.slice(0, 2))
    update((p) => {
      const row = { ...stampBase(kind, item), id, createdAt: Date.now() }
      const out = { [kind]: arr(p[kind]).concat([kind === 'txns' ? normalizeTxn(row) : row]) }
      // remember the account used last, to suggest it next time
      if (kind === 'txns' && item.account) out.settings = { ...p.settings, lastAccount: item.account }
      return out
    })
    return id
  }, [update])

  const patch = useCallback((kind, id, change) => {
    update((p) => ({ [kind]: arr(p[kind]).map((x) => {
      if (x.id !== id) return x
      const next = { ...x, ...stampBase(kind, change) }
      return kind === 'txns' ? normalizeTxn(next) : next
    }) }))
  }, [update])

  const remove = useCallback((kind, id) => {
    update((p) => {
      const out = { [kind]: arr(p[kind]).filter((x) => x.id !== id) }
      if (kind === 'loans') out.txns = arr(p.txns).map((t) => (t.loanId === id ? { ...t, loanId: '' } : t))
      if (kind === 'savings') out.txns = arr(p.txns).map((t) => (t.account === id ? { ...t, account: '' } : t))
      if (kind === 'investments') out.txns = arr(p.txns).map((t) => (t.investmentId === id ? { ...t, investmentId: '' } : t))
      if (kind === 'goals') {
        // anything set aside for the deleted goal becomes un-earmarked
        const clear = (x) => (x.purpose === id ? { ...x, purpose: '' } : x)
        out.savings = arr(p.savings).map(clear)
        out.investments = arr(p.investments).map(clear)
      }
      return out
    })
  }, [update])

  const setSettings = useCallback((change) => update((p) => ({ settings: { ...p.settings, ...change } })), [update])

  const importTxns = useCallback((rows, fileName, account = '') => {
    if (!arr(rows).length) return
    const batch = uid('b')
    const at = Date.now()
    update((p) => ({
      txns: arr(p.txns).concat(rows.map(({ row, ...r }, i) => ({
        ...r, id: batch + '-' + i, batch, source: 'import', note: '', createdAt: at, account,
        // EMI rows are matched to a loan when the amount or lender makes it clear
        loanId: r.type === 'expense' && r.category === 'emi' ? matchLoan(r, p.loans) : '',
      }))),
      settings: {
        ...p.settings,
        imports: [{ id: batch, file: fileName || 'statement', at: new Date().toISOString(), count: rows.length }]
          .concat(arr(p.settings?.imports)).slice(0, 30),
      },
    }))
  }, [update])

  /** Set every transaction from one import to income or expense (re-picking categories). */
  const setBatchType = useCallback((batch, type) => {
    update((p) => ({
      txns: arr(p.txns).map((t) => (t.batch === batch && t.type !== type ? { ...t, type, category: autoCategory(t.desc, type), loanId: '' } : t)),
    }))
  }, [update])

  /** Flip one transaction between income and expense. */
  const flipType = useCallback((id) => {
    update((p) => ({
      txns: arr(p.txns).map((t) => {
        if (t.id !== id) return t
        const type = t.type === 'income' ? 'expense' : 'income'
        return { ...t, type, category: autoCategory(t.desc, type), loanId: '' }
      }),
    }))
  }, [update])

  const undoImport = useCallback((batch) => {
    update((p) => ({
      txns: arr(p.txns).filter((t) => t.batch !== batch),
      settings: { ...p.settings, imports: arr(p.settings?.imports).filter((b) => b.id !== batch) },
    }))
  }, [update])

  const toggleLoanPaid = useCallback((id, ym) => {
    update((p) => ({
      loans: arr(p.loans).map((l) => {
        if (l.id !== id) return l
        const paid = arr(l.paidMonths)
        return { ...l, paidMonths: paid.includes(ym) ? paid.filter((m) => m !== ym) : paid.concat([ym]) }
      }),
    }))
  }, [update])

  // Balances and investment values as they stand after linked transactions.
  const live = useMemo(() => ({
    ...s,
    savings: arr(s.savings).map((x) => liveAccount(x, s.txns)),
    investments: arr(s.investments).map((x) => liveInvestment(x, s.txns)),
  }), [s])

  return {
    state: live,
    actions: { setTab, openLoan, clearLoanIntent, addContributor, renameContributor, removeContributor, setMonth, shiftMonth, add, patch, remove, setSettings, importTxns, undoImport, setBatchType, flipType, toggleLoanPaid },
  }
}
