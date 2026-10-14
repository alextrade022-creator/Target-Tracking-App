import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/helpers'
import { PLATFORMS, PALETTE } from '../lib/constants'
import { STAGES, stageOf } from './useBranding'
import { FormatChip, TagChip, waitingDays, spokenSeconds } from './bits'

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])
const words = (s) => (String(s || '').trim().match(/\S+/g) || []).length
const STEPS = [
  { k: 'shoot', label: 'Shoot', on: 'border-orange bg-orange/[0.1] text-orange' },
  { k: 'edit', label: 'Edit', on: 'border-yellow bg-yellow/[0.12] text-yellow' },
  { k: 'post', label: 'Post', on: 'border-green bg-green/[0.1] text-green' },
]

export default function ScriptPage({ brand, item: b, tagMap, onBack }) {
  const { state: s, actions: a } = brand
  const [editing, setEditing] = useState(() => !b.body && !b.cta)
  const [prompt, setPrompt] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [note, setNote] = useState('')
  const say = (m) => { setNote(m); setTimeout(() => setNote(''), 2500) }

  useEffect(() => { window.scrollTo({ top: 0 }) }, [b.id])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !prompt && !editing) onBack() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [prompt, editing, onBack])

  const stage = STAGES.find((x) => x.k === stageOf(b))
  const siblings = arr(s.items).filter((x) => stageOf(x) === stage.k)
  const idx = siblings.findIndex((x) => x.id === b.id)
  const prev = siblings[idx - 1], next = siblings[idx + 1]
  const w = words(b.hook) + words(b.body) + words(b.cta)
  const secs = spokenSeconds(b)
  const length = secs < 60 ? `${secs} sec` : `${Math.floor(secs / 60)} min ${secs % 60} sec`
  const tags = Object.values(tagMap)
  const caption = [b.hook, b.body, b.cta].filter(Boolean).join('\n\n') +
    (arr(b.tags).length ? '\n\n' + arr(b.tags).map((id) => tagMap[id] && '#' + tagMap[id].name.replace(/\s+/g, '')).filter(Boolean).join(' ') : '')

  const copy = async () => {
    try { await navigator.clipboard.writeText(caption); say('Caption copied.') } catch { say('Could not copy. Select the text and press Cmd+C.') }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="text-[13px] font-medium text-teal hover:text-teal-lt">← Back to board</button>
        <div className="flex items-center gap-2 text-[12.5px] text-mute">
          <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
          {stage.label} · {idx + 1} of {siblings.length}
          <button type="button" disabled={!prev} onClick={() => a.open(prev.id)} className="rounded-md border border-hair/[0.14] px-2 py-0.5 disabled:opacity-30" aria-label="Previous in this step">‹</button>
          <button type="button" disabled={!next} onClick={() => a.open(next.id)} className="rounded-md border border-hair/[0.14] px-2 py-0.5 disabled:opacity-30" aria-label="Next in this step">›</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="panel flex flex-col gap-5 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <FormatChip format={b.format} />
              {arr(b.tags).map((id) => tagMap[id] && <TagChip key={id} tag={tagMap[id]} />)}
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Progress">
              {STEPS.map((st) => (
                <button
                  key={st.k}
                  type="button"
                  aria-pressed={!!b[st.k]}
                  onClick={() => a.toggleStep(b.id, st.k)}
                  className={cn('rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors', b[st.k] ? st.on : 'border-hair/[0.14] text-mute hover:text-fg')}
                >
                  {b[st.k] ? '✓ ' : ''}{st.label}
                </button>
              ))}
            </div>
          </div>

          {editing ? (
            <div className="grid gap-4">
              <Part label="Hook"><textarea className="field resize-y font-head text-[18px] font-semibold leading-snug" rows={2} autoFocus={!b.hook} placeholder="The scroll-stopping opener" value={b.hook || ''} onChange={(e) => a.patch(b.id, { hook: e.target.value })} /></Part>
              <Part label="Body"><textarea className="field resize-y text-[15px] leading-relaxed" rows={7} autoFocus={!!b.hook} placeholder="The main value or story" value={b.body || ''} onChange={(e) => a.patch(b.id, { body: e.target.value })} /></Part>
              <Part label="CTA"><textarea className="field resize-y text-[15px]" rows={2} placeholder="What should viewers do next?" value={b.cta || ''} onChange={(e) => a.patch(b.id, { cta: e.target.value })} /></Part>
            </div>
          ) : (
            <div className="grid gap-5">
              <Part label="Hook"><div className="whitespace-pre-wrap font-head text-[22px] font-bold leading-snug" style={{ textWrap: 'pretty' }}>{b.hook || <Empty />}</div></Part>
              <Part label="Body"><div className="max-w-[68ch] whitespace-pre-wrap text-[17px] leading-relaxed text-soft">{b.body || <Empty />}</div></Part>
              <Part label="CTA"><div className="whitespace-pre-wrap text-[17px] font-medium leading-relaxed">{b.cta || <Empty />}</div></Part>
            </div>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-hair/[0.07] pt-3 text-[12.5px] text-mute">
            <span><b className="tabular-nums text-fg">{w}</b> words</span>
            <span>About <b className="text-fg">{length}</b> spoken</span>
            {b.format !== 'long' && w > 0 && <span className={secs > 60 ? 'text-yellow' : 'text-green'}>{secs > 60 ? 'Long for a reel. Aim for under 60 seconds.' : 'Good length for a reel.'}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-lg border border-hair/[0.14] px-3.5 py-2 text-[13px] font-medium hover:border-hair/[0.3]">{editing ? 'Done' : 'Edit script'}</button>
            <button type="button" disabled={!b.hook && !b.body} onClick={() => setPrompt(true)} className="rounded-lg bg-teal px-3.5 py-2 text-[13px] font-semibold text-onaccent hover:bg-teal-lt disabled:opacity-40">Open teleprompter</button>
            <button type="button" disabled={!caption.trim()} onClick={copy} className="rounded-lg border border-hair/[0.14] px-3.5 py-2 text-[13px] font-medium hover:border-hair/[0.3] disabled:opacity-40">Copy caption</button>
            {note && <span role="status" className="text-[12.5px] text-mute">{note}</span>}
          </div>
        </article>

        <aside className="flex flex-col gap-4">
          <Box title="Status">
            <div className="text-[13px]">
              <b>{stage.label}</b>
              {stage.next && <span className="text-mute"> · next: {stage.next.toLowerCase()} · {waitingDays(b) === 0 ? 'since today' : `waiting ${waitingDays(b)} day${waitingDays(b) === 1 ? '' : 's'}`}</span>}
            </div>
            {stage.btn && (
              <button
                type="button"
                onClick={() => a.moveTo(b.id, STAGES[STAGES.indexOf(stage) + 1].k)}
                className="mt-2 w-full rounded-lg px-3 py-2 text-[13px] font-semibold text-white"
                style={{ background: STAGES[STAGES.indexOf(stage) + 1].color }}
              >
                {stage.btn} →
              </button>
            )}
            {b.post && (
              <label className="mt-2 grid gap-1 text-[12px] text-mute">
                Posted on
                <input type="date" className="field py-1.5" value={b.postedDate || ''} onChange={(e) => a.patch(b.id, { postedDate: e.target.value })} />
              </label>
            )}
          </Box>

          <Box title="Format">
            <select className="select" value={b.format || 'short'} onChange={(e) => a.patch(b.id, { format: e.target.value })} aria-label="Format">
              <option value="short">Short form</option>
              <option value="long">Long video</option>
            </select>
          </Box>

          <Box title="Platforms">
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => {
                const on = arr(b.platforms).includes(p.k)
                return (
                  <button key={p.k} type="button" aria-pressed={on} onClick={() => a.togglePlatform(b.id, p.k)}
                    className="rounded-full border px-3 py-1 text-[12.5px] font-medium"
                    style={on ? { borderColor: p.color, background: p.color + '1f', color: p.color } : undefined}
                  >
                    {on ? '✓ ' : ''}{p.label}
                  </button>
                )
              })}
            </div>
          </Box>

          <Box title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const on = arr(b.tags).includes(t.id)
                return (
                  <button key={t.id} type="button" aria-pressed={on} onClick={() => a.toggleTag(b.id, t.id)}
                    className={cn('rounded-full border px-3 py-1 text-[12.5px] font-medium', !on && 'border-hair/[0.14] text-mute')}
                    style={on ? { borderColor: t.color, background: t.color + '1f', color: t.color } : undefined}
                  >
                    {on ? '✓ ' : ''}{t.name}
                  </button>
                )
              })}
            </div>
            <form className="mt-2 flex gap-1.5" onSubmit={(e) => {
              e.preventDefault()
              const id = a.addTag(newTag, PALETTE[tags.length % PALETTE.length])
              if (id) { a.toggleTag(b.id, id); setNewTag('') }
            }}>
              <input className="field py-1.5 text-[13px]" placeholder="New tag" aria-label="New tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
              <button type="submit" disabled={!newTag.trim()} className="rounded-lg border border-hair/[0.14] px-3 text-[12.5px] font-medium disabled:opacity-40">Add</button>
            </form>
          </Box>

          <div className="px-1">
            {confirm ? (
              <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="text-mute">Delete this post?</span>
                <button type="button" onClick={() => a.remove(b.id)} className="rounded-lg bg-pink px-3 py-1.5 font-semibold text-onaccent">Delete</button>
                <button type="button" onClick={() => setConfirm(false)} className="font-medium text-mute hover:text-fg">Keep</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className="text-[12.5px] font-medium text-mute hover:text-pink">Delete post</button>
            )}
          </div>
        </aside>
      </div>

      {prompt && <Teleprompter b={b} onClose={() => setPrompt(false)} />}
    </div>
  )
}

function Part({ label, children }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-4">
      <div className="pt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-mute2">{label}</div>
      {children}
    </div>
  )
}

function Empty() {
  return <span className="font-sans text-[14px] font-normal text-mute2">Not written yet. Click Edit script.</span>
}

function Box({ title, children }) {
  return (
    <section className="panel px-4 py-3.5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-mute2">{title}</div>
      {children}
    </section>
  )
}

/* Full-screen scrolling script for recording. */
function Teleprompter({ b, onClose }) {
  const box = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(2)
  const [size, setSize] = useState(44)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  useEffect(() => {
    if (!playing) return undefined
    let raf = 0, last = performance.now()
    const tick = (t) => {
      if (box.current) box.current.scrollTop += ((t - last) / 1000) * speed * 22
      last = t
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed])

  const btn = 'rounded-lg bg-white/10 px-3 py-1.5 text-[13px] hover:bg-white/20'
  return (
    <div role="dialog" aria-modal="true" aria-label="Teleprompter" className="fixed inset-0 z-[90] flex flex-col bg-[#0b1222] text-[#f3f6fb]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
        <span className="opacity-70">Teleprompter · space to start or pause · Esc to close</span>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={() => setSize((v) => Math.max(24, v - 4))}>A−</button>
          <button type="button" className={btn} onClick={() => setSize((v) => Math.min(80, v + 4))}>A+</button>
          <button type="button" className={btn} onClick={() => setSpeed((v) => Math.max(1, v - 1))}>Slower</button>
          <span className="w-14 text-center tabular-nums opacity-70">Speed {speed}</span>
          <button type="button" className={btn} onClick={() => setSpeed((v) => Math.min(10, v + 1))}>Faster</button>
          <button type="button" className={btn} onClick={() => { if (box.current) box.current.scrollTop = 0 }}>Restart</button>
          <button type="button" className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-[13px] font-semibold" onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Start'}</button>
          <button type="button" className={btn} onClick={onClose}>Close</button>
        </div>
      </div>
      <div ref={box} className="flex-1 overflow-y-auto px-[8vw] pb-[70vh] pt-[22vh] font-semibold leading-[1.45]" style={{ fontSize: size }}>
        {[['Hook', b.hook], ['Body', b.body], ['Call to action', b.cta]].filter(([, t]) => t).map(([label, t]) => (
          <p key={label} className="mb-[1em] whitespace-pre-wrap">
            <span className="mb-1 block text-[0.38em] uppercase tracking-[0.14em] opacity-50">{label}</span>
            {t}
          </p>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[22vh] h-px bg-white/15" aria-hidden="true" />
    </div>
  )
}
