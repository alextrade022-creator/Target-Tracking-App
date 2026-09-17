import { useState } from 'react'
import { cn } from '../lib/helpers'

export default function Leads({ vals, actions }) {
  const { leadView, leadDraft, leadFilters, leadStages, leadsTable, leadStats, deptOptions, leadStageOptions, leadSubOptions } = vals

  return (
    <div className="mt-7">
      {/* Sub-part switcher */}
      <div className="flex flex-wrap gap-2">
        <ViewTab active={leadView === 'pipeline'} onClick={() => actions.setLeadView('pipeline')}>Lead pipeline</ViewTab>
        <ViewTab active={leadView === 'total'} onClick={() => actions.setLeadView('total')}>Total leads</ViewTab>
      </div>

      {/* Filters */}
      <div className="panel mt-[18px]">
        <div className="flex flex-wrap items-end gap-3 px-[18px] py-4">
          <Filter label="DEPARTMENT">
            <select className="select min-w-[170px]" value={leadFilters.dept} onChange={(e) => actions.setLeadFilter({ dept: e.target.value })}>
              <option value="all">All departments</option>
              {deptOptions.map((d) => <option key={d.k} value={d.k}>{d.label}</option>)}
            </select>
          </Filter>
          <Filter label="STAGE">
            <select className="select min-w-[150px]" value={leadFilters.stage} onChange={(e) => actions.setLeadFilter({ stage: e.target.value })}>
              <option value="all">All stages</option>
              {leadStageOptions.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
            </select>
          </Filter>
          <Filter label="SUB-STATUS">
            <select className="select min-w-[160px]" value={leadFilters.sub} onChange={(e) => actions.setLeadFilter({ sub: e.target.value })}>
              <option value="all">All sub-statuses</option>
              {leadSubOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Filter>
          <Filter label="MONTH">
            <input type="month" className="field w-auto px-2.5 py-2 text-[13px] text-soft" value={leadFilters.month} onChange={(e) => actions.setLeadFilter({ month: e.target.value })} />
          </Filter>
          <Filter label="EXACT DATE">
            <input type="date" className="field w-auto px-2.5 py-2 text-[13px] text-soft" value={leadFilters.date} onChange={(e) => actions.setLeadFilter({ date: e.target.value })} />
          </Filter>
          <button type="button" onClick={actions.clearLeadFilters} className="mono rounded-lg border border-hair/[0.14] px-3.5 py-2.5 text-[11px] tracking-[0.12em] text-mute hover:text-fg">
            CLEAR
          </button>
        </div>
      </div>

      {/* Counters — respect the filters */}
      <div className="mt-[18px] flex flex-wrap gap-3">
        <div className="stat min-w-[130px] flex-1 px-[22px] py-4 sm:flex-none">
          <div className="mono text-[11px] tracking-[0.16em] text-mute2">TOTAL LEADS</div>
          <div className="mono text-[34px] font-semibold leading-[1.2]">{leadStats.total}</div>
          <div className="text-[11px] text-mute2">of {leadStats.grandTotal} all-time</div>
        </div>
        {leadStats.perStage.map((s) => (
          <div key={s.k} className="stat min-w-[120px] flex-1 px-4 py-3.5 sm:flex-none">
            <div className="mono text-[10px] tracking-[0.12em] text-mute2">{s.label.toUpperCase()}</div>
            <div className="mono text-[26px] font-semibold leading-[1.2]" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {leadView === 'pipeline'
        ? <Pipeline leadDraft={leadDraft} deptOptions={deptOptions} leadStages={leadStages} actions={actions} />
        : <TotalLeads leadStats={leadStats} leadsTable={leadsTable} />}
    </div>
  )
}

/* ------------------------------- Pipeline ------------------------------- */
function Pipeline({ leadDraft, deptOptions, leadStages, actions }) {
  return (
    <div>
      {/* Add lead */}
      <div className="panel mt-[22px]">
        <div className="border-b border-hair/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-head font-semibold tracking-[-0.01em]">New lead</div>
          <div className="mt-1 text-[13px] text-mute">Add a lead — it starts in the “Lead” stage. Open its card to fill in details, sub-status and notes.</div>
        </div>
        <div className="grid grid-cols-1 items-end gap-3.5 px-[22px] py-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_auto_auto]">
          <Labeled label="LEAD NAME">
            <input className="field" value={leadDraft.name} placeholder="Contact / brand name" onChange={(e) => actions.setLeadDraft({ name: e.target.value })} />
          </Labeled>
          <Labeled label="NUMBER">
            <input className="field" value={leadDraft.phone} placeholder="Phone" onChange={(e) => actions.setLeadDraft({ phone: e.target.value })} />
          </Labeled>
          <Labeled label="TYPE OF LEAD">
            <select className="select" value={leadDraft.dept} onChange={(e) => actions.setLeadDraft({ dept: e.target.value })}>
              {deptOptions.map((d) => <option key={d.k} value={d.k}>{d.label}</option>)}
            </select>
          </Labeled>
          <Labeled label="DATE">
            <input type="date" className="field" value={leadDraft.date} onChange={(e) => actions.setLeadDraft({ date: e.target.value })} />
          </Labeled>
          <button type="button" onClick={actions.addLead} className="whitespace-nowrap rounded-lg bg-teal px-6 py-3 text-[14px] font-bold text-onaccent">
            + Add lead
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="mt-[22px] overflow-x-auto pb-2">
        <div className="flex gap-3.5" style={{ minWidth: leadStages.length * 272 }}>
          {leadStages.map((col) => (
            <div key={col.k} className="w-[260px] flex-none rounded-2xl border border-hair/[0.08] bg-surface p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="mono text-[11px] tracking-[0.1em]" style={{ color: col.color }}>{col.label.toUpperCase()}</div>
                <div className="mono text-[13px]" style={{ color: col.color }}>{col.count}</div>
              </div>
              <div className="flex flex-col gap-2.5">
                {(col.cards ?? []).map((c) => <LeadCard key={c.id} c={c} />)}
                {col.empty && <div className="px-1 py-2 text-[12px] text-mute2">No leads.</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LeadCard({ c }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-hair/[0.08] bg-card p-3" style={{ borderLeft: '3px solid ' + c.stageColor }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold">{c.name}</div>
          <div className="mono text-[11px] text-mute">{c.phone}</div>
        </div>
        <button type="button" onClick={c.remove} className="px-0.5 text-[15px] leading-none text-mute2 hover:text-fg" aria-label="Remove lead">×</button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="mono rounded px-2 py-0.5 text-[10px] tracking-[0.06em]" style={{ color: c.deptColor, background: c.deptColor + '22' }}>{c.deptLabel}</span>
        {c.substatus && <span className="mono rounded px-2 py-0.5 text-[10px] tracking-[0.06em] text-soft" style={{ background: 'rgb(var(--hair-rgb) / .08)' }}>{c.substatus}</span>}
      </div>

      {c.hasSubs && (
        <select className="select mt-2 py-2 text-[12px]" value={c.substatus} onChange={c.setSub}>
          <option value="">— sub-status —</option>
          {c.subs.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      <div className="mt-2.5 flex items-center gap-1.5">
        {c.canPrev && <button type="button" onClick={c.prev} className="rounded-md border border-hair/[0.12] px-2 py-1 text-[11px] text-mute hover:text-fg">←</button>}
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex-1 rounded-md border border-hair/[0.12] px-2 py-1 text-[11px] text-mute hover:text-fg">
          {open ? 'Hide' : 'Details'}
        </button>
        {c.canNext && <button type="button" onClick={c.next} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ border: '1px solid ' + c.stageColor, color: c.stageColor }}>Next →</button>}
      </div>

      {open && <LeadDetail c={c} />}
    </div>
  )
}

function LeadDetail({ c }) {
  return (
    <div className="mt-3 border-t border-hair/[0.08] pt-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Mini label="BRAND / CLIENT" value={c.brand} onChange={(e) => c.patch({ brand: e.target.value })} />
        <Mini label="PLACE" value={c.place} onChange={(e) => c.patch({ place: e.target.value })} />
        <Mini label="BUSINESS TYPE" value={c.businessType} onChange={(e) => c.patch({ businessType: e.target.value })} />
        <Mini label="BUSINESS SINCE" value={c.businessSince} onChange={(e) => c.patch({ businessSince: e.target.value })} />
        <Mini label="MONTHLY / YEARLY SALES" value={c.sales} onChange={(e) => c.patch({ sales: e.target.value })} />
        <Labeled label="DATE"><input type="date" className="field px-2.5 py-2 text-[13px]" value={c.date} onChange={(e) => c.patch({ date: e.target.value })} /></Labeled>
      </div>
      <div className="mt-2.5">
        <div className="mono mb-1.5 text-[10px] tracking-[0.14em] text-mute2">CURRENT SITUATION</div>
        <textarea className="field min-h-[60px] resize-y text-[13px] leading-[1.5]" value={c.situation} onChange={(e) => c.patch({ situation: e.target.value })} />
      </div>

      {/* Notes */}
      <div className="mono mb-1.5 mt-3 text-[10px] tracking-[0.14em] text-mute2">NOTES</div>
      <div className="flex flex-col gap-1.5">
        {c.notes.map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-2 rounded-lg px-2.5 py-1.5" style={{ background: 'rgb(var(--hair-rgb) / .04)' }}>
            <div className="text-[12.5px] leading-[1.4] text-soft" style={{ textWrap: 'pretty' }}>{n.text}</div>
            <div className="flex flex-none items-center gap-1.5">
              {n.at && <span className="mono text-[9.5px] text-mute2">{n.at}</span>}
              <button type="button" onClick={n.remove} className="text-[14px] leading-none text-mute2 hover:text-fg">×</button>
            </div>
          </div>
        ))}
        {c.notes.length === 0 && <div className="text-[12px] text-mute2">No notes yet.</div>}
      </div>
      <NoteAdder onAdd={c.addNote} />
    </div>
  )
}

function NoteAdder({ onAdd }) {
  const [text, setText] = useState('')
  const submit = () => {
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }
  return (
    <div className="mt-2 flex gap-2">
      <input
        className="field px-2.5 py-2 text-[12.5px]"
        placeholder="Add a note after contacting…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
      />
      <button type="button" onClick={submit} className="whitespace-nowrap rounded-lg bg-teal px-3.5 py-2 text-[12.5px] font-bold text-onaccent">Add</button>
    </div>
  )
}

/* ------------------------------ Total leads ----------------------------- */
function TotalLeads({ leadStats, leadsTable }) {
  const max = Math.max(1, ...leadStats.perStage.map((s) => s.count))
  return (
    <div className="mt-[22px] grid grid-cols-1 gap-[22px] xl:grid-cols-2">
      {/* Stage breakdown */}
      <div className="panel">
        <div className="border-b border-hair/[0.08] px-[22px] py-[18px] text-[19px] font-head font-semibold tracking-[-0.01em]">By stage</div>
        <div className="flex flex-col gap-3 px-[22px] py-5">
          {leadStats.perStage.map((s) => (
            <div key={s.k} className="flex items-center gap-3">
              <div className="w-[150px] flex-none text-[13px] text-soft">{s.label}</div>
              <div className="h-[8px] flex-1 overflow-hidden rounded" style={{ background: 'rgb(var(--hair-rgb) / .08)' }}>
                <div className="h-full rounded" style={{ width: (s.count / max) * 100 + '%', background: s.color }} />
              </div>
              <div className="mono w-[34px] flex-none text-right text-[13px]" style={{ color: s.color }}>{s.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Department breakdown */}
      <div className="panel">
        <div className="border-b border-hair/[0.08] px-[22px] py-[18px] text-[19px] font-head font-semibold tracking-[-0.01em]">By department</div>
        <div className="flex flex-col gap-2.5 px-[22px] py-5">
          {leadStats.perDept.map((d) => (
            <div key={d.k} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgb(var(--hair-rgb) / .04)' }}>
              <span className="mono rounded px-2 py-0.5 text-[11px]" style={{ color: d.color, background: d.color + '22' }}>{d.label}</span>
              <span className="mono text-[15px]" style={{ color: d.color }}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="panel xl:col-span-2">
        <div className="flex items-center justify-between border-b border-hair/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-head font-semibold tracking-[-0.01em]">All leads</div>
          <div className="mono text-[11px] tracking-[0.14em] text-mute2">{leadStats.total} SHOWN</div>
        </div>
        <div className="overflow-x-auto px-[22px] py-4">
          <div className="min-w-[720px]">
            <div className="grid border-b border-hair/[0.08] pb-2" style={{ gridTemplateColumns: '1.4fr 1fr 1.2fr 1.1fr 1.2fr 0.9fr' }}>
              {['NAME', 'NUMBER', 'TYPE', 'STAGE', 'SUB-STATUS', 'DATE'].map((h) => (
                <div key={h} className="mono text-[10px] tracking-[0.13em] text-mute2">{h}</div>
              ))}
            </div>
            {(leadsTable ?? []).map((l) => (
              <div key={l.id} className="grid items-center border-b border-hair/[0.05] py-2.5" style={{ gridTemplateColumns: '1.4fr 1fr 1.2fr 1.1fr 1.2fr 0.9fr' }}>
                <div className="pr-2 text-[13px] font-semibold" style={{ textWrap: 'pretty' }}>{l.name}</div>
                <div className="mono pr-2 text-[12px] text-mute">{l.phone}</div>
                <div className="pr-2"><span className="mono rounded px-1.5 py-0.5 text-[10px]" style={{ color: l.deptColor, background: l.deptColor + '22' }}>{l.deptLabel}</span></div>
                <div className="pr-2 text-[12px]" style={{ color: l.stageColor }}>{l.stageLabel}</div>
                <div className="pr-2 text-[12px] text-mute3">{l.substatus || '—'}</div>
                <div className="mono text-[11px] text-mute2">{l.dateLabel}</div>
              </div>
            ))}
            {(!leadsTable || leadsTable.length === 0) && <div className="py-6 text-center text-[13px] text-mute2">No leads match these filters.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------- bits --------------------------------- */
function ViewTab({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-lg border px-4 py-2 text-[13.5px] font-semibold transition-colors', active ? 'border-teal bg-teal text-onaccent' : 'border-hair/[0.14] text-mute hover:text-fg')}
    >
      {children}
    </button>
  )
}

function Filter({ label, children }) {
  return (
    <div>
      <div className="mono mb-1.5 text-[10px] tracking-[0.14em] text-mute2">{label}</div>
      {children}
    </div>
  )
}

function Labeled({ label, children }) {
  return (
    <div>
      <div className="mono mb-[7px] text-[11px] tracking-[0.16em] text-mute2">{label}</div>
      {children}
    </div>
  )
}

function Mini({ label, value, onChange }) {
  return (
    <div>
      <div className="mono mb-1.5 text-[10px] tracking-[0.14em] text-mute2">{label}</div>
      <input className="field px-2.5 py-2 text-[13px]" value={value} onChange={onChange} />
    </div>
  )
}
