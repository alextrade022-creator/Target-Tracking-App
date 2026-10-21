import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/helpers'
import { PageHeader } from '../ws/ui'
import Block from './Blocks'
import { longDay } from './useNotes'

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])
const ADD = [
  ['text', 'Text', 'Paragraphs, thoughts'],
  ['keys', 'Important points', 'Highlighted ★ lines'],
  ['points', 'List', 'Bullets or a checklist'],
  ['table', 'Table', 'Rows and columns'],
  ['mind', 'Mind map', 'Topic → branches'],
  ['board', 'Whiteboard', 'Draw and sticky notes'],
]
const NAMES = { text: 'Text', keys: 'Important points', points: 'List', table: 'Table', mind: 'Mind map', board: 'Whiteboard' }

function preview(n) {
  const blocks = arr(n.blocks)
  const t = blocks.find((b) => b.type === 'text' && b.text?.trim())
  if (t) return t.text
  const k = blocks.find((b) => (b.type === 'keys' || b.type === 'points') && arr(b.items).length)
  if (k) return arr(k.items).map((x) => (typeof x === 'string' ? x : x.t)).filter(Boolean).join(' · ')
  return blocks.map((b) => NAMES[b.type]).join(' · ') || 'Empty note'
}
const searchText = (n) => (n.title + ' ' + JSON.stringify(arr(n.blocks).map((b) => [b.text, b.items, b.rows, b.root, arr(b.stickies).map((s) => s.t)]))).toLowerCase()

export default function Notes({ nb, ws }) {
  const { state: s, actions: a } = nb
  const biz = ws.state.bizId
  const bizMap = ws.sel.bizMap
  const notes = arr(s.notes)
  const q = s.q.trim().toLowerCase()
  const list = notes
    .filter((n) => biz === 'all' || n.biz === biz)
    .filter((n) => s.filter === 'all' || (s.filter === 'star' ? n.star : arr(n.tags).includes('Journal')))
    .filter((n) => !q || searchText(n).includes(q))
    .sort((x, y) => (y.star ? 1 : 0) - (x.star ? 1 : 0) || String(y.date).localeCompare(String(x.date)) || (y.updatedAt || 0) - (x.updatedAt || 0))
  const open = notes.find((n) => n.id === s.openId) || null

  return (
    <div>
      <PageHeader
        title="Notes & journal"
        subtitle="Ideas, journal and important points, with tables, mind maps and a whiteboard inside any note."
        right={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => a.add({ journal: true })} className="rounded-lg border border-hair/[0.14] px-3.5 py-2.5 text-[13px] font-medium hover:border-hair/[0.3]">+ Journal entry for today</button>
            <button type="button" onClick={() => a.add({ biz: biz === 'all' ? '' : biz })} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">+ New note</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="panel flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-32px)]" aria-label="Notes list">
          <div className="grid gap-2 border-b border-hair/[0.07] p-3">
            <input type="search" className="field py-2" placeholder="Search notes…" aria-label="Search notes" value={s.q} onChange={(e) => a.setQ(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {[['all', 'All'], ['star', '★ Important'], ['journal', 'Journal']].map(([k, t]) => (
                <button key={k} type="button" onClick={() => a.setFilter(k)}
                  className={cn('rounded-full border px-2.5 py-0.5 text-[12px] font-medium', s.filter === k ? 'border-teal bg-teal text-onaccent' : 'border-hair/[0.14] text-mute hover:text-fg')}>
                  {t}
                </button>
              ))}
            </div>
            {biz !== 'all' && <div className="text-[11.5px] text-mute2">Showing {bizMap[biz]?.name || 'this business'} only (sidebar filter)</div>}
          </div>
          <div className="max-h-[360px] overflow-y-auto py-1 lg:max-h-none">
            {list.map((n) => {
              const b = bizMap[n.biz]
              return (
                <button key={n.id} type="button" onClick={() => a.open(n.id)}
                  className={cn('block w-full border-l-[3px] px-3.5 py-2.5 text-left', n.id === s.openId ? 'border-teal bg-teal/[0.07]' : 'border-transparent hover:bg-hair/[0.03]')}>
                  <div className="flex items-baseline gap-1.5 text-[13.5px] font-semibold">
                    {n.star && <span className="text-yellow">★</span>}
                    <span className="truncate">{n.title || 'Untitled'}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-mute2">
                    <span>{n.date ? longDay(n.date) : ''}</span>
                    {b && <span className="inline-flex items-center gap-1 font-semibold" style={{ color: b.color }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />{b.name}</span>}
                    {arr(n.tags).includes('Journal') && <span className="rounded-full bg-purple/[0.12] px-1.5 font-semibold text-purple">Journal</span>}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[12.5px] text-mute">{preview(n)}</div>
                </button>
              )
            })}
            {list.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-mute2">{notes.length ? 'No notes here.' : 'No notes yet. Start one with + New note.'}</div>}
          </div>
        </aside>

        <main className="panel min-w-0">
          {open ? <NoteEditor key={open.id} n={open} nb={nb} ws={ws} /> : (
            <div className="px-6 py-16 text-center text-[13.5px] text-mute2">Select a note, or start a new one.</div>
          )}
        </main>
      </div>
    </div>
  )
}

function NoteEditor({ n, nb, ws }) {
  const a = nb.actions
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [newBlock, setNewBlock] = useState('')
  const title = useRef(null)
  const blocks = arr(n.blocks)
  const journal = arr(n.tags).includes('Journal')

  useEffect(() => { if (!n.title && blocks.length <= 1) title.current?.focus() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!newBlock) return
    document.getElementById('blk-' + newBlock)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setNewBlock('')
  }, [newBlock])

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 px-5 pb-7 pt-5 sm:px-6">
      <div className="grid gap-2">
        <input
          ref={title}
          className="w-full bg-transparent font-head text-[24px] font-bold tracking-[-0.02em] outline-none placeholder:text-mute2 sm:text-[26px]"
          placeholder="Untitled note"
          value={n.title || ''}
          onChange={(e) => a.patch(n.id, { title: e.target.value })}
          aria-label="Note title"
        />
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-mute">
          <button type="button" onClick={() => a.patch(n.id, { star: !n.star })} aria-pressed={!!n.star}
            className={cn('rounded-full border px-3 py-1 font-semibold', n.star ? 'border-yellow bg-yellow/[0.12] text-yellow' : 'border-hair/[0.14] hover:text-fg')}>
            {n.star ? '★ Important' : '☆ Mark important'}
          </button>
          <select className="select w-auto py-1 text-[12.5px]" value={n.biz || ''} onChange={(e) => a.patch(n.id, { biz: e.target.value })} aria-label="Business">
            <option value="">Personal</option>
            {ws.sel.businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="date" className="field w-auto py-1 text-[12.5px]" value={n.date || ''} onChange={(e) => a.patch(n.id, { date: e.target.value })} aria-label="Date" />
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={journal} onChange={(e) => a.patch(n.id, { tags: e.target.checked ? arr(n.tags).concat(['Journal']) : arr(n.tags).filter((t) => t !== 'Journal') })} />
            Journal
          </label>
          <span className="ml-auto">
            {confirm ? (
              <span className="flex items-center gap-2">
                <span>Delete this note?</span>
                <button type="button" onClick={() => a.remove(n.id)} className="font-semibold text-pink">Delete</button>
                <button type="button" onClick={() => setConfirm(false)} className="hover:text-fg">Keep</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className="hover:text-pink">Delete note</button>
            )}
          </span>
        </div>
      </div>

      {blocks.map((b, i) => (
        <section key={b.id} id={'blk-' + b.id} aria-label={NAMES[b.type]} className="group/blk relative min-w-0">
          <div className="absolute -top-3 right-1.5 z-[3] flex gap-0.5 rounded-lg border border-hair/[0.1] bg-surface p-0.5 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover/blk:opacity-100">
            <button type="button" disabled={i === 0} onClick={() => a.moveBlock(n.id, b.id, -1)} aria-label="Move block up" className="rounded px-1.5 py-0.5 text-[13px] text-mute hover:bg-hair/[0.06] hover:text-fg disabled:opacity-30">↑</button>
            <button type="button" disabled={i === blocks.length - 1} onClick={() => a.moveBlock(n.id, b.id, 1)} aria-label="Move block down" className="rounded px-1.5 py-0.5 text-[13px] text-mute hover:bg-hair/[0.06] hover:text-fg disabled:opacity-30">↓</button>
            <button type="button" onClick={() => a.removeBlock(n.id, b.id)} aria-label="Delete block" className="rounded px-1.5 py-0.5 text-[13px] text-mute hover:bg-pink/[0.08] hover:text-pink">✕</button>
          </div>
          <Block b={b} set={(change) => a.patchBlock(n.id, b.id, change)} />
        </section>
      ))}

      <div className="relative">
        <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu}
          className="w-full rounded-xl border-[1.5px] border-dashed border-hair/[0.15] py-2.5 text-[13.5px] font-semibold text-mute hover:border-teal hover:text-teal">
          + Add block
        </button>
        {menu && (
          <div className="absolute inset-x-0 top-[calc(100%+6px)] z-10 grid grid-cols-1 gap-1 rounded-xl border border-hair/[0.1] bg-surface p-1.5 shadow-2xl sm:grid-cols-2 lg:grid-cols-3"
            onKeyDown={(e) => { if (e.key === 'Escape') setMenu(false) }}>
            {ADD.map(([k, t, d]) => (
              <button key={k} type="button" onClick={() => { setNewBlock(a.addBlock(n.id, k)); setMenu(false) }} className="rounded-lg px-3 py-2 text-left hover:bg-hair/[0.05]">
                <span className="block text-[13px] font-semibold">{t}</span>
                <span className="text-[11.5px] text-mute">{d}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
