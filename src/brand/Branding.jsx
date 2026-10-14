import { useState } from 'react'
import { cn } from '../lib/helpers'
import { PageHeader } from '../ws/ui'
import { PALETTE } from '../lib/constants'
import { Modal } from '../crm/bits'
import ScriptPage from './ScriptPage'
import BrandTable from './BrandTable'
import { STAGES, stageOf } from './useBranding'
import { FormatChip, PlatformDots, TagChip, Swatches, shortDate, waitingDays } from './bits'

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])
const STUCK_AT = 4 // a column this full (before Posted) gets the bottleneck warning

export default function Branding({ brand }) {
  const { state: s, actions: a } = brand
  const items = arr(s.items)
  const tags = arr(s.tags)
  const tagMap = Object.fromEntries(tags.map((t) => [t.id, t]))
  const visible = items.filter((b) => (s.format === 'all' || (b.format || 'short') === s.format) && (s.tag === 'all' || arr(b.tags).includes(s.tag)))
  const byStage = (k) => visible.filter((b) => stageOf(b) === k)
  const counts = Object.fromEntries(STAGES.map((st) => [st.k, byStage(st.k).length]))
  const busiest = STAGES.slice(0, 3).reduce((x, y) => (counts[y.k] > counts[x.k] ? y : x), STAGES[0])
  const stuck = counts[busiest.k] >= STUCK_AT ? busiest : null
  const active = items.find((b) => b.id === s.openId)

  const [hook, setHook] = useState('')
  const [format, setFormat] = useState('short')
  const [dragId, setDragId] = useState('')
  const [over, setOver] = useState('')
  const [managing, setManaging] = useState(false)

  if (active) return <ScriptPage brand={brand} item={active} tagMap={tagMap} onBack={() => a.open('')} />

  const capture = (e) => {
    e.preventDefault()
    if (!hook.trim()) return
    const id = a.add({ hook, format })
    setHook('')
    a.open(id) // straight to the script page to write the body and CTA
  }

  return (
    <div>
      <PageHeader title="Personal branding" subtitle="Write, shoot, edit and post. Move each video one step at a time." />

      <form onSubmit={capture} className="panel mb-4 flex flex-wrap gap-2 p-3">
        <input className="field min-w-[220px] flex-1" placeholder="New idea: type just the hook, write the rest next" aria-label="New idea hook" value={hook} onChange={(e) => setHook(e.target.value)} />
        <select className="select w-auto min-w-[140px]" aria-label="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="short">Short form</option>
          <option value="long">Long video</option>
        </select>
        <button type="submit" disabled={!hook.trim()} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt disabled:opacity-40">+ Add idea</button>
      </form>

      {stuck && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-yellow/[0.12] px-4 py-3 text-[13px]">
          <span>
            <b className="text-yellow">{counts[stuck.k]} videos are waiting at “{stuck.label}”.</b>{' '}
            {stuck.k === 'shot' ? 'Editing is the bottleneck. Block an editing hour, or hand these to an editor.'
              : stuck.k === 'edited' ? 'They are ready. Post or schedule them before making more.'
                : 'Shoot these before writing new ones.'}
          </span>
        </div>
      )}

      <div className="panel mb-4 grid grid-cols-4 p-1">
        {STAGES.map((st, i) => {
          const on = s.view === 'table' && s.stab === st.k
          return (
            <div key={st.k} className={cn('px-1', i > 0 && 'border-l border-hair/[0.07]')}>
              <button
                type="button"
                onClick={() => a.showStage(st.k)}
                title={`Show ${st.label} in the table`}
                className={cn('w-full rounded-xl px-2 py-2 text-center transition-colors', on ? 'bg-teal/[0.08] shadow-[inset_0_-3px_0_#2563EB]' : 'hover:bg-hair/[0.04]')}
              >
                <div className="font-head text-[22px] font-bold tabular-nums" style={{ color: st.color }}>{counts[st.k]}</div>
                <div className="text-[12px] text-mute">{st.label}</div>
              </button>
            </div>
          )
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ViewSwitch view={s.view} onChange={a.setView} />
        {[['all', 'All formats'], ['short', 'Short form'], ['long', 'Long video']].map(([k, t]) => (
          <Pill key={k} on={s.format === k} onClick={() => a.setFormat(k)}>{t}</Pill>
        ))}
        <span className="mx-1 h-5 w-px bg-hair/[0.12]" />
        <Pill on={s.tag === 'all'} onClick={() => a.setTag('all')}>All tags</Pill>
        {tags.map((t) => (
          <Pill key={t.id} on={s.tag === t.id} onClick={() => a.setTag(s.tag === t.id ? 'all' : t.id)} color={t.color}>{t.name}</Pill>
        ))}
        <button type="button" onClick={() => setManaging(true)} className="ml-auto text-[12.5px] font-medium text-teal hover:text-teal-lt">Manage tags</button>
      </div>

      {items.length === 0 ? (
        <section className="panel px-6 py-12 text-center">
          <div className="font-head text-[17px] font-semibold">No content yet</div>
          <p className="mt-1 text-[13.5px] text-mute">Type a hook above to add your first idea.</p>
        </section>
      ) : (
        <div className="overflow-hidden">
          <div
            className="flex w-[200%] items-start transition-transform duration-[380ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
            style={{ transform: s.view === 'table' ? 'translateX(-50%)' : 'none' }}
          >
            <Pane hidden={s.view !== 'board'} label="Board">
            <div className="-mx-1 grid grid-flow-col auto-cols-[minmax(250px,1fr)] gap-3 overflow-x-auto px-1 pb-3">
              {STAGES.map((st) => {
                const list = byStage(st.k).sort((x, y) => (st.k === 'posted'
                  ? String(y.postedDate || '').localeCompare(String(x.postedDate || ''))
                  : (x.stageAt || x.createdAt || 0) - (y.stageAt || y.createdAt || 0)))
                return (
                  <section
                    key={st.k}
                    aria-label={st.label}
                    onDragOver={(e) => { if (!dragId) return; e.preventDefault(); if (over !== st.k) setOver(st.k) }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver('') }}
                    onDrop={(e) => { e.preventDefault(); if (dragId) a.moveTo(dragId, st.k); setDragId(''); setOver('') }}
                    className={cn(
                      'min-h-[380px] rounded-2xl border-2 border-dashed p-2.5 transition-colors',
                      over === st.k ? 'border-teal bg-teal/[0.06]' : 'border-transparent bg-hair/[0.04]',
                      stuck?.k === st.k && over !== st.k && 'ring-2 ring-inset ring-yellow/60',
                    )}
                  >
                    <header className="flex items-center gap-2 px-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: st.color }} />
                      <span className="flex-1 text-[13px] font-semibold">{st.label}</span>
                      <span className="rounded-full bg-surface px-2 text-[12px] font-semibold text-mute">{list.length}</span>
                    </header>
                    <div className="px-1 pb-2.5 text-[11.5px] text-mute2">{st.next ? `Next: ${st.next.toLowerCase()} · oldest first` : 'Newest first'}</div>
                    <div className="flex flex-col gap-2">
                      {list.map((b) => (
                        <Card
                          key={b.id}
                          b={b}
                          st={st}
                          tagMap={tagMap}
                          dragging={dragId === b.id}
                          onOpen={() => a.open(b.id)}
                          onNext={() => a.moveTo(b.id, STAGES[STAGES.findIndex((x) => x.k === st.k) + 1].k)}
                          onDragStart={(e) => { setDragId(b.id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', b.id) } catch { /* ignore */ } }}
                          onDragEnd={() => { setDragId(''); setOver('') }}
                        />
                      ))}
                      {list.length === 0 && <div className="rounded-xl border border-dashed border-hair/[0.12] px-2 py-5 text-center text-[12px] text-mute2">Nothing here</div>}
                    </div>
                  </section>
                )
              })}
            </div>
            </Pane>
            <Pane hidden={s.view !== 'table'} label="Table">
              <BrandTable brand={brand} items={visible} tagMap={tagMap} />
            </Pane>
          </div>
        </div>
      )}

      {managing && <TagManager brand={brand} onClose={() => setManaging(false)} />}
    </div>
  )
}

/* The view that slid out stays laid out until the slide finishes, then collapses. */
function Pane({ hidden, label, children }) {
  return (
    <div
      role="tabpanel"
      aria-label={label}
      aria-hidden={hidden}
      className="w-1/2 min-w-0 px-px"
      style={hidden
        ? { visibility: 'hidden', maxHeight: 0, overflow: 'hidden', transition: 'visibility 0s 380ms, max-height 0s 380ms' }
        : { visibility: 'visible' }}
    >
      {children}
    </div>
  )
}

function ViewSwitch({ view, onChange }) {
  const opts = [['board', '▦ Board'], ['table', '☰ Table']]
  return (
    <div
      role="tablist"
      aria-label="View"
      onKeyDown={(e) => { if (e.key === 'ArrowRight') onChange('table'); if (e.key === 'ArrowLeft') onChange('board') }}
      className="relative mr-1 inline-grid grid-cols-2 rounded-full bg-hair/[0.06] p-[3px]"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-[3px] left-[3px] top-[3px] w-[calc(50%-3px)] rounded-full bg-panel shadow-sm transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
        style={{ transform: view === 'table' ? 'translateX(100%)' : 'none' }}
      />
      {opts.map(([k, t]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={view === k}
          onClick={() => onChange(k)}
          className={cn('relative z-[1] rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors', view === k ? 'text-fg' : 'text-mute hover:text-fg')}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function Pill({ on, onClick, color, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors', on ? 'border-teal bg-teal text-onaccent' : 'border-hair/[0.14] text-mute hover:text-fg')}
      style={!on && color ? { color } : undefined}
    >
      {children}
    </button>
  )
}

function Card({ b, st, tagMap, dragging, onOpen, onNext, onDragStart, onDragEnd }) {
  const wait = waitingDays(b)
  const title = b.hook || b.body || 'Untitled'
  return (
    <article
      draggable
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'cursor-grab rounded-xl border border-hair/[0.08] bg-surface px-3 py-2.5 shadow-[var(--shadow-card)] transition hover:border-hair/[0.2] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal',
        dragging && 'opacity-40',
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        <FormatChip format={b.format} />
        {arr(b.tags).map((id) => tagMap[id] && <TagChip key={id} tag={tagMap[id]} />)}
      </div>
      <div className="my-2 line-clamp-3 text-[13.5px] font-semibold leading-snug" style={{ textWrap: 'pretty' }}>{title}</div>
      <div className="flex items-center justify-between gap-2">
        <PlatformDots list={b.platforms} />
        {st.btn ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="ml-auto text-[12px] font-semibold hover:underline"
            style={{ color: STAGES[STAGES.indexOf(st) + 1].color }}
          >
            {st.btn} →
          </button>
        ) : (
          <span className="ml-auto text-[11.5px] text-mute2">{b.postedDate ? 'Posted ' + shortDate(b.postedDate) : ''}</span>
        )}
      </div>
      {st.btn && <div className={cn('mt-1 text-[11px]', wait >= 7 ? 'font-medium text-pink' : 'text-mute2')}>{wait === 0 ? 'Added to this step today' : `Waiting ${wait} day${wait === 1 ? '' : 's'}`}</div>}
      {!b.body && !b.cta && st.k === 'idea' && <div className="mt-1 text-[11px] text-yellow">Script not written yet</div>}
    </article>
  )
}

function TagManager({ brand, onClose }) {
  const { state: s, actions: a } = brand
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [confirm, setConfirm] = useState('')
  const used = (id) => arr(s.items).filter((b) => arr(b.tags).includes(id)).length
  return (
    <Modal title="Content tags" hint="Label posts by topic, then filter the board by tag." onClose={onClose}>
      <div className="grid gap-3">
        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (a.addTag(name, color)) setName('') }}>
          <input className="field min-w-[160px] flex-1" placeholder="New tag, e.g. Finance tips" value={name} onChange={(e) => setName(e.target.value)} aria-label="New tag name" />
          <Swatches value={color} onPick={setColor} />
          <button type="submit" disabled={!name.trim()} className="rounded-lg bg-teal px-3.5 py-2 text-[13px] font-semibold text-onaccent disabled:opacity-40">Add</button>
        </form>
        <div className="flex flex-col divide-y divide-hair/[0.07]">
          {arr(s.tags).map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-2 py-2">
              <input className="field min-w-[140px] flex-1 py-1.5" value={t.name} onChange={(e) => a.patchTag(t.id, { name: e.target.value })} aria-label="Tag name" />
              <Swatches value={t.color} onPick={(c) => a.patchTag(t.id, { color: c })} />
              <span className="w-[54px] text-right text-[12px] text-mute2">{used(t.id)} post{used(t.id) === 1 ? '' : 's'}</span>
              {confirm === t.id ? (
                <span className="flex gap-2 text-[12px]">
                  <button type="button" onClick={() => { a.removeTag(t.id); setConfirm('') }} className="font-semibold text-pink">Delete</button>
                  <button type="button" onClick={() => setConfirm('')} className="text-mute">Keep</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirm(t.id)} aria-label={`Delete tag ${t.name}`} className="px-1 text-[16px] text-mute2 hover:text-pink">×</button>
              )}
            </div>
          ))}
          {arr(s.tags).length === 0 && <p className="py-2 text-[12.5px] text-mute2">No tags yet.</p>}
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Done</button>
        </div>
      </div>
    </Modal>
  )
}

