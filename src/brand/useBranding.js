import { useCallback, useEffect, useRef, useState } from 'react'
import { getState, putSlice } from '../lib/api'
import { iso } from '../lib/helpers'
import { PALETTE } from '../lib/constants'
import { uid } from '../ws/lib'

/* Personal branding: the same two MongoDB slices as before, so existing content
   carries over unchanged.
     branding  — posts { id, hook, body, cta, format, shoot, edit, post,
                         platforms[], tags[] (tag ids), postedDate, createdAt, stageAt }
     brandTags — tag library { id, name, color }                                  */

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])

export const STAGES = [
  { k: 'idea', label: 'Script ready', next: 'Shoot', color: '#7C5AE8', btn: 'Mark shot' },
  { k: 'shot', label: 'Shot', next: 'Edit', color: '#DD6A1E', btn: 'Mark edited' },
  { k: 'edited', label: 'Edited', next: 'Post', color: '#C6871B', btn: 'Mark posted' },
  { k: 'posted', label: 'Posted', next: '', color: '#16A34A', btn: '' },
]
export const stageOf = (b) => (b?.post ? 'posted' : b?.edit ? 'edited' : b?.shoot ? 'shot' : 'idea')

/** Booleans for a board column. */
function flagsFor(stage) {
  return {
    shoot: stage !== 'idea',
    edit: stage === 'edited' || stage === 'posted',
    post: stage === 'posted',
  }
}

export function useBranding() {
  const [s, setS] = useState({
    items: [],
    tags: [],
    format: 'all', // all | short | long
    tag: 'all', // all | <tag id>
    openId: '',
    view: 'board', // board | table
    stab: 'all', // table tab: all | idea | shot | edited | posted
    page: 1, // table page (20 per page)
    sort: { k: 'wait', dir: -1 }, // table sort: longest waiting first
  })
  const update = useCallback((p) => setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) })), [])

  const hydrated = useRef(false)
  useEffect(() => {
    let alive = true
    getState().then((d) => {
      if (alive && d) update({ items: arr(d.branding), tags: arr(d.brandTags) })
      hydrated.current = true
    })
    return () => { alive = false }
  }, [update])

  const persist = useCallback((k, v) => { if (hydrated.current) putSlice(k, v) }, [])
  useEffect(() => persist('branding', s.items), [s.items, persist])
  useEffect(() => persist('brandTags', s.tags), [s.tags, persist])

  const edit = useCallback((id, fn) => update((p) => ({ items: arr(p.items).map((b) => (b.id === id ? fn(b) : b)) })), [update])

  const setFormat = useCallback((format) => update({ format, page: 1 }), [update])
  const setTag = useCallback((tag) => update({ tag, page: 1 }), [update])
  const setView = useCallback((view) => update({ view }), [update])
  const setStab = useCallback((stab) => update({ stab, page: 1 }), [update])
  const setPage = useCallback((page) => update({ page }), [update])
  const setSort = useCallback((k) => update((p) => ({ sort: p.sort.k === k ? { k, dir: -p.sort.dir } : { k, dir: k === 'wait' ? -1 : 1 }, page: 1 })), [update])
  /** Board count clicked: show that stage in the table. */
  const showStage = useCallback((stab) => update({ view: 'table', stab, page: 1 }), [update])
  const open = useCallback((openId) => update({ openId: openId || '' }), [update])

  /** Quick capture: just a hook (the rest is written on the script page). Returns the id. */
  const add = useCallback(({ hook, format = 'short' }) => {
    const id = uid('b')
    const now = Date.now()
    update((p) => ({
      items: arr(p.items).concat([{
        id, hook: (hook || '').trim(), body: '', cta: '', format,
        shoot: false, edit: false, post: false, platforms: [], tags: [], postedDate: '', createdAt: now, stageAt: now,
      }]),
    }))
    return id
  }, [update])

  const patch = useCallback((id, change) => edit(id, (b) => ({ ...b, ...change })), [edit])

  /** Put a post in a board column (drag, or the "Mark …" button). */
  const moveTo = useCallback((id, stage) => {
    edit(id, (b) => {
      if (stageOf(b) === stage) return b
      const next = { ...b, ...flagsFor(stage), stageAt: Date.now() }
      if (stage === 'posted' && !b.postedDate) next.postedDate = iso(new Date())
      return next
    })
  }, [edit])

  /** Bulk move from the table. */
  const moveMany = useCallback((ids, stage) => {
    const set = new Set(ids)
    const now = Date.now()
    const today = iso(new Date())
    update((p) => ({
      items: arr(p.items).map((b) => {
        if (!set.has(b.id) || stageOf(b) === stage) return b
        const next = { ...b, ...flagsFor(stage), stageAt: now }
        if (stage === 'posted' && !b.postedDate) next.postedDate = today
        return next
      }),
    }))
  }, [update])

  /** Toggle one step on the script page, keeping the steps in order. */
  const toggleStep = useCallback((id, step) => {
    edit(id, (b) => {
      const on = !b[step]
      const next = { ...b, [step]: on, stageAt: Date.now() }
      if (on && step === 'post') { next.shoot = true; next.edit = true; if (!b.postedDate) next.postedDate = iso(new Date()) }
      if (on && step === 'edit') next.shoot = true
      if (!on && step === 'shoot') { next.edit = false; next.post = false }
      if (!on && step === 'edit') next.post = false
      return next
    })
  }, [edit])

  const toggleIn = (list, v) => (arr(list).includes(v) ? arr(list).filter((x) => x !== v) : arr(list).concat([v]))
  const togglePlatform = useCallback((id, k) => edit(id, (b) => ({ ...b, platforms: toggleIn(b.platforms, k) })), [edit])
  const toggleTag = useCallback((id, tagId) => edit(id, (b) => ({ ...b, tags: toggleIn(b.tags, tagId) })), [edit])

  const remove = useCallback((id) => {
    update((p) => ({ items: arr(p.items).filter((b) => b.id !== id), openId: p.openId === id ? '' : p.openId }))
  }, [update])

  /* ---- tag library ---- */
  const addTag = useCallback((name, color) => {
    const n = (name || '').trim()
    if (!n) return ''
    const id = uid('tag')
    update((p) => ({ tags: arr(p.tags).concat([{ id, name: n, color: color || PALETTE[arr(p.tags).length % PALETTE.length] }]) }))
    return id
  }, [update])
  const patchTag = useCallback((id, change) => update((p) => ({ tags: arr(p.tags).map((t) => (t.id === id ? { ...t, ...change } : t)) })), [update])
  const removeTag = useCallback((id) => {
    update((p) => ({
      tags: arr(p.tags).filter((t) => t.id !== id),
      items: arr(p.items).map((b) => ({ ...b, tags: arr(b.tags).filter((t) => t !== id) })),
      tag: p.tag === id ? 'all' : p.tag,
    }))
  }, [update])

  return {
    state: s,
    actions: { setFormat, setTag, setView, setStab, setPage, setSort, showStage, open, add, patch, moveTo, moveMany, toggleStep, togglePlatform, toggleTag, remove, addTag, patchTag, removeTag },
  }
}
