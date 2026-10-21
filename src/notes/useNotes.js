import { useCallback, useEffect, useRef, useState } from 'react'
import { getState, putSlice } from '../lib/api'
import { iso } from '../lib/helpers'
import { uid } from '../ws/lib'

/* Notes & journal live in one MongoDB slice, nbNotes. A note is a stack of blocks:
     { id, title, biz, star, date, tags[], blocks[], createdAt, updatedAt }
   block types: text · keys (important points) · points (list / checklist) ·
                table · mind (mind map) · board (whiteboard)                     */

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])

export const longDay = (d = iso(new Date())) => {
  const [y, m, dd] = d.split('-').map(Number)
  return new Date(y, m - 1, dd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const mindNode = (t, kids = []) => ({ id: uid('n'), t, kids })

export function newBlock(type) {
  const b = { id: uid('b'), type }
  if (type === 'text') b.text = ''
  if (type === 'keys') b.items = ['']
  if (type === 'points') { b.items = [{ t: '', d: false }]; b.check = false }
  if (type === 'table') b.rows = [['Column 1', 'Column 2', 'Column 3'], ['', '', ''], ['', '', '']]
  if (type === 'mind') b.root = mindNode('Main topic', [mindNode('Idea 1'), mindNode('Idea 2')])
  if (type === 'board') { b.strokes = []; b.stickies = [] }
  return b
}

export function useNotes() {
  const [s, setS] = useState({ notes: [], openId: '', filter: 'all', q: '' })
  const update = useCallback((p) => setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) })), [])

  const hydrated = useRef(false)
  useEffect(() => {
    let alive = true
    getState().then((d) => {
      if (alive && d) update({ notes: arr(d.nbNotes) })
      hydrated.current = true
    })
    return () => { alive = false }
  }, [update])
  useEffect(() => { if (hydrated.current) putSlice('nbNotes', s.notes) }, [s.notes])

  const edit = useCallback((id, fn) => {
    update((p) => ({ notes: arr(p.notes).map((n) => (n.id === id ? { ...fn(n), updatedAt: Date.now() } : n)) }))
  }, [update])

  const open = useCallback((openId) => update({ openId: openId || '' }), [update])
  const setFilter = useCallback((filter) => update({ filter }), [update])
  const setQ = useCallback((q) => update({ q }), [update])

  /** New note (or today's journal entry). Returns its id. */
  const add = useCallback(({ journal = false, biz = '' } = {}) => {
    const today = iso(new Date())
    let id = uid('note')
    update((p) => {
      if (journal) {
        const existing = arr(p.notes).find((n) => arr(n.tags).includes('Journal') && n.date === today)
        if (existing) { id = existing.id; return { openId: existing.id } }
      }
      const note = {
        id, title: journal ? 'Journal · ' + longDay(today) : '', biz: journal ? '' : biz, star: false, date: today,
        tags: journal ? ['Journal'] : [], blocks: [newBlock('text')], createdAt: Date.now(), updatedAt: Date.now(),
      }
      return { notes: [note].concat(arr(p.notes)), openId: id }
    })
    return id
  }, [update])

  const patch = useCallback((id, change) => edit(id, (n) => ({ ...n, ...change })), [edit])
  const remove = useCallback((id) => {
    update((p) => ({ notes: arr(p.notes).filter((n) => n.id !== id), openId: p.openId === id ? '' : p.openId }))
  }, [update])

  const addBlock = useCallback((id, type) => {
    const b = newBlock(type)
    edit(id, (n) => ({ ...n, blocks: arr(n.blocks).concat([b]) }))
    return b.id
  }, [edit])
  /** change: object to merge, or a function (block) => new block */
  const patchBlock = useCallback((id, blockId, change) => {
    edit(id, (n) => ({
      ...n,
      blocks: arr(n.blocks).map((b) => (b.id !== blockId ? b : typeof change === 'function' ? change(b) : { ...b, ...change })),
    }))
  }, [edit])
  const removeBlock = useCallback((id, blockId) => edit(id, (n) => ({ ...n, blocks: arr(n.blocks).filter((b) => b.id !== blockId) })), [edit])
  const moveBlock = useCallback((id, blockId, dir) => {
    edit(id, (n) => {
      const list = arr(n.blocks).slice()
      const i = list.findIndex((b) => b.id === blockId), j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return n
      ;[list[i], list[j]] = [list[j], list[i]]
      return { ...n, blocks: list }
    })
  }, [edit])

  return { state: s, actions: { open, setFilter, setQ, add, patch, remove, addBlock, patchBlock, removeBlock, moveBlock } }
}
