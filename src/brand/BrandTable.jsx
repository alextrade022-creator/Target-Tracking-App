import { useEffect, useState } from 'react'
import { cn } from '../lib/helpers'
import { STAGES, stageOf } from './useBranding'
import { FormatChip, PlatformDots, TagChip, shortDate, waitingDays, spokenSeconds } from './bits'

const PER_PAGE = 20
const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])
const stIdx = (k) => STAGES.findIndex((x) => x.k === k)
const TABS = [{ k: 'all', label: 'All' }].concat(STAGES)
const STEPS = [
  { k: 'shoot', short: 'S', label: 'Shoot', on: 'border-orange bg-orange/[0.12] text-orange' },
  { k: 'edit', short: 'E', label: 'Edit', on: 'border-yellow bg-yellow/[0.14] text-yellow' },
  { k: 'post', short: 'P', label: 'Post', on: 'border-green bg-green/[0.12] text-green' },
]
const COLS = [
  { k: 'hook', label: 'Hook' },
  { k: 'format', label: 'Format' },
  { k: 'tags', label: 'Tags' },
  { k: 'stage', label: 'Stage' },
  { k: 'steps', label: 'Steps', fixed: true },
  { k: 'plats', label: 'Platforms', fixed: true },
  { k: 'wait', label: 'Waiting' },
  { k: 'len', label: 'Length' },
  { k: 'posted', label: 'Posted' },
]

function sortValue(b, k, tagMap) {
  switch (k) {
    case 'stage': return stIdx(stageOf(b)) * 1e6 - waitingDays(b)
    case 'wait': return stageOf(b) === 'posted' ? -1 : waitingDays(b)
    case 'len': return spokenSeconds(b)
    case 'posted': return b.postedDate || ''
    case 'tags': return arr(b.tags).map((id) => tagMap[id]?.name || '').join(',').toLowerCase()
    case 'format': return b.format || 'short'
    default: return String(b.hook || b.body || '').toLowerCase()
  }
}

const fmtLen = (s) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`)

export default function BrandTable({ brand, items, tagMap }) {
  const { state: s, actions: a } = brand
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(() => new Set())

  useEffect(() => { setSel(new Set()) }, [s.stab])

  const search = q.trim().toLowerCase()
  const found = search ? items.filter((b) => [b.hook, b.body, b.cta].join(' ').toLowerCase().includes(search)) : items
  const inTab = found
    .filter((b) => s.stab === 'all' || stageOf(b) === s.stab)
    .sort((x, y) => {
      const p = sortValue(x, s.sort.k, tagMap), r = sortValue(y, s.sort.k, tagMap)
      return (p < r ? -1 : p > r ? 1 : 0) * s.sort.dir
    })
  const pages = Math.max(1, Math.ceil(inTab.length / PER_PAGE))
  const page = Math.min(s.page, pages)
  const from = (page - 1) * PER_PAGE
  const rows = inTab.slice(from, from + PER_PAGE)
  const chosen = [...sel].filter((id) => items.some((b) => b.id === id))
  const allOnPage = rows.length > 0 && rows.every((b) => sel.has(b.id))

  const toggle = (id) => setSel((old) => { const n = new Set(old); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleAll = () => setSel((old) => { const n = new Set(old); rows.forEach((b) => (allOnPage ? n.delete(b.id) : n.add(b.id))); return n })
  const bulk = (stage) => { a.moveMany(chosen, stage); setSel(new Set()) }
  const goPage = (n) => { a.setPage(n); document.getElementById('brand-table')?.scrollIntoView({ block: 'start', behavior: 'smooth' }) }

  return (
    <section id="brand-table" className="panel scroll-mt-4">
      <div className="flex gap-0.5 overflow-x-auto border-b border-hair/[0.07] px-2.5" role="tablist" aria-label="Stage">
        {TABS.map((t) => {
          const n = t.k === 'all' ? found.length : found.filter((b) => stageOf(b) === t.k).length
          const on = s.stab === t.k
          return (
            <button
              key={t.k}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => a.setStab(t.k)}
              className={cn('inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-3 text-[13px] font-semibold transition-colors', on ? 'border-current' : 'border-transparent text-mute hover:text-fg')}
              style={on && t.color ? { color: t.color } : undefined}
            >
              {t.color && <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />}
              {t.label}
              <span className="rounded-full bg-hair/[0.06] px-1.5 text-[11.5px] text-mute">{n}</span>
            </button>
          )
        })}
      </div>

      <div className="flex min-h-[54px] flex-wrap items-center justify-between gap-2 border-b border-hair/[0.07] px-4 py-2.5">
        {chosen.length ? (
          <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
            <b className="mr-1">{chosen.length} selected</b>
            {STAGES.slice(1).map((st) => (
              <button key={st.k} type="button" onClick={() => bulk(st.k)} className="rounded-lg border border-hair/[0.14] px-2.5 py-1.5 font-medium hover:border-hair/[0.3]">Mark {st.label.toLowerCase()}</button>
            ))}
            <button type="button" onClick={() => setSel(new Set())} className="px-2 py-1.5 font-medium text-mute hover:text-fg">Clear</button>
          </div>
        ) : (
          <input type="search" className="field w-full py-2 sm:w-[260px]" placeholder="Search hooks and scripts…" aria-label="Search posts" value={q} onChange={(e) => { setQ(e.target.value); a.setPage(1) }} />
        )}
        <span className="text-[12.5px] text-mute">Sorted by {COLS.find((c) => c.k === s.sort.k)?.label.toLowerCase()} {s.sort.dir > 0 ? '↑' : '↓'}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-[13px] tabular-nums">
          <thead>
            <tr className="border-b border-hair/[0.07] text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">
              <th className="w-[38px] px-3 py-2.5"><input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="Select all on this page" /></th>
              {COLS.map((c) => (
                <th key={c.k} className="whitespace-nowrap px-2.5 py-2.5" aria-sort={s.sort.k === c.k ? (s.sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
                  {c.fixed ? c.label : (
                    <button type="button" onClick={() => a.setSort(c.k)} className="uppercase tracking-[inherit] hover:text-fg">
                      {c.label}{s.sort.k === c.k ? (s.sort.dir > 0 ? ' ↑' : ' ↓') : ''}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const stage = stageOf(b)
              const st = STAGES[stIdx(stage)]
              const wait = waitingDays(b)
              const secs = spokenSeconds(b)
              return (
                <tr key={b.id} className={cn('border-b border-hair/[0.06] last:border-b-0', sel.has(b.id) ? 'bg-teal/[0.06]' : 'hover:bg-hair/[0.03]')}>
                  <td className="px-3 py-2"><input type="checkbox" checked={sel.has(b.id)} onChange={() => toggle(b.id)} aria-label="Select post" /></td>
                  <td className="max-w-[360px] px-2.5 py-2">
                    <button type="button" onClick={() => a.open(b.id)} className="line-clamp-2 text-left font-semibold leading-snug hover:text-teal">{b.hook || b.body || 'Untitled'}</button>
                  </td>
                  <td className="px-2.5 py-2"><FormatChip format={b.format} /></td>
                  <td className="px-2.5 py-2">
                    <div className="flex flex-wrap gap-1">{arr(b.tags).map((id) => tagMap[id] && <TagChip key={id} tag={tagMap[id]} />)}{!arr(b.tags).length && <span className="text-mute2">—</span>}</div>
                  </td>
                  <td className="px-2.5 py-2">
                    <select
                      className="select w-auto py-1.5 pl-2.5 text-[12.5px]"
                      style={{ borderLeft: `3px solid ${st.color}` }}
                      value={stage}
                      onChange={(e) => a.moveTo(b.id, e.target.value)}
                      aria-label="Stage"
                    >
                      {STAGES.map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}
                    </select>
                  </td>
                  <td className="px-2.5 py-2">
                    <span className="inline-flex gap-1">
                      {STEPS.map((x) => (
                        <button
                          key={x.k}
                          type="button"
                          title={x.label}
                          aria-label={x.label}
                          aria-pressed={!!b[x.k]}
                          onClick={() => a.toggleStep(b.id, x.k)}
                          className={cn('h-6 w-[26px] rounded-md border text-[10.5px] font-bold', b[x.k] ? x.on : 'border-hair/[0.14] text-mute2 hover:text-fg')}
                        >
                          {x.short}
                        </button>
                      ))}
                    </span>
                  </td>
                  <td className="px-2.5 py-2"><PlatformDots list={b.platforms} /></td>
                  <td className={cn('whitespace-nowrap px-2.5 py-2', stage !== 'posted' && wait >= 7 && 'font-semibold text-pink')}>{stage === 'posted' ? '—' : `${wait}d`}</td>
                  <td className="whitespace-nowrap px-2.5 py-2">
                    {secs ? fmtLen(secs) : '—'}
                    {b.format !== 'long' && secs > 60 && <span title="Long for a reel (over 60 sec)" className="ml-1 text-yellow">●</span>}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2 text-mute">{b.postedDate ? shortDate(b.postedDate) : '—'}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={COLS.length + 1} className="px-4 py-10 text-center text-mute2">{search ? 'No posts match your search.' : 'No posts here.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hair/[0.07] px-4 py-2.5 text-[12.5px] text-mute">
        <span>{inTab.length ? `Showing ${from + 1}–${from + rows.length} of ${inTab.length} posts` : '0 posts'} · <span className="text-yellow">●</span> longer than 60 sec for a reel</span>
        {pages > 1 && (
          <nav className="flex flex-wrap items-center gap-1" aria-label="Pages">
            <PageBtn disabled={page === 1} onClick={() => goPage(page - 1)}>‹ Previous</PageBtn>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <PageBtn key={n} current={n === page} onClick={() => goPage(n)}>{n}</PageBtn>
            ))}
            <PageBtn disabled={page === pages} onClick={() => goPage(page + 1)}>Next ›</PageBtn>
          </nav>
        )}
      </div>
    </section>
  )
}

function PageBtn({ current, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
      className={cn('h-[30px] min-w-[30px] rounded-lg border px-2 text-[12.5px] disabled:opacity-40', current ? 'border-teal bg-teal font-semibold text-onaccent' : 'border-hair/[0.14] hover:border-hair/[0.3]')}
    >
      {children}
    </button>
  )
}
