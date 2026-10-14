import { useState } from 'react'
import { cn, iso, pretty } from '../lib/helpers'

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-head text-[26px] font-bold leading-tight tracking-[-0.02em]">{title}</h1>
        {subtitle && <div className="mt-1 text-[13.5px] text-mute">{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}

export function Label({ children }) {
  return <div className="mb-1.5 text-[12px] font-medium text-mute">{children}</div>
}

export function BizChip({ biz }) {
  if (!biz) return <span className="rounded-md bg-hair/[0.06] px-2 py-0.5 text-[11px] font-medium text-mute">N/A</span>
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ color: biz.color, background: biz.color + '14' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: biz.color }} />
      {biz.name || 'N/A'}
    </span>
  )
}

export function Checkbox({ checked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={checked ? 'Mark as not done' : 'Mark as done'}
      className={cn(
        'mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-[1.5px] text-[10px] font-bold text-onaccent transition-colors',
        checked ? 'border-green bg-green' : 'border-[var(--box-border)] hover:border-teal',
      )}
    >
      {checked ? '✓' : ''}
    </button>
  )
}

/* Segmented control */
export function Seg({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-hair/[0.05] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors',
            value === o.value ? 'bg-panel text-fg shadow-sm' : 'text-mute hover:text-fg',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 text-mute2">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Empty({ children }) {
  return <div className="px-4 py-10 text-center text-[13px] text-mute2">{children}</div>
}

export function Section({ title, right, children }) {
  return (
    <section className="panel">
      <div className="flex items-center justify-between border-b border-hair/[0.07] px-5 py-3.5">
        <h2 className="font-head text-[15px] font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

/* One task row — shared by Today, Tasks, Meetings and Calendar. */
export function TaskRow({ t, ws, showBiz = true, showMeeting = true }) {
  const { sel, actions: a } = ws
  const today = iso(new Date())
  const done = t?.status === 'done'
  const biz = sel.bizMap[t?.bizId]
  const dept = t?.deptId ? sel.deptOf(t.bizId, t.deptId) : null
  const team = sel.ownerOf(t) === 'team'
  const overdue = !done && t?.due && t.due < today
  const meeting = t?.meetingId ? sel.allMeetings.find((m) => m.id === t.meetingId) : null
  const subs = Array.isArray(t?.subtasks) ? t.subtasks.filter(Boolean) : []
  const subsDone = subs.filter((x) => x.done).length
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const allSubsDone = subs.length > 0 && subsDone === subs.length
  return (
    <div className="group border-b border-hair/[0.06] px-5 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <Checkbox checked={done} onClick={() => a.toggleTask(t.id)} />
        <div className="min-w-0 flex-1">
          <div className={cn('text-[14px] leading-snug', done && 'text-mute2 line-through')} style={{ textWrap: 'pretty' }}>
            {t?.title || 'N/A'}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {showBiz && <BizChip biz={biz} />}
            {team ? (
              <span className="rounded-md bg-yellow/[0.12] px-2 py-0.5 text-[11px] font-medium text-yellow">
                Waiting on {dept?.name || 'team'}
              </span>
            ) : (
              <span className="rounded-md bg-hair/[0.06] px-2 py-0.5 text-[11px] font-medium text-mute">
                {dept ? dept.name : 'Personal'}
              </span>
            )}
            {showMeeting && meeting && (
              <button
                type="button"
                onClick={() => a.openMeeting(meeting.id)}
                className="rounded-md bg-teal/[0.08] px-2 py-0.5 text-[11px] font-medium text-teal hover:bg-teal/[0.14]"
              >
                ↳ {meeting.title || 'Meeting'}
              </button>
            )}
            {subs.length > 0 ? (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium',
                  allSubsDone ? 'bg-green/[0.1] text-green' : 'bg-hair/[0.06] text-soft hover:bg-hair/[0.1]',
                )}
              >
                <span className="relative h-1.5 w-8 overflow-hidden rounded-full bg-hair/[0.12]">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-green" style={{ width: (subsDone / subs.length) * 100 + '%' }} />
                </span>
                {subsDone}/{subs.length} subtasks {open ? '▴' : '▾'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setOpen(true); setAdding(true) }}
                className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-mute2 opacity-0 transition-opacity hover:text-teal focus:opacity-100 group-hover:opacity-100"
              >
                + Subtask
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <input
            type="date"
            value={t?.due || ''}
            onChange={(e) => a.patchTask(t.id, { due: e.target.value })}
            title={t?.due ? pretty(t.due) : 'Set due date'}
            className={cn(
              'rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[12px] outline-none hover:border-hair/[0.14] focus:border-teal/60',
              overdue ? 'font-semibold text-pink' : 'text-mute',
            )}
          />
          <button
            type="button"
            onClick={() => a.removeTask(t.id)}
            aria-label="Delete task"
            className="px-1 text-[16px] leading-none text-mute2 opacity-0 transition-opacity hover:text-fg group-hover:opacity-100 focus:opacity-100"
          >
            ×
          </button>
        </div>
      </div>

      {open && (
        <div className="ml-[30px] mt-2.5 border-l-2 border-hair/[0.08] pl-3">
          {subs.map((x) => (
            <div key={x.id} className="group/sub flex items-center gap-2.5 py-1">
              <button
                type="button"
                onClick={() => a.toggleSubtask(t.id, x.id)}
                aria-label={x.done ? 'Mark subtask not done' : 'Mark subtask done'}
                className={cn(
                  'flex h-4 w-4 flex-none items-center justify-center rounded border-[1.5px] text-[9px] font-bold text-onaccent',
                  x.done ? 'border-green bg-green' : 'border-[var(--box-border)] hover:border-teal',
                )}
              >
                {x.done ? '✓' : ''}
              </button>
              <input
                className={cn('min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[13px] outline-none hover:border-hair/[0.12] focus:border-teal/60', x.done && 'text-mute2 line-through')}
                value={x.title}
                aria-label="Subtask"
                onChange={(e) => a.renameSubtask(t.id, x.id, e.target.value)}
                onBlur={(e) => { if (!e.target.value.trim()) a.removeSubtask(t.id, x.id) }}
              />
              <button
                type="button"
                onClick={() => a.removeSubtask(t.id, x.id)}
                aria-label="Delete subtask"
                className="px-1 text-[14px] leading-none text-mute2 opacity-0 transition-opacity hover:text-fg focus:opacity-100 group-hover/sub:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
          {adding || subs.length === 0 ? (
            <SubtaskInput onAdd={(v) => a.addSubtask(t.id, v)} onDone={() => { setAdding(false); if (!subs.length) setOpen(false) }} />
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="mt-1 text-[12px] font-medium text-teal hover:text-teal-lt">+ Add subtask</button>
          )}
          {allSubsDone && !done && (
            <button type="button" onClick={() => a.toggleTask(t.id)} className="mt-1.5 block text-[12px] font-medium text-green hover:underline">
              All subtasks done. Mark the task complete?
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* Type a subtask, Enter adds it and keeps the box open for the next one; Esc or an empty blur closes it. */
function SubtaskInput({ onAdd, onDone }) {
  const [v, setV] = useState('')
  return (
    <input
      autoFocus
      className="mt-1 w-full rounded-md border border-hair/[0.14] bg-ink px-2 py-1 text-[13px] outline-none focus:border-teal/60"
      placeholder="Add a subtask and press Enter"
      aria-label="New subtask"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); if (v.trim()) { onAdd(v); setV('') } else onDone() }
        if (e.key === 'Escape') onDone()
      }}
      onBlur={() => { if (v.trim()) onAdd(v); onDone() }}
    />
  )
}

/* Compact task creator. `bizId` pins the business (e.g. inside a meeting). */
export function TaskAdder({ ws, bizId: fixedBiz, meetingId = '', placeholder = 'Add a task…', defaultDue = '' }) {
  const { state: s, sel, actions: a } = ws
  const firstBiz = sel.businesses[0]?.id || ''
  const scoped = fixedBiz || (s.bizId !== 'all' ? s.bizId : '')
  const [title, setTitle] = useState('')
  const [biz, setBiz] = useState(scoped || firstBiz)
  const [deptId, setDeptId] = useState('')
  const [due, setDue] = useState(defaultDue)
  const activeBiz = scoped || biz
  const depts = sel.bizMap[activeBiz]?.departments || []

  const submit = () => {
    if (!title.trim()) return
    a.addTask({ title, bizId: activeBiz, deptId, due, meetingId })
    setTitle('')
    setDue(defaultDue)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3.5">
      <input
        className="field min-w-[220px] flex-1"
        placeholder={placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
      />
      {!scoped && (
        <select
          className="select w-auto min-w-[150px]"
          value={biz}
          onChange={(e) => { setBiz(e.target.value); setDeptId('') }}
        >
          {sel.businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <select className="select w-auto min-w-[150px]" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
        <option value="">Personal (me)</option>
        {depts.map((d) => <option key={d.id} value={d.id}>{d.name}{d.mine ? '' : ' · team'}</option>)}
      </select>
      <input type="date" className="field w-auto" value={due} onChange={(e) => setDue(e.target.value)} />
      <button type="button" onClick={submit} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">
        Add
      </button>
    </div>
  )
}
