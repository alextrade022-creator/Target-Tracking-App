import { useState } from 'react'
import { cn, iso, pretty } from '../lib/helpers'
import { PageHeader, Section, TaskRow, TaskAdder, BizChip, Label, Empty } from './ui'

export default function Meetings({ ws }) {
  const { state: s, sel, actions: a } = ws
  const today = iso(new Date())
  const list = sel.meetings
  const upcoming = list.filter((m) => (m.date || '') >= today).sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))
  const past = list.filter((m) => (m.date || '') < today).sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time))
  const active = sel.allMeetings.find((m) => m.id === s.activeMeeting) || null

  return (
    <div>
      <PageHeader
        title="Meetings"
        subtitle="Capture notes, then turn the discussion into action items."
        right={
          <button
            type="button"
            onClick={() => a.addMeeting({ bizId: s.bizId })}
            className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt"
          >
            + New meeting
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-4">
          <MeetingGroup title="Upcoming" items={upcoming} ws={ws} activeId={s.activeMeeting} />
          <MeetingGroup title="Past" items={past} ws={ws} activeId={s.activeMeeting} />
          {list.length === 0 && <section className="panel"><Empty>No meetings yet. Create your first one.</Empty></section>}
        </div>

        {active ? <MeetingDetail key={active.id} m={active} ws={ws} /> : (
          <section className="panel"><Empty>Select a meeting, or create a new one.</Empty></section>
        )}
      </div>
    </div>
  )
}

function MeetingGroup({ title, items, ws, activeId }) {
  const { sel, actions: a } = ws
  const [confirmId, setConfirmId] = useState('')
  if (items.length === 0) return null
  return (
    <section className="panel">
      <div className="border-b border-hair/[0.07] px-4 py-2.5 text-[12px] font-semibold text-mute">{title}</div>
      {items.map((m) => {
        const openTasks = sel.allTasks.filter((t) => t.meetingId === m.id && t.status !== 'done').length
        return (
          <div
            key={m.id}
            className={cn('group relative border-b border-hair/[0.06] last:border-b-0', activeId === m.id && 'bg-teal/[0.07]')}
          >
            {confirmId === m.id ? (
              <ConfirmDelete m={m} ws={ws} onCancel={() => setConfirmId('')} compact />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => a.openMeeting(m.id)}
                  className="block w-full px-4 py-3 pr-11 text-left hover:bg-hair/[0.03]"
                >
                  <div className="truncate text-[13.5px] font-medium">{m.title || 'Untitled meeting'}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-mute">
                    <span>{m.date ? pretty(m.date) : 'N/A'}{m.time ? ' · ' + m.time : ''}</span>
                    {openTasks > 0 && <span className="font-medium text-yellow">{openTasks} open</span>}
                  </div>
                  <div className="mt-1.5"><BizChip biz={sel.bizMap[m.bizId]} /></div>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(m.id)}
                  aria-label={`Delete ${m.title || 'meeting'}`}
                  title="Delete meeting"
                  className="absolute right-2.5 top-2.5 rounded-md p-1.5 text-mute2 opacity-60 transition hover:bg-pink/[0.08] hover:text-pink focus:opacity-100 group-hover:opacity-100"
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </div>
        )
      })}
    </section>
  )
}

function MeetingDetail({ m, ws }) {
  const { sel, actions: a } = ws
  const [confirming, setConfirming] = useState(false)
  const patch = (p) => a.patchMeeting(m.id, p)
  const tasks = sel.allTasks.filter((t) => t.meetingId === m.id)
    .sort((x, y) => (x.status === 'done') - (y.status === 'done') || (x.createdAt || 0) - (y.createdAt || 0))

  return (
    <div className="flex flex-col gap-5">
      <section className="panel p-5">
        <div className="flex items-start gap-3">
          <input
            className="min-w-0 flex-1 bg-transparent font-head text-[22px] font-bold tracking-[-0.01em] outline-none placeholder:text-mute2"
            placeholder="Meeting title"
            value={m.title || ''}
            onChange={(e) => patch({ title: e.target.value })}
          />
          {!confirming && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex flex-none items-center gap-1.5 rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[12.5px] font-medium text-mute hover:border-pink/50 hover:bg-pink/[0.06] hover:text-pink"
            >
              <TrashIcon /> Delete
            </button>
          )}
        </div>
        {confirming && <div className="mt-3"><ConfirmDelete m={m} ws={ws} onCancel={() => setConfirming(false)} /></div>}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <Label>Business</Label>
            <select className="select" value={m.bizId} onChange={(e) => patch({ bizId: e.target.value })}>
              {sel.businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Date</Label>
            <input type="date" className="field" value={m.date || ''} onChange={(e) => patch({ date: e.target.value })} />
          </div>
          <div>
            <Label>Time</Label>
            <input type="time" className="field" value={m.time || ''} onChange={(e) => patch({ time: e.target.value })} />
          </div>
          <div>
            <Label>Attendees</Label>
            <input className="field" placeholder="Names, teams…" value={m.attendees || ''} onChange={(e) => patch({ attendees: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextBox label="Agenda" value={m.agenda} onChange={(v) => patch({ agenda: v })} />
          <TextBox label="Decisions" value={m.decisions} onChange={(v) => patch({ decisions: v })} />
        </div>
        <div className="mt-3">
          <TextBox label="Notes" value={m.notes} onChange={(v) => patch({ notes: v })} rows={6} />
        </div>
      </section>

      <Section title="Action items" right={<span className="text-[12px] text-mute2">{tasks.filter((t) => t.status !== 'done').length} open</span>}>
        <div className="border-b border-hair/[0.07]">
          <TaskAdder ws={ws} bizId={m.bizId} meetingId={m.id} placeholder="Add an action item from this meeting…" />
        </div>
        {tasks.length === 0 && <Empty>No action items yet.</Empty>}
        {tasks.map((t) => <TaskRow key={t.id} t={t} ws={ws} showBiz={false} showMeeting={false} />)}
      </Section>
    </div>
  )
}

function TextBox({ label, value, onChange, rows = 4 }) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        className="field resize-y leading-[1.55]"
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/* Inline "are you sure?" — offers to keep or delete the meeting's action items. */
function ConfirmDelete({ m, ws, onCancel, compact = false }) {
  const { sel, actions: a } = ws
  const linked = sel.allTasks.filter((t) => t.meetingId === m.id).length
  const btn = 'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold'
  return (
    <div role="alertdialog" aria-label="Delete meeting" className={cn('rounded-xl bg-pink/[0.07] text-[13px]', compact ? 'm-2 px-3 py-2.5' : 'px-4 py-3')}>
      <div className="font-medium">Delete “{m.title || 'Untitled meeting'}”?</div>
      <div className="mt-0.5 text-[12px] text-mute">
        {linked ? `It has ${linked} action item${linked === 1 ? '' : 's'}.` : 'This can\'t be undone.'}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {linked > 0 && (
          <button type="button" onClick={() => a.removeMeeting(m.id)} className={cn(btn, 'border border-pink/40 text-pink hover:bg-pink/[0.08]')}>
            Delete, keep action items
          </button>
        )}
        <button type="button" autoFocus onClick={() => a.removeMeeting(m.id, { withTasks: true })} className={cn(btn, 'bg-pink text-onaccent hover:opacity-90')}>
          {linked ? 'Delete everything' : 'Delete'}
        </button>
        <button type="button" onClick={onCancel} className={cn(btn, 'font-medium text-mute hover:text-fg')}>Cancel</button>
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  )
}
