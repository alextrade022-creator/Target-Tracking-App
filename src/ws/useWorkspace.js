import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getState, putSlice } from '../lib/api'
import { iso } from '../lib/helpers'
import { DEFAULT_BUSINESSES, BIZ_COLORS, uid, slug } from './lib'

/* The workspace owns three persisted slices (MongoDB `app_state` docs):
   wsBusinesses, wsTasks, wsMeetings. UI state (page, selected business…) is
   in-memory only. Hydrates once on mount; each slice syncs back on change. */

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])

export function useWorkspace() {
  const [s, setS] = useState(() => {
    const now = new Date()
    return {
      businesses: DEFAULT_BUSINESSES,
      tasks: [],
      meetings: [],
      page: 'today',
      bizId: 'all',
      activeMeeting: '',
      calY: now.getFullYear(),
      calM: now.getMonth(),
      calSel: iso(now),
      taskView: 'open', // open | mine | waiting | done
      taskDept: 'all', // all | personal | <lowercase department name>
    }
  })
  const update = useCallback(
    (p) => setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) })),
    [],
  )

  /* ---- hydrate ---- */
  const hydrated = useRef(false)
  useEffect(() => {
    let alive = true
    getState().then((d) => {
      if (alive && d) {
        update((prev) => ({
          businesses: arr(d.wsBusinesses).length ? arr(d.wsBusinesses) : prev.businesses,
          tasks: arr(d.wsTasks),
          meetings: arr(d.wsMeetings),
        }))
      }
      hydrated.current = true
    })
    return () => { alive = false }
  }, [update])

  /* ---- persist ---- */
  const persist = useCallback((k, v) => { if (hydrated.current) putSlice(k, v) }, [])
  useEffect(() => persist('wsBusinesses', s.businesses), [s.businesses, persist])
  useEffect(() => persist('wsTasks', s.tasks), [s.tasks, persist])
  useEffect(() => persist('wsMeetings', s.meetings), [s.meetings, persist])

  /* ---- navigation ---- */
  const go = useCallback((page) => update({ page }), [update])
  const setBiz = useCallback((bizId) => update({ bizId, taskDept: 'all' }), [update])
  const openMeeting = useCallback((id) => update({ page: 'meetings', activeMeeting: id }), [update])
  const setTaskView = useCallback((taskView) => update({ taskView }), [update])
  const setTaskDept = useCallback((taskDept) => update({ taskDept }), [update])

  /* ---- tasks ---- */
  const addTask = useCallback(({ title, bizId, deptId = '', due = '', meetingId = '' }) => {
    const t = (title || '').trim()
    if (!t || !bizId) return ''
    const id = uid('t')
    update((p) => ({
      tasks: arr(p.tasks).concat([{ id, title: t, bizId, deptId, due, meetingId, status: 'todo', createdAt: Date.now(), doneAt: '' }]),
    }))
    return id
  }, [update])

  const patchTask = useCallback((id, patch) => {
    update((p) => ({ tasks: arr(p.tasks).map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  }, [update])

  const toggleTask = useCallback((id) => {
    update((p) => ({
      tasks: arr(p.tasks).map((t) => {
        if (t.id !== id) return t
        const done = t.status === 'done'
        return { ...t, status: done ? 'todo' : 'done', doneAt: done ? '' : iso(new Date()) }
      }),
    }))
  }, [update])

  const removeTask = useCallback((id) => update((p) => ({ tasks: arr(p.tasks).filter((t) => t.id !== id) })), [update])

  /* ---- subtasks: a checklist inside a task, { id, title, done } ---- */
  const editSubs = useCallback((taskId, fn) => {
    update((p) => ({ tasks: arr(p.tasks).map((t) => (t.id === taskId ? { ...t, subtasks: fn(arr(t.subtasks)) } : t)) }))
  }, [update])
  const addSubtask = useCallback((taskId, title) => {
    const v = (title || '').trim()
    if (v) editSubs(taskId, (list) => list.concat([{ id: uid('s'), title: v, done: false }]))
  }, [editSubs])
  const toggleSubtask = useCallback((taskId, subId) => {
    editSubs(taskId, (list) => list.map((x) => (x.id === subId ? { ...x, done: !x.done } : x)))
  }, [editSubs])
  const renameSubtask = useCallback((taskId, subId, title) => {
    editSubs(taskId, (list) => list.map((x) => (x.id === subId ? { ...x, title } : x)))
  }, [editSubs])
  const removeSubtask = useCallback((taskId, subId) => editSubs(taskId, (list) => list.filter((x) => x.id !== subId)), [editSubs])

  /* ---- meetings ---- */
  // `stay: true` creates the meeting without leaving the current page (used by Leads).
  const addMeeting = useCallback(({ bizId, date, time = '10:00', title = '', attendees = '', agenda = '', leadId = '', stay = false }) => {
    const id = uid('m')
    update((p) => {
      const biz = bizId && bizId !== 'all' ? bizId : arr(p.businesses)[0]?.id || ''
      const meetings = arr(p.meetings).concat([{
        id, bizId: biz, title, date: date || iso(new Date()), time,
        attendees, agenda, notes: '', decisions: '', leadId, createdAt: Date.now(),
      }])
      return stay ? { meetings } : { meetings, page: 'meetings', activeMeeting: id }
    })
    return id
  }, [update])

  const patchMeeting = useCallback((id, patch) => {
    update((p) => ({ meetings: arr(p.meetings).map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  }, [update])

  // withTasks: also delete its action items; otherwise keep them, unlinked.
  const removeMeeting = useCallback((id, { withTasks = false } = {}) => {
    update((p) => ({
      meetings: arr(p.meetings).filter((m) => m.id !== id),
      tasks: withTasks
        ? arr(p.tasks).filter((t) => t.meetingId !== id)
        : arr(p.tasks).map((t) => (t.meetingId === id ? { ...t, meetingId: '' } : t)),
      activeMeeting: p.activeMeeting === id ? '' : p.activeMeeting,
    }))
  }, [update])

  /* ---- calendar ---- */
  const shiftMonth = useCallback((d) => {
    update((p) => {
      let m = p.calM + d
      let y = p.calY
      if (m < 0) { m = 11; y -= 1 }
      if (m > 11) { m = 0; y += 1 }
      return { calM: m, calY: y }
    })
  }, [update])
  const goToday = useCallback(() => {
    const n = new Date()
    update({ calY: n.getFullYear(), calM: n.getMonth(), calSel: iso(n) })
  }, [update])
  const selectDay = useCallback((calSel) => update({ calSel }), [update])

  /* ---- settings: businesses & departments ---- */
  const addBusiness = useCallback((name) => {
    const n = (name || '').trim()
    if (!n) return
    update((p) => {
      const list = arr(p.businesses)
      const id = slug(n) + '-' + list.length
      return {
        businesses: list.concat([{
          id, name: n, color: BIZ_COLORS[list.length % BIZ_COLORS.length],
          departments: [{ id: 'operation', name: 'Operation', mine: true }],
        }]),
      }
    })
  }, [update])

  const patchBusiness = useCallback((id, patch) => {
    update((p) => ({ businesses: arr(p.businesses).map((b) => (b.id === id ? { ...b, ...patch } : b)) }))
  }, [update])

  const removeBusiness = useCallback((id) => {
    update((p) => ({
      businesses: arr(p.businesses).filter((b) => b.id !== id),
      tasks: arr(p.tasks).filter((t) => t.bizId !== id),
      meetings: arr(p.meetings).filter((m) => m.bizId !== id),
      bizId: p.bizId === id ? 'all' : p.bizId,
    }))
  }, [update])

  const addDept = useCallback((bizId, name, mine) => {
    const n = (name || '').trim()
    if (!n) return
    update((p) => ({
      businesses: arr(p.businesses).map((b) => {
        if (b.id !== bizId) return b
        const deps = arr(b.departments)
        let id = slug(n)
        if (deps.some((d) => d.id === id)) id = id + '-' + deps.length
        return { ...b, departments: deps.concat([{ id, name: n, mine: !!mine }]) }
      }),
    }))
  }, [update])

  const patchDept = useCallback((bizId, deptId, patch) => {
    update((p) => ({
      businesses: arr(p.businesses).map((b) => (b.id !== bizId ? b : {
        ...b, departments: arr(b.departments).map((d) => (d.id === deptId ? { ...d, ...patch } : d)),
      })),
    }))
  }, [update])

  const removeDept = useCallback((bizId, deptId) => {
    update((p) => ({
      businesses: arr(p.businesses).map((b) => (b.id !== bizId ? b : {
        ...b, departments: arr(b.departments).filter((d) => d.id !== deptId),
      })),
      // tasks of a removed department become personal
      tasks: arr(p.tasks).map((t) => (t.bizId === bizId && t.deptId === deptId ? { ...t, deptId: '' } : t)),
    }))
  }, [update])

  /* ---- derived selectors ---- */
  const sel = useMemo(() => {
    const businesses = arr(s.businesses)
    const tasks = arr(s.tasks)
    const meetings = arr(s.meetings)
    const bizMap = Object.fromEntries(businesses.map((b) => [b.id, b]))
    const deptOf = (bizId, deptId) => arr(bizMap[bizId]?.departments).find((d) => d.id === deptId) || null
    // 'me' for personal tasks and departments you run; 'team' = waiting on others
    const ownerOf = (t) => {
      const d = t?.deptId ? deptOf(t.bizId, t.deptId) : null
      return d && !d.mine ? 'team' : 'me'
    }
    const inScope = (x) => s.bizId === 'all' || x?.bizId === s.bizId
    return {
      businesses,
      bizMap,
      deptOf,
      ownerOf,
      tasks: tasks.filter(inScope),
      meetings: meetings.filter(inScope),
      allTasks: tasks,
      allMeetings: meetings,
      openCount: (bizId) => tasks.filter((t) => t.status !== 'done' && (bizId === 'all' || t.bizId === bizId)).length,
    }
  }, [s.businesses, s.tasks, s.meetings, s.bizId])

  const actions = {
    go, setBiz, openMeeting, setTaskView, setTaskDept,
    addTask, patchTask, toggleTask, removeTask,
    addSubtask, toggleSubtask, renameSubtask, removeSubtask,
    addMeeting, patchMeeting, removeMeeting,
    shiftMonth, goToday, selectDay,
    addBusiness, patchBusiness, removeBusiness, addDept, patchDept, removeDept,
  }
  return { state: s, sel, actions }
}
