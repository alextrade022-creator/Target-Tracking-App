import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '../lib/helpers'
import { mindNode } from './useNotes'

const arr = (v) => (Array.isArray(v) ? v : [])
const label = 'mb-1.5 ml-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-mute2'
const smallBtn = 'rounded-lg border border-hair/[0.14] px-2.5 py-1 text-[12.5px] font-medium hover:border-hair/[0.3] disabled:opacity-40'

export default function Block({ b, set }) {
  if (b.type === 'text') return <TextBlock b={b} set={set} />
  if (b.type === 'keys') return <KeysBlock b={b} set={set} />
  if (b.type === 'points') return <PointsBlock b={b} set={set} />
  if (b.type === 'table') return <TableBlock b={b} set={set} />
  if (b.type === 'mind') return <MindBlock b={b} set={set} />
  if (b.type === 'board') return <BoardBlock b={b} set={set} />
  return null
}

/* ---------- text ---------- */
function TextBlock({ b, set }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const t = ref.current
    if (t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }
  }, [b.text])
  return (
    <textarea
      ref={ref}
      rows={2}
      value={b.text || ''}
      onChange={(e) => set({ text: e.target.value })}
      placeholder="Write here…"
      aria-label="Text"
      className="w-full resize-none overflow-hidden rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[15px] leading-relaxed outline-none hover:border-hair/[0.12] focus:border-teal/60 focus:bg-surface"
    />
  )
}

/* Shared row editing for keys + points: Enter adds the next line, Backspace on an empty line removes it. */
function useLines(items, setItems, blank) {
  const refs = useRef([])
  const [focus, setFocus] = useState(-1)
  useEffect(() => { if (focus >= 0) { refs.current[focus]?.focus(); setFocus(-1) } }, [focus, items.length])
  const onKey = (i) => (e) => {
    if (e.key === 'Enter') { e.preventDefault(); const next = items.slice(); next.splice(i + 1, 0, blank()); setItems(next); setFocus(i + 1) }
    if (e.key === 'Backspace' && !e.currentTarget.value && items.length > 1) { e.preventDefault(); setItems(items.filter((_, j) => j !== i)); setFocus(Math.max(0, i - 1)) }
  }
  return { refs, onKey, add: () => { setItems(items.concat([blank()])); setFocus(items.length) } }
}

/* ---------- important points ---------- */
function KeysBlock({ b, set }) {
  const items = arr(b.items)
  const setItems = (next) => set({ items: next })
  const { refs, onKey, add } = useLines(items, setItems, () => '')
  return (
    <div className="grid gap-1.5 rounded-xl bg-yellow/[0.12] px-4 py-3">
      <div className={cn(label, 'ml-0')}>Important points</div>
      {items.map((t, i) => (
        <div key={i} className="group/row grid grid-cols-[18px_minmax(0,1fr)_auto] items-start gap-1.5">
          <span className="text-[15px] leading-[1.6] text-yellow">★</span>
          <input
            ref={(el) => { refs.current[i] = el }}
            className="w-full rounded-md bg-transparent px-1 py-0.5 text-[14.5px] font-semibold leading-snug outline-none focus:bg-surface focus:ring-1 focus:ring-teal"
            value={t}
            placeholder="Important point"
            onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))}
            onKeyDown={onKey(i)}
            aria-label="Important point"
          />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Remove point" className="px-1 text-mute2 opacity-0 hover:text-pink focus:opacity-100 group-hover/row:opacity-100">×</button>
        </div>
      ))}
      <button type="button" onClick={add} className="w-fit px-1 text-[12.5px] font-semibold text-teal">+ Add point</button>
    </div>
  )
}

/* ---------- list / checklist ---------- */
function PointsBlock({ b, set }) {
  const items = arr(b.items)
  const setItems = (next) => set({ items: next })
  const { refs, onKey, add } = useLines(items, setItems, () => ({ t: '', d: false }))
  return (
    <div className="grid gap-1 px-1.5 py-1">
      <div className="flex items-center justify-between">
        <div className={label}>List</div>
        <label className="flex items-center gap-1.5 text-[12px] text-mute">
          <input type="checkbox" checked={!!b.check} onChange={(e) => set({ check: e.target.checked })} /> Checklist
        </label>
      </div>
      {items.map((it, i) => (
        <div key={i} className="group/row grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-1.5">
          {b.check ? (
            <button
              type="button"
              onClick={() => setItems(items.map((x, j) => (j === i ? { ...x, d: !x.d } : x)))}
              aria-label={it.d ? 'Mark not done' : 'Mark done'}
              className={cn('mt-[3px] flex h-[17px] w-[17px] items-center justify-center rounded-[5px] border-[1.5px] text-[10px] font-bold text-white', it.d ? 'border-green bg-green' : 'border-mute2')}
            >
              {it.d ? '✓' : ''}
            </button>
          ) : <span className="ml-[7px] mt-[10px] h-1.5 w-1.5 rounded-full bg-soft" />}
          <input
            ref={(el) => { refs.current[i] = el }}
            className={cn('w-full rounded-md bg-transparent px-1 py-0.5 text-[14.5px] leading-snug outline-none focus:bg-surface focus:ring-1 focus:ring-teal', b.check && it.d && 'text-mute2 line-through')}
            value={it.t || ''}
            placeholder="Point"
            onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)))}
            onKeyDown={onKey(i)}
            aria-label="Point"
          />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Remove point" className="px-1 text-mute2 opacity-0 hover:text-pink focus:opacity-100 group-hover/row:opacity-100">×</button>
        </div>
      ))}
      <button type="button" onClick={add} className="w-fit px-1 text-[12.5px] font-semibold text-teal">+ Add point</button>
    </div>
  )
}

/* ---------- table ---------- */
function TableBlock({ b, set }) {
  const rows = arr(b.rows).length ? b.rows : [['']]
  const setRows = (next) => set({ rows: next })
  const cols = rows[0].length
  return (
    <div>
      <div className={label}>Table</div>
      <div className="overflow-x-auto rounded-xl border border-hair/[0.1]">
        <table className="w-full min-w-[480px] border-collapse text-[13.5px]">
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className={ri === 0 ? 'bg-hair/[0.04] font-semibold' : ''}>
                {r.map((c, ci) => (
                  <td key={ci} className="min-w-[110px] border border-hair/[0.1] p-0">
                    <input
                      className="w-full bg-transparent px-2.5 py-2 font-[inherit] outline-none focus:ring-2 focus:ring-inset focus:ring-teal"
                      value={c}
                      onChange={(e) => setRows(rows.map((row, i) => (i !== ri ? row : row.map((x, j) => (j === ci ? e.target.value : x)))))}
                      aria-label={ri === 0 ? 'Column heading' : 'Cell'}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" className={smallBtn} onClick={() => setRows(rows.concat([Array(cols).fill('')]))}>+ Row</button>
        <button type="button" className={smallBtn} onClick={() => setRows(rows.map((r, i) => r.concat([i ? '' : 'Column ' + (cols + 1)])))}>+ Column</button>
        <button type="button" className={smallBtn} disabled={rows.length < 2} onClick={() => setRows(rows.slice(0, -1))}>− Row</button>
        <button type="button" className={smallBtn} disabled={cols < 2} onClick={() => setRows(rows.map((r) => r.slice(0, -1)))}>− Column</button>
      </div>
    </div>
  )
}

/* ---------- mind map: a tree laid out left → right ---------- */
const MM_COLORS = ['#7C5AE8', '#0FA3A3', '#DD6A1E', '#16A34A', '#DC4A63', '#C6871B']

function findNode(n, id, parent = null) {
  if (n.id === id) return { n, p: parent }
  for (const k of arr(n.kids)) { const f = findNode(k, id, n); if (f) return f }
  return null
}
function mapTree(n, fn) { const m = fn(n); return { ...m, kids: arr(m.kids).map((k) => mapTree(k, fn)) } }

function MindBlock({ b, set }) {
  const root = b.root || mindNode('Main topic')
  const [sel, setSel] = useState(root.id)
  const input = useRef(null)
  const selected = findNode(root, sel) || { n: root, p: null }
  const setRoot = (next) => set({ root: next })

  // layout
  const ROW = 46, COL = 190, PAD = 24
  const pos = []
  let leaves = 0, maxX = 0
  const place = (n, depth, color) => {
    const x = PAD + depth * COL
    maxX = Math.max(maxX, x)
    const kids = arr(n.kids)
    if (!kids.length) { const p = { n, x, y: PAD + leaves * ROW + ROW / 2, depth, color }; leaves += 1; pos.push(p); return p }
    const placed = kids.map((k, i) => place(k, depth + 1, depth === 0 ? MM_COLORS[i % MM_COLORS.length] : color))
    const p = { n, x, y: (placed[0].y + placed[placed.length - 1].y) / 2, depth, color, kids: placed }
    pos.push(p)
    return p
  }
  place(root, 0, '#2563EB')
  const W = maxX + 280, H = PAD * 2 + leaves * ROW

  const focusName = () => setTimeout(() => { input.current?.focus(); input.current?.select() }, 0)
  const addChild = () => {
    const k = mindNode('New topic')
    setRoot(mapTree(root, (n) => (n.id === selected.n.id ? { ...n, kids: arr(n.kids).concat([k]) } : n)))
    setSel(k.id); focusName()
  }
  const addSibling = () => {
    if (!selected.p) return
    const k = mindNode('New topic')
    setRoot(mapTree(root, (n) => {
      if (n.id !== selected.p.id) return n
      const kids = arr(n.kids).slice()
      kids.splice(kids.findIndex((x) => x.id === selected.n.id) + 1, 0, k)
      return { ...n, kids }
    }))
    setSel(k.id); focusName()
  }
  const del = () => {
    if (!selected.p) return
    setRoot(mapTree(root, (n) => (n.id === selected.p.id ? { ...n, kids: arr(n.kids).filter((x) => x.id !== selected.n.id) } : n)))
    setSel(selected.p.id)
  }
  const rename = (t) => setRoot(mapTree(root, (n) => (n.id === selected.n.id ? { ...n, t } : n)))

  return (
    <div>
      <div className={label}>Mind map</div>
      <div className="rounded-xl border border-hair/[0.1] bg-hair/[0.015]">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-hair/[0.08] px-2.5 py-2">
          <input
            ref={input}
            className="field min-w-[140px] flex-1 py-1.5 text-[13px]"
            value={selected.n.t}
            onChange={(e) => rename(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChild() } }}
            aria-label="Selected topic"
          />
          <button type="button" className={smallBtn} onClick={addChild}>+ Child</button>
          <button type="button" className={smallBtn} disabled={!selected.p} onClick={addSibling}>+ Sibling</button>
          <button type="button" className={smallBtn} disabled={!selected.p} onClick={del}>Delete</button>
          <span className="text-[12px] text-mute2">Click a topic to select it · Enter adds a child</span>
        </div>
        <div className="overflow-auto">
          <div className="relative" style={{ width: W, height: H }}>
            <svg width={W} height={H} className="absolute inset-0" aria-hidden="true">
              {pos.filter((p) => p.kids).flatMap((p) => p.kids.map((k) => {
                const x1 = p.x + (p.depth === 0 ? 130 : 115), mx = (x1 + k.x) / 2
                return <path key={k.n.id} d={`M${x1},${p.y} C${mx},${p.y} ${mx},${k.y} ${k.x},${k.y}`} fill="none" stroke={k.color} strokeWidth="2.5" strokeLinecap="round" />
              }))}
            </svg>
            {pos.map((p) => {
              const isRoot = p.depth === 0
              return (
                <button
                  key={p.n.id}
                  type="button"
                  onClick={() => setSel(p.n.id)}
                  className={cn(
                    'absolute -translate-y-1/2 whitespace-nowrap rounded-full border-2 font-semibold',
                    isRoot ? 'px-4 py-1.5 text-[15px] text-white' : 'bg-surface px-3 py-1 text-[13px]',
                    p.n.id === selected.n.id && 'ring-2 ring-teal ring-offset-2 ring-offset-surface',
                  )}
                  style={{ left: p.x, top: p.y, borderColor: p.color, ...(isRoot ? { background: p.color } : { color: p.color }) }}
                >
                  {p.n.t || 'Topic'}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- whiteboard: pen strokes in a 1000×500 space + sticky notes ---------- */
const INK = ['currentColor', '#2563EB', '#DC4A63', '#16A34A']
const STICKY = ['#FFF3B0', '#D9E8FF', '#D7F5E1', '#FFDBE4']

function BoardBlock({ b, set }) {
  const area = useRef(null)
  const [tool, setTool] = useState('select')
  const [ink, setInk] = useState(0)
  const [paper, setPaper] = useState(0)
  const [live, setLive] = useState(null) // stroke being drawn
  const [drag, setDrag] = useState(null) // { id, dx, dy, x, y }
  const [confirm, setConfirm] = useState(false)
  const [focusId, setFocusId] = useState('')
  const strokes = arr(b.strokes), stickies = arr(b.stickies)

  // Keep receiving moves outside the board while drawing / dragging (not every browser allows it).
  const capture = (e) => { try { area.current.setPointerCapture(e.pointerId) } catch { /* fine without */ } }
  const pt = (e) => {
    const r = area.current.getBoundingClientRect()
    return [Math.round(((e.clientX - r.left) / r.width) * 1000), Math.round(((e.clientY - r.top) / r.height) * 500)]
  }
  const onDown = (e) => {
    if (e.target.closest('[data-sticky]')) return
    if (tool === 'pen') {
      capture(e)
      setLive({ c: INK[ink], w: 3, p: [pt(e)] })
      e.preventDefault()
    } else if (tool === 'sticky') {
      const [x, y] = pt(e)
      const id = 's' + Date.now().toString(36)
      set({ stickies: stickies.concat([{ id, x: Math.min(830, x), y: Math.min(400, y), t: '', c: paper }]) })
      setFocusId(id)
    }
  }
  const onMove = (e) => {
    if (live) {
      const p = pt(e), last = live.p[live.p.length - 1]
      if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) >= 3) setLive({ ...live, p: live.p.concat([p]) })
    }
    if (drag) { const [x, y] = pt(e); setDrag({ ...drag, x: Math.max(0, Math.min(860, x - drag.dx)), y: Math.max(0, Math.min(430, y - drag.dy)) }) }
  }
  const onUp = () => {
    if (live) set({ strokes: strokes.concat([live.p.length > 1 ? live : { ...live, p: live.p.concat([live.p[0]]) }]) })
    if (drag) set({ stickies: stickies.map((s) => (s.id === drag.id ? { ...s, x: drag.x, y: drag.y } : s)) })
    setLive(null); setDrag(null)
  }
  const startDrag = (s) => (e) => {
    const [x, y] = pt(e)
    capture(e)
    setDrag({ id: s.id, dx: x - s.x, dy: y - s.y, x: s.x, y: s.y })
    e.preventDefault()
  }
  const d = (p) => 'M' + p.map((q) => q[0] + ',' + q[1]).join(' L')
  const tools = [['select', '↖ Move'], ['pen', '✎ Pen'], ['sticky', '▢ Sticky note'], ['erase', '⌫ Eraser']]

  return (
    <div>
      <div className={label}>Whiteboard</div>
      <div className="overflow-hidden rounded-xl border border-hair/[0.1]">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-hair/[0.08] bg-surface px-2.5 py-2">
          {tools.map(([k, t]) => (
            <button key={k} type="button" aria-pressed={tool === k} onClick={() => setTool(k)}
              className={cn('rounded-lg border px-2.5 py-1 text-[12.5px]', tool === k ? 'border-teal bg-teal text-onaccent' : 'border-hair/[0.14] hover:border-hair/[0.3]')}>
              {t}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-hair/[0.12]" />
          {(tool === 'sticky' ? STICKY : INK).map((c, i) => {
            const on = tool === 'sticky' ? paper === i : ink === i
            return (
              <button key={i} type="button" aria-label={tool === 'sticky' ? 'Sticky colour' : 'Pen colour'} aria-pressed={on}
                onClick={() => (tool === 'sticky' ? setPaper(i) : setInk(i))}
                className={cn('h-5 w-5 rounded-full border-2', on ? 'border-fg' : 'border-transparent', c === 'currentColor' && 'bg-fg')}
                style={c === 'currentColor' ? undefined : { background: c }} />
            )
          })}
          <span className="ml-auto flex items-center gap-2 text-[12.5px]">
            {confirm ? (
              <>
                <span className="text-mute">Clear the whole board?</span>
                <button type="button" className="font-semibold text-pink" onClick={() => { set({ strokes: [], stickies: [] }); setConfirm(false) }}>Clear</button>
                <button type="button" className="text-mute" onClick={() => setConfirm(false)}>Keep</button>
              </>
            ) : (
              <button type="button" className={smallBtn} disabled={!strokes.length && !stickies.length} onClick={() => setConfirm(true)}>Clear</button>
            )}
          </span>
        </div>
        <div
          ref={area}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={cn('relative aspect-[2/1] w-full touch-none text-fg max-[480px]:aspect-[4/3]', tool === 'pen' && 'cursor-crosshair', tool === 'sticky' && 'cursor-copy', tool === 'erase' && 'cursor-cell')}
          style={{ backgroundColor: 'var(--surface)', backgroundImage: 'radial-gradient(rgb(var(--hair-rgb) / 0.13) 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }}
        >
          <svg viewBox="0 0 1000 500" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label="Drawing">
            {strokes.map((s, i) => (
              <path key={i} d={d(s.p)} fill="none" stroke={s.c} strokeWidth={s.w || 3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
                onPointerDown={tool === 'erase' ? (e) => { e.stopPropagation(); set({ strokes: strokes.filter((_, j) => j !== i) }) } : undefined}
                style={tool === 'erase' ? { cursor: 'pointer' } : undefined} />
            ))}
            {live && <path d={d(live.p)} fill="none" stroke={live.c} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
          </svg>
          {stickies.map((s) => {
            const at = drag && drag.id === s.id ? drag : s
            return (
              <div key={s.id} data-sticky className="absolute min-h-[70px] w-[17%] min-w-[96px] rounded px-2 pb-2 pt-1.5 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)]"
                style={{ left: at.x / 10 + '%', top: at.y / 5 + '%', background: STICKY[s.c] || STICKY[0], color: '#2a2a2a' }}>
                <div onPointerDown={startDrag(s)} title="Drag to move" className="-mx-1 -mt-0.5 mb-1 h-2.5 cursor-grab rounded-sm bg-black/[0.06]" />
                <button type="button" aria-label="Delete sticky note" onClick={() => set({ stickies: stickies.filter((x) => x.id !== s.id) })} className="absolute right-1 top-0 text-[14px] text-black/40 hover:text-black/70">×</button>
                <textarea
                  autoFocus={focusId === s.id}
                  rows={2}
                  value={s.t}
                  onChange={(e) => set({ stickies: stickies.map((x) => (x.id === s.id ? { ...x, t: e.target.value } : x)) })}
                  aria-label="Sticky note"
                  className="w-full resize-none bg-transparent text-[14px] leading-snug outline-none"
                  style={{ fontFamily: '"Caveat", "Comic Sans MS", cursive', fontSize: 19, lineHeight: 1.1 }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
