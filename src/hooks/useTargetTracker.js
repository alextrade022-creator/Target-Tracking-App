import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONFIG } from '../config'
import {
  MONTHS, FULL, NOW, GOALS, WEEKLY, STAGES, DUE_ISO, PALETTE,
  MONTH_NAMES, DOW, BRAND_STAGES, PLATFORMS,
} from '../lib/constants'
import { iso, fmt, pretty, todayLabel } from '../lib/helpers'
import { getState, putSlice } from '../lib/api'

/* ----------------------------------------------------------------------
   Persistence lives in MongoDB, reached through the /api/state endpoints
   (see src/lib/api.js and the /api folder). State starts from in-memory
   defaults, is hydrated from the API on mount, and each persisted slice is
   synced back to the API whenever it changes.
   ---------------------------------------------------------------------- */
const initialState = () => ({
  done: {},
  sel: NOW,
  page: 'dash',
  custom: [],
  notes: '',
  edits: {},
  hidden: {},
  todos: [],
  archive: [],
  printing: false,
  repMonth: NOW,
  filter: 'all',
  meetings: [],
  calY: 2026,
  calM: 8,
  calSel: '2026-09-02',
  xgoals: [],
  gedits: {},
  branding: [],
  gdraft: { name: '', target: '', due: '2027-03-31', color: '#5FA8FF' },
  draft: { goal: 'edudot', month: NOW, week: 'ms', text: '' },
  tdraft: { title: '', who: '', from: iso(new Date()), due: '', details: '' },
  mdraft: { title: '', who: '', date: '2026-09-02', time: '10:00', notes: '' },
  bdraft: { hook: '', body: '', cta: '' },
})

/* helper: milestone map for a goal, scaled for the student-band goal */
function msFor(g, scale) {
  if (!g.steps) return g.ms
  const out = {}
  let cum = 0
  g.steps.forEach((v, i) => {
    const add = Math.round(v * scale)
    cum += add
    out[i] = ['+' + add + ' → ' + cum + ' students']
  })
  return out
}

export function useTargetTracker() {
  const [state, setState] = useState(initialState)

  // functional partial update, matching the original setState(s => partial) merge semantics
  const update = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  }, [])

  /* ---- hydrate from MongoDB once on mount ---- */
  const hydrated = useRef(false)
  useEffect(() => {
    let alive = true
    getState().then((data) => {
      if (alive && data) {
        update({
          done: data.done ?? {},
          custom: data.custom ?? [],
          notes: data.notes ?? '',
          edits: data.edits ?? {},
          hidden: data.hidden ?? {},
          todos: data.todos ?? [],
          archive: data.archive ?? [],
          meetings: data.meetings ?? [],
          xgoals: data.goals ?? [],
          gedits: data.goalEdits ?? {},
          branding: data.branding ?? [],
        })
      }
      hydrated.current = true
    })
    return () => { alive = false }
  }, [update])

  /* ---- persistence: sync each slice to MongoDB on change (after hydration).
     putSlice is debounced and skips unchanged values, so the hydration
     re-render does not echo the freshly loaded data back to the server. ---- */
  const persist = useCallback((key, value) => {
    if (hydrated.current) putSlice(key, value)
  }, [])
  useEffect(() => persist('done', state.done), [state.done, persist])
  useEffect(() => persist('custom', state.custom), [state.custom, persist])
  useEffect(() => persist('notes', state.notes), [state.notes, persist])
  useEffect(() => persist('edits', state.edits), [state.edits, persist])
  useEffect(() => persist('hidden', state.hidden), [state.hidden, persist])
  useEffect(() => persist('todos', state.todos), [state.todos, persist])
  useEffect(() => persist('archive', state.archive), [state.archive, persist])
  useEffect(() => persist('meetings', state.meetings), [state.meetings, persist])
  useEffect(() => persist('goals', state.xgoals), [state.xgoals, persist])
  useEffect(() => persist('goalEdits', state.gedits), [state.gedits, persist])
  useEffect(() => persist('branding', state.branding), [state.branding, persist])

  /* ---- print handling ---- */
  useEffect(() => {
    const after = () => update({ printing: false })
    window.addEventListener('afterprint', after)
    return () => window.removeEventListener('afterprint', after)
  }, [update])

  /* --------------------------- actions --------------------------- */
  const toggle = useCallback((id) => {
    update((s) => {
      const done = { ...s.done }
      if (done[id]) delete done[id]
      else done[id] = 1
      return { done }
    })
  }, [update])

  const editText = useCallback((id, v) => update((s) => ({ edits: { ...s.edits, [id]: v } })), [update])
  const hideItem = useCallback((id) => update((s) => ({ hidden: { ...s.hidden, [id]: 1 } })), [update])
  const restoreAll = useCallback(() => update({ hidden: {} }), [update])

  const setDraft = useCallback((patch) => update((s) => ({ draft: { ...s.draft, ...patch } })), [update])
  const setT = useCallback((patch) => update((s) => ({ tdraft: { ...s.tdraft, ...patch } })), [update])
  const setM = useCallback((patch) => update((s) => ({ mdraft: { ...s.mdraft, ...patch } })), [update])
  const setG = useCallback((patch) => update((s) => ({ gdraft: { ...s.gdraft, ...patch } })), [update])
  const setB = useCallback((patch) => update((s) => ({ bdraft: { ...s.bdraft, ...patch } })), [update])

  /* ---- personal branding ---- */
  const addBranding = useCallback(() => {
    update((s) => {
      const d = s.bdraft || {}
      const hook = (d.hook || '').trim()
      const body = (d.body || '').trim()
      const cta = (d.cta || '').trim()
      if (!hook && !body && !cta) return {} // nothing written — don't add an empty piece
      const item = {
        id: 'b' + Date.now(), hook, body, cta,
        shoot: false, edit: false, post: false,
        platforms: [], postedDate: '', createdAt: Date.now(),
      }
      return { branding: (s.branding || []).concat([item]), bdraft: { hook: '', body: '', cta: '' } }
    })
  }, [update])

  const patchBranding = useCallback((id, patch) => {
    update((s) => ({ branding: (s.branding || []).map((b) => (b.id === id ? { ...b, ...patch } : b)) }))
  }, [update])

  const toggleBrandingStage = useCallback((id, stage) => {
    update((s) => ({
      branding: (s.branding || []).map((b) => (b.id === id ? { ...b, [stage]: !b[stage] } : b)),
    }))
  }, [update])

  const toggleBrandingPlatform = useCallback((id, platform) => {
    update((s) => ({
      branding: (s.branding || []).map((b) => {
        if (b.id !== id) return b
        const cur = Array.isArray(b.platforms) ? b.platforms : []
        const platforms = cur.includes(platform) ? cur.filter((p) => p !== platform) : cur.concat([platform])
        return { ...b, platforms }
      }),
    }))
  }, [update])

  const setBrandingDate = useCallback((id, date) => patchBranding(id, { postedDate: date }), [patchBranding])
  const removeBranding = useCallback((id) => update((s) => ({ branding: (s.branding || []).filter((b) => b.id !== id) })), [update])

  const addTask = useCallback(() => {
    update((s) => {
      const text = (s.draft.text || '').trim()
      if (!text) return {}
      const item = { id: 'c' + Date.now(), goal: s.draft.goal, month: Number(s.draft.month), week: s.draft.week, text }
      return { custom: s.custom.concat([item]), draft: { ...s.draft, text: '' }, sel: item.month }
    })
  }, [update])

  const removeTask = useCallback((id) => update((s) => ({ custom: s.custom.filter((c) => c.id !== id) })), [update])

  const addTodo = useCallback(() => {
    update((s) => {
      const t = s.tdraft
      const title = (t.title || '').trim()
      if (!title) return {}
      const item = { id: 't' + Date.now(), title, who: t.who.trim(), from: t.from, due: t.due, details: t.details.trim(), status: 'todo', at: '' }
      return { todos: s.todos.concat([item]), tdraft: { title: '', who: '', from: iso(new Date()), due: '', details: '' } }
    })
  }, [update])

  const moveTodo = useCallback((id, dir) => {
    update((s) => {
      const order = ['todo', 'prog', 'done']
      const todos = s.todos.map((t) => {
        if (t.id !== id) return t
        const i = Math.max(0, Math.min(2, order.indexOf(t.status) + dir))
        return { ...t, status: order[i], at: order[i] === 'done' ? iso(new Date()) : '' }
      })
      return { todos }
    })
  }, [update])

  const removeTodo = useCallback((id) => update((s) => ({ todos: s.todos.filter((t) => t.id !== id) })), [update])

  const archiveTodo = useCallback((id) => {
    update((s) => {
      const t = s.todos.find((x) => x.id === id)
      if (!t) return {}
      const archive = [{ ...t, at: t.at || iso(new Date()) }].concat(s.archive)
      return { todos: s.todos.filter((x) => x.id !== id), archive }
    })
  }, [update])

  const restoreArchived = useCallback((id) => {
    update((s) => {
      const t = s.archive.find((x) => x.id === id)
      if (!t) return {}
      return { archive: s.archive.filter((x) => x.id !== id), todos: s.todos.concat([{ ...t, status: 'done' }]) }
    })
  }, [update])

  const dropArchived = useCallback((id) => update((s) => ({ archive: s.archive.filter((x) => x.id !== id) })), [update])

  const editGoal = useCallback((k, patch) => {
    update((s) => ({ gedits: { ...s.gedits, [k]: { ...s.gedits[k], ...patch } } }))
  }, [update])

  const addGoal = useCallback(() => {
    update((s) => {
      const g = s.gdraft
      const name = (g.name || '').trim()
      if (!name) return {}
      const item = {
        k: 'g' + Date.now(), name,
        short: (g.target || '').trim().toUpperCase().slice(0, 26) || 'NEW TARGET',
        target: (g.target || '').trim() || 'Target to be defined',
        due: pretty(g.due), dueIso: g.due, color: g.color, custom: true,
      }
      return { xgoals: s.xgoals.concat([item]), gdraft: { ...s.gdraft, name: '', target: '' }, draft: { ...s.draft, goal: item.k } }
    })
  }, [update])

  const removeGoal = useCallback((k) => {
    update((s) => {
      const xgoals = s.xgoals.filter((g) => g.k !== k)
      const custom = s.custom.filter((c) => c.goal !== k)
      const draft = s.draft.goal === k ? { ...s.draft, goal: 'edudot' } : s.draft
      return { xgoals, custom, draft }
    })
  }, [update])

  const addMeeting = useCallback(() => {
    update((s) => {
      const m = s.mdraft
      const title = (m.title || '').trim()
      if (!title || !m.date) return {}
      const item = { id: 'mt' + Date.now(), title, who: m.who.trim(), date: m.date, time: m.time, notes: m.notes.trim(), status: 'pending' }
      return { meetings: s.meetings.concat([item]), calSel: item.date, mdraft: { ...s.mdraft, title: '', who: '', notes: '' } }
    })
  }, [update])

  const patchMeeting = useCallback((id, patch) => {
    update((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  }, [update])

  const removeMeeting = useCallback((id) => update((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) })), [update])

  const shiftMonth = useCallback((delta) => {
    update((s) => {
      let m = s.calM + delta
      let y = s.calY
      if (m < 0) { m = 11; y-- }
      if (m > 11) { m = 0; y++ }
      return { calY: y, calM: m }
    })
  }, [update])

  const setNotes = useCallback((v) => update({ notes: v }), [update])
  const resetProgress = useCallback(() => update({ done: {} }), [update])

  const exportPdf = useCallback(() => {
    update({ printing: true, page: 'report' })
    setTimeout(() => window.print(), 250)
  }, [update])

  const goPage = useCallback((page) => update({ page }), [update])
  const setSel = useCallback((sel) => update({ sel }), [update])
  const setFilter = useCallback((filter) => update({ filter }), [update])
  const setRepMonth = useCallback((repMonth) => update({ repMonth }), [update])
  const selectDay = useCallback((key) => update((s) => ({ calSel: key, mdraft: { ...s.mdraft, date: key } })), [update])
  const setCal = useCallback((patch) => update(patch), [update])

  /* --------------------- derived view values --------------------- */
  const vals = useMemo(() => computeVals(state, { toggle, editText, hideItem, moveTodo, archiveTodo, removeTodo, removeTask, restoreArchived, dropArchived, patchMeeting, removeMeeting, editGoal, removeGoal, setSel, setFilter, selectDay, setM, setCal, toggleBrandingStage, toggleBrandingPlatform, setBrandingDate, removeBranding, patchBranding }), [
    state, toggle, editText, hideItem, moveTodo, archiveTodo, removeTodo, removeTask,
    restoreArchived, dropArchived, patchMeeting, removeMeeting, editGoal, removeGoal,
    setSel, setFilter, selectDay, setM, setCal,
    toggleBrandingStage, toggleBrandingPlatform, setBrandingDate, removeBranding, patchBranding,
  ])

  return {
    state,
    vals,
    actions: {
      toggle, setDraft, setT, setM, setG, addTask, removeTask, addTodo, moveTodo,
      removeTodo, archiveTodo, restoreArchived, dropArchived, editGoal, addGoal,
      removeGoal, addMeeting, patchMeeting, removeMeeting, shiftMonth, setNotes,
      resetProgress, exportPdf, goPage, setSel, setFilter, setRepMonth, restoreAll,
      setB, addBranding, patchBranding, toggleBrandingStage, toggleBrandingPlatform,
      setBrandingDate, removeBranding,
    },
  }
}

/* =====================================================================
   computeVals — the port of the original renderVals().
   Returns plain data (colors/widths as raw values for inline style,
   show/empty flags as booleans for conditional rendering).
   ===================================================================== */
function computeVals(st, a) {
  // Fallback for any displayed value that a stored document may be missing.
  const na = (v) => (v === null || v === undefined || v === '' ? 'N/A' : v)

  // Coerce persisted slices to the expected shape. Data comes from MongoDB, so a
  // document could be missing or the wrong type — guard against undefined maps
  // (`map[id]` would throw) and non-array slices (`.filter`/`.map` would throw).
  const done = st.done || {}
  const hiddenMap = st.hidden || {}
  const editsMap = st.edits || {}
  const geditsMap = st.gedits || {}
  const customArr = Array.isArray(st.custom) ? st.custom : []
  const todosArr = Array.isArray(st.todos) ? st.todos : []
  const archiveArr = Array.isArray(st.archive) ? st.archive : []
  const meetingsArr = Array.isArray(st.meetings) ? st.meetings : []
  const xgoalsArr = Array.isArray(st.xgoals) ? st.xgoals : []
  const brandingArr = Array.isArray(st.branding) ? st.branding : []

  const sel = st.sel
  const target = CONFIG.targetStudents ?? 160
  const scale = target / 160

  const box = (isDone, color) => ({
    boxBorder: isDone ? color : 'var(--box-border)',
    boxBg: isDone ? color : 'transparent',
    tick: isDone ? '✓' : '',
    textColor: isDone ? 'var(--tick-done)' : 'var(--soft)',
    strike: isDone,
  })

  /* ---- combine base goals with edits + custom goals ---- */
  const ed = geditsMap
  const ALL = GOALS.concat(xgoalsArr.map((g) => ({ ms: {}, ...g }))).map((g) => {
    const e = ed[g.k]
    const dueIso = (e && e.due) || g.dueIso || DUE_ISO[g.k] || '2027-03-31'
    if (!e) return { ...g, dueIso }
    return {
      ...g,
      name: e.name != null ? e.name : g.name,
      color: e.color || g.color,
      targetOverride: e.target != null && e.target !== '' ? e.target : null,
      due: pretty(dueIso), dueIso,
    }
  })

  const nameOf = (k) => (ALL.find((g) => g && g.k === k) || {}).name || k || 'N/A'
  const colorOf = (k) => (ALL.find((g) => g && g.k === k) || {}).color || '#4ECDC4'
  const txt = (id, fallback) => (editsMap[id] != null ? editsMap[id] : fallback)

  let allDone = 0
  let allTotal = 0
  const monthDone = MONTHS.map(() => 0)
  const monthTotal = MONTHS.map(() => 0)

  const goals = ALL.map((g) => {
    const ms = msFor(g, scale)
    let gd = 0
    let gt = 0
    const cells = MONTHS.map((m, mi) => {
      let base = (ms[mi] || []).map((t, i) => ({ t, id: 'm:' + g.k + ':' + mi + ':' + i }))
      customArr.forEach((c) => {
        if (c.goal === g.k && c.month === mi && c.week === 'ms') base.push({ t: c.text, id: 'x:' + c.id, custom: true })
      })
      base = base.filter((o) => !hiddenMap[o.id]).map((o) => ({ ...o, t: txt(o.id, o.t) }))
      const list = base.map((o) => {
        const isDone = !!done[o.id]
        gt++; monthTotal[mi]++
        if (isDone) { gd++; monthDone[mi]++ }
        return {
          id: o.id, t: o.t, toggle: () => a.toggle(o.id),
          chipBg: o.custom ? 'rgba(78,205,196,.10)' : isDone ? 'rgb(var(--hair-rgb) / .03)' : 'rgb(var(--hair-rgb) / .055)',
          chipBorder: o.custom ? 'rgba(78,205,196,.35)' : isDone ? 'rgb(var(--hair-rgb) / .05)' : 'rgb(var(--hair-rgb) / .09)',
          ...box(isDone, g.color),
        }
      })
      return { ms: list, current: mi === NOW }
    })
    allDone += gd; allTotal += gt
    return {
      k: g?.k, name: na(g?.name), short: na(g?.short), color: g?.color, due: na(g?.due), cells,
      target: g?.targetOverride || (g?.steps ? target + ' students enrolled (band 120–200)' : na(g?.target)),
      ratio: gd + '/' + gt, pct: gt ? Math.round((gd / gt) * 100) : 0,
    }
  })

  const months = MONTHS.map((m, i) => ({
    label: m.label, yr: m.yr,
    select: () => a.setSel(i),
    selected: i === sel,
    current: i === NOW,
    ratio: monthDone[i] + '/' + monthTotal[i],
    pct: monthTotal[i] ? Math.round((monthDone[i] / monthTotal[i]) * 100) : 0,
  }))

  const weekRows = (mi) => {
    const out = []
    ;(WEEKLY[mi] || []).forEach((tasks, wi) => {
      tasks.forEach((t, ti) => out.push({ id: 'w:' + mi + ':' + wi + ':' + ti, text: t, wi }))
      customArr.forEach((c) => {
        if (c.month === mi && c.week === String(wi)) out.push({ id: 'x:' + c.id, text: c.text, wi, custom: true, goal: c.goal })
      })
    })
    return out.filter((o) => !hiddenMap[o.id]).map((o) => ({ ...o, text: txt(o.id, o.text) }))
  }

  let wd = 0
  let wt = 0
  const weeks = (WEEKLY[sel] || []).map((tasks, wi) => {
    const rows = weekRows(sel).filter((o) => o.wi === wi)
    let d = 0
    const list = rows.map((o) => {
      const isDone = !!done[o.id]
      if (isDone) d++
      return { id: o.id, text: o.text, toggle: () => a.toggle(o.id), ...box(isDone, o.custom ? '#4ECDC4' : '#7BC96F') }
    })
    wd += d; wt += rows.length
    return { label: 'WEEK ' + (wi + 1), tasks: list, ratio: d + '/' + rows.length, pct: rows.length ? Math.round((d / rows.length) * 100) : 0 }
  })

  const customList = customArr.filter((c) => !hiddenMap['x:' + c.id]).map((c) => {
    const id = 'x:' + c.id
    const mo = MONTHS[c?.month]
    const where = mo
      ? mo.label + " '" + mo.yr + (c.week === 'ms' ? ' · MILESTONE' : ' · WEEK ' + (Number(c.week) + 1))
      : 'N/A'
    return {
      id, text: na(txt(id, c?.text)), goalName: nameOf(c?.goal), color: colorOf(c?.goal),
      where,
      toggle: () => a.toggle(id), remove: () => a.removeTask(c?.id),
      ...box(!!done[id], colorOf(c?.goal)),
    }
  })

  const fil = st.filter
  const inFilter = (mi) => fil === 'all' || Number(fil) === mi
  const rowify = (o) => ({
    id: o.id, text: o.text, month: o.month, tag: o.tag, color: o.color,
    toggle: () => a.toggle(o.id),
    edit: (e) => a.editText(o.id, e.target.value),
    remove: () => a.hideItem(o.id),
    ...box(!!done[o.id], o.color),
  })

  const msRaw = []
  MONTHS.forEach((m, mi) => {
    if (!inFilter(mi)) return
    ALL.forEach((g) => {
      const ms = msFor(g, scale)
      ;(ms[mi] || []).forEach((t, i) => {
        const id = 'm:' + g.k + ':' + mi + ':' + i
        if (hiddenMap[id]) return
        msRaw.push({ id, text: txt(id, t), month: m.label + " '" + m.yr, tag: na(g?.name), color: g?.color })
      })
    })
    customArr.forEach((c) => {
      const id = 'x:' + c.id
      if (c.month !== mi || c.week !== 'ms' || hiddenMap[id]) return
      msRaw.push({ id, text: txt(id, c.text), month: m.label + " '" + m.yr, tag: nameOf(c.goal) + ' · ADDED', color: colorOf(c.goal) })
    })
  })

  const wkRaw = []
  MONTHS.forEach((m, mi) => {
    if (!inFilter(mi)) return
    weekRows(mi).forEach((o) =>
      wkRaw.push({
        id: o.id, text: o.text, month: m.label + " '" + m.yr,
        tag: 'WEEK ' + (o.wi + 1) + (o.custom ? ' · ADDED' : ''),
        color: o.custom ? colorOf(o.goal) : '#7BC96F',
      }),
    )
  })

  const filters = [{ v: 'all', label: 'All months' }]
    .concat(MONTHS.map((m, i) => ({ v: String(i), label: m.label + " '" + m.yr })))
    .map((f) => ({ label: f.label, value: f.v, on: fil === f.v, select: () => a.setFilter(f.v) }))

  const todayIso = iso(new Date())
  const columns = STAGES.map((s, si) => {
    const cards = todosArr.filter((t) => t?.status === s.k).map((t) => {
      const overdue = t?.due && t.due < todayIso && t?.status !== 'done'
      return {
        id: t?.id, title: na(t?.title), details: t?.details, who: t?.who,
        from: pretty(t?.from), due: pretty(t?.due),
        hasDetails: !!t?.details, hasWho: !!t?.who, hasFrom: !!t?.from, hasDue: !!t?.due,
        dueColor: overdue ? '#FF6B8A' : 'var(--mute)',
        dueBg: overdue ? 'rgba(255,107,138,.14)' : 'rgb(var(--hair-rgb) / .05)',
        accent: s.color,
        titleColor: s.k === 'done' ? 'var(--mute)' : 'var(--ring)',
        strike: s.k === 'done',
        showBack: si > 0, backLabel: si > 0 ? STAGES[si - 1].label : '',
        showFwd: si < 2, fwdLabel: si < 2 ? STAGES[si + 1].label : '',
        fwdColor: si < 2 ? STAGES[si + 1].color : '',
        showArchive: s.k === 'done',
        back: () => a.moveTodo(t.id, -1),
        forward: () => a.moveTodo(t.id, 1),
        archive: () => a.archiveTodo(t.id),
        remove: () => a.removeTodo(t.id),
      }
    })
    return { label: s.label, color: s.color, tint: s.tint, cards, count: cards.length, empty: cards.length === 0 }
  })

  const history = archiveArr.map((t) => ({
    id: t?.id, title: na(t?.title), who: na(t?.who), due: t?.due ? pretty(t.due) : 'N/A', at: t?.at ? pretty(t.at) : 'N/A',
    restore: () => a.restoreArchived(t?.id), remove: () => a.dropArchived(t?.id),
  }))

  /* ---- report ---- */
  const rm = Number(st.repMonth)
  const repItems = []
  ALL.forEach((g) => {
    const ms = msFor(g, scale)
    ;(ms[rm] || []).forEach((t, i) => {
      const id = 'm:' + g.k + ':' + rm + ':' + i
      if (hiddenMap[id]) return
      repItems.push({ id, text: na(txt(id, t)), tag: (g?.name || 'N/A').toUpperCase() })
    })
  })
  customArr.forEach((c) => {
    const id = 'x:' + c.id
    if (c.month !== rm || c.week !== 'ms' || hiddenMap[id]) return
    repItems.push({ id, text: na(txt(id, c?.text)), tag: String(nameOf(c?.goal)).toUpperCase() })
  })
  const repDone = repItems.filter((i) => done[i.id])
  const repPending = repItems.filter((i) => !done[i.id])

  const rw = weekRows(rm)
  const rwDone = rw.filter((o) => done[o.id]).length

  const repGoals = ALL.map((g, gi) => {
    const ms = msFor(g, scale)
    let upD = 0
    let upT = 0
    MONTHS.forEach((m, mi) => {
      if (mi > rm) return
      ;(ms[mi] || []).forEach((t, i) => {
        const id = 'm:' + g.k + ':' + mi + ':' + i
        if (hiddenMap[id]) return
        upT++
        if (done[id]) upD++
      })
    })
    const gv = goals[gi] || {}
    let status = 'Behind'
    let sc = '#B4441E'
    let sb = 'rgba(196,106,27,.14)'
    if (gv.pct === 100) { status = 'Complete'; sc = '#1F7A45'; sb = 'rgba(46,158,91,.14)' }
    else if (upD >= upT) { status = 'On track'; sc = '#1F6F9E'; sb = 'rgba(31,111,158,.12)' }
    return { name: na(g?.name), target: na(gv.target), due: na(g?.due), ratio: gv.ratio ?? 'N/A', status, statusColor: sc, statusBg: sb }
  })

  const tDone = todosArr.filter((t) => t?.status === 'done').length + archiveArr.length
  const tAll = todosArr.length + archiveArr.length
  const repTodos = todosArr.concat(archiveArr).map((t) => {
    const s =
      t?.status === 'done' ? { l: 'DONE', c: '#1F7A45', b: 'rgba(46,158,91,.14)' }
      : t?.status === 'prog' ? { l: 'IN PROGRESS', c: '#8A6A00', b: 'rgba(244,211,94,.2)' }
      : { l: 'TODO', c: '#B4441E', b: 'rgba(196,106,27,.14)' }
    return { title: na(t?.title), who: na(t?.who), due: t?.due ? pretty(t.due) : 'N/A', status: s.l, statusColor: s.c, statusBg: s.b }
  })

  /* ---- calendar ---- */
  const ST = {
    pending: { l: 'Pending', c: '#F4D35E', b: 'rgba(244,211,94,.16)' },
    done: { l: 'Done', c: '#7BC96F', b: 'rgba(123,201,111,.16)' },
    cancelled: { l: 'Cancelled', c: '#FF6B8A', b: 'rgba(255,107,138,.14)' },
  }
  const first = new Date(st.calY, st.calM, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(st.calY, st.calM + 1, 0).getDate()
  const prevDays = new Date(st.calY, st.calM, 0).getDate()
  const calDays = []
  for (let i = 0; i < 42; i++) {
    const n = i - startOffset + 1
    let y = st.calY
    let mo = st.calM
    let dnum = n
    let out = false
    if (n < 1) { mo--; dnum = prevDays + n; out = true; if (mo < 0) { mo = 11; y-- } }
    else if (n > daysInMonth) { mo++; dnum = n - daysInMonth; out = true; if (mo > 11) { mo = 0; y++ } }
    const key = fmt(y, mo, dnum)
    const items = []
    meetingsArr.filter((m) => m?.date === key).forEach((m) => {
      const s = ST[m?.status] || ST.pending
      items.push({ label: (m?.time ? m.time + ' ' : '') + na(m?.title), color: s.c, bg: s.b, strike: m?.status === 'cancelled' })
    })
    todosArr.filter((t) => t?.due === key).forEach((t) =>
      items.push({
        label: '☑ ' + na(t?.title), color: t?.status === 'done' ? '#7BC96F' : '#FF8A3D',
        bg: 'rgb(var(--hair-rgb) / .06)', strike: t?.status === 'done',
      }),
    )
    calDays.push({
      num: dnum, key,
      items: items.slice(0, 4),
      more: items.length > 4 ? '+' + (items.length - 4) + ' more' : '',
      numColor: out ? 'var(--cal-out)' : key === todayIso ? '#0A0E14' : 'var(--soft)',
      numBg: key === todayIso ? '#F4D35E' : 'transparent',
      bg: key === st.calSel ? 'rgba(78,205,196,.09)' : out ? 'rgb(var(--hair-rgb) / .012)' : 'transparent',
      select: () => a.selectDay(key),
    })
  }

  const dayMeetings = meetingsArr
    .filter((m) => m?.date === st.calSel)
    .sort((x, y) => (x?.time || '').localeCompare(y?.time || ''))
    .map((m) => {
      const s = ST[m?.status] || ST.pending
      return {
        id: m?.id, title: na(m?.title), who: na(m?.who), time: m?.time || 'N/A', notes: m?.notes, hasNotes: !!m?.notes,
        statusLabel: s.l, statusColor: s.c, statusBg: s.b, strike: m?.status === 'cancelled', date: m?.date,
        setDone: () => a.patchMeeting(m.id, { status: 'done' }),
        setPending: () => a.patchMeeting(m.id, { status: 'pending' }),
        setCancel: () => a.patchMeeting(m.id, { status: 'cancelled' }),
        postpone: (e) => a.patchMeeting(m.id, { date: e.target.value, status: 'pending' }),
        remove: () => a.removeMeeting(m.id),
      }
    })

  const dayTodos = todosArr.filter((t) => t?.due === st.calSel).map((t) => ({
    title: na(t?.title), who: na(t?.who),
    statusLabel: t?.status === 'done' ? 'Done' : t?.status === 'prog' ? 'In progress' : 'Todo',
    statusColor: t?.status === 'done' ? '#7BC96F' : t?.status === 'prog' ? '#F4D35E' : '#FF8A3D',
  }))

  const selParts = (st.calSel || '').split('-')
  const upcoming = meetingsArr
    .filter((m) => m?.date && m.date >= todayIso && m?.status === 'pending')
    .sort((x, y) => ((x?.date || '') + (x?.time || '')).localeCompare((y?.date || '') + (y?.time || '')))
    .slice(0, 5)
    .map((m) => ({
      title: na(m?.title), when: pretty(m?.date) + (m?.time ? ' · ' + m.time : ''), who: na(m?.who),
      go: () => a.setCal({ calSel: m?.date, calY: Number((m?.date || '').slice(0, 4)), calM: Number((m?.date || '').slice(5, 7)) - 1 }),
    }))

  /* ---- personal branding ---- */
  // Ordering (top → bottom): fully done (shoot+edit+post) > shoot+edit > shoot > none.
  // Weight post>edit>shoot so more finished pieces float up; newest first within a tier.
  const brandRank = (b) => (b?.post ? 4 : 0) + (b?.edit ? 2 : 0) + (b?.shoot ? 1 : 0)
  const branding = brandingArr
    .slice()
    .sort((x, y) => brandRank(y) - brandRank(x) || (y?.createdAt || 0) - (x?.createdAt || 0))
    .map((b) => {
      const shoot = !!b?.shoot
      const edit = !!b?.edit
      const post = !!b?.post
      const platforms = Array.isArray(b?.platforms) ? b.platforms : []
      const stageDone = (shoot ? 1 : 0) + (edit ? 1 : 0) + (post ? 1 : 0)
      const complete = shoot && edit && post
      return {
        id: b?.id,
        hook: na(b?.hook), body: na(b?.body), cta: na(b?.cta),
        // Raw (un-"N/A") values for the edit form, plus a patch callback.
        hookRaw: b?.hook ?? '', bodyRaw: b?.body ?? '', ctaRaw: b?.cta ?? '',
        patch: (p) => a.patchBranding(b?.id, p), // named 'patch' to avoid colliding with the boolean `edit` stage below
        hasHook: !!b?.hook, hasBody: !!b?.body, hasCta: !!b?.cta,
        shoot, edit, post, complete, stageDone,
        statusLabel: complete ? 'Completed' : stageDone === 0 ? 'Not started' : stageDone + '/3 done',
        stages: BRAND_STAGES.map((s) => ({
          k: s.k, label: s.label, color: s.color, on: !!b?.[s.k],
          toggle: () => a.toggleBrandingStage(b?.id, s.k),
        })),
        platformChips: PLATFORMS.map((p) => ({
          k: p.k, label: p.label, color: p.color, on: platforms.includes(p.k),
          toggle: () => a.toggleBrandingPlatform(b?.id, p.k),
        })),
        postedDate: b?.postedDate || '',
        postedLabel: b?.postedDate ? pretty(b.postedDate) : 'N/A',
        setDate: (e) => a.setBrandingDate(b?.id, e.target.value),
        remove: () => a.removeBranding(b?.id),
      }
    })
  const brandingStats = {
    total: brandingArr.length,
    shoot: brandingArr.filter((b) => b?.shoot).length,
    edit: brandingArr.filter((b) => b?.edit).length,
    post: brandingArr.filter((b) => b?.post).length,
    complete: brandingArr.filter((b) => b?.shoot && b?.edit && b?.post).length,
  }

  const page = st.printing ? 'report' : st.page
  const hiddenCount = Object.keys(hiddenMap).length

  return {
    branding, brandingStats, bdraft: st.bdraft,
    ownerName: CONFIG.ownerName ?? 'My Targets & Growth Plan',
    showWeekly: CONFIG.showWeeklyPlan ?? true,
    page,
    printing: st.printing,
    // header stats
    doneCount: allDone, pendingCount: allTotal - allDone, totalCount: allTotal,
    pct: allTotal ? Math.round((allDone / allTotal) * 100) : 0,
    // dashboard
    goals, months, weeks, sel, selMonthLabel: FULL[sel],
    weekRatio: wd + '/' + wt, weekPct: wt ? Math.round((wd / wt) * 100) : 0,
    // notes / new tasks
    goalOptions: ALL.map((g) => ({ k: g?.k, name: na(g?.name) })),
    draft: st.draft,
    addHint: 'Goes to ' + nameOf(st.draft.goal) + ' · ' + FULL[st.draft.month],
    customList, customCount: customArr.length + ' ADDED', customEmpty: customArr.length === 0,
    gdraft: st.gdraft,
    swatches: PALETTE.map((c) => ({ c, selected: st.gdraft.color === c, select: () => {} })),
    editRows: ALL.map((g, gi) => ({
      k: g?.k, name: g?.name ?? '', color: g?.color, dueIso: g?.dueIso ?? '', targetText: goals[gi]?.target ?? '',
      origin: g?.custom ? 'ADDED' : 'ORIGINAL', showRemove: !!g?.custom,
      swatches: PALETTE.map((c) => ({ c, selected: g?.color === c })),
    })),
    filters, restoreShow: hiddenCount > 0, restoreLabel: 'RESTORE ' + hiddenCount + ' REMOVED',
    msRows: msRaw.map(rowify), msCount: msRaw.length + ' ITEMS',
    wkRows: wkRaw.map(rowify), wkCount: wkRaw.length + ' ITEMS',
    notes: st.notes,
    // todo board
    columns, history, historyCount: archiveArr.length + ' ARCHIVED', historyEmpty: archiveArr.length === 0,
    tdraft: st.tdraft,
    // calendar
    dow: DOW, calDays, calLabel: MONTH_NAMES[st.calM] + ' ' + st.calY,
    selDayLabel: Number(selParts[2]) + ' ' + MONTH_NAMES[Number(selParts[1]) - 1] + ' ' + selParts[0],
    dayMeetings, dayTodos, upcoming,
    dayMeetingsEmpty: dayMeetings.length === 0, dayTodosShow: dayTodos.length > 0, upcomingShow: upcoming.length > 0,
    mdraft: st.mdraft,
    // report
    repMonth: rm, repMonthLabel: FULL[rm], repMonthShort: MONTHS[rm].label + " '" + MONTHS[rm].yr,
    repMonthRatio: repDone.length + '/' + repItems.length,
    repMonthPct: repItems.length ? Math.round((repDone.length / repItems.length) * 100) + '%' : '—',
    repWeekRatio: rwDone + '/' + rw.length,
    repWeekPct: rw.length ? Math.round((rwDone / rw.length) * 100) + '%' : '—',
    repDone, repPending, repDoneEmpty: repDone.length === 0, repPendingEmpty: repPending.length === 0,
    repGoals, repTodos, repTodosEmpty: repTodos.length === 0,
    todoDonePct: tAll ? Math.round((tDone / tAll) * 100) + '%' : '—',
    todoSummary: tDone + ' of ' + tAll + ' todos done',
    today: todayLabel(),
  }
}
