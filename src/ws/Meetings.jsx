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
  if (items.length === 0) return null
  return (
    <section className="panel">
      <div className="border-b border-hair/[0.07] px-4 py-2.5 text-[12px] font-semibold text-mute">{title}</div>
      {items.map((m) => {
        const openTasks = sel.allTasks.filter((t) => t.meetingId === m.id && t.status !== 'done').length
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => a.openMeeting(m.id)}
            className={cn(
              'block w-full border-b border-hair/[0.06] px-4 py-3 text-left last:border-b-0 hover:bg-hair/[0.03]',
              activeId === m.id && 'bg-teal/[0.07]',
            )}
          >
            <div className="truncate text-[13.5px] font-medium">{m.title || 'Untitled meeting'}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-mute">
              <span>{m.date ? pretty(m.date) : 'N/A'}{m.time ? ' · ' + m.time : ''}</span>
              {openTasks > 0 && <span className="font-medium text-yellow">{openTasks} open</span>}
            </div>
            <div className="mt-1.5"><BizChip biz={sel.bizMap[m.bizId]} /></div>
          </button>
        )
      })}
    </section>
  )
}

function MeetingDetail({ m, ws }) {
  const { sel, actions: a } = ws
  const patch = (p) => a.patchMeeting(m.id, p)
  const tasks = sel.allTasks.filter((t) => t.meetingId === m.id)
    .sort((x, y) => (x.status === 'done') - (y.status === 'done') || (x.createdAt || 0) - (y.createdAt || 0))

  return (
    <div className="flex flex-col gap-5">
      <section className="panel p-5">
        <input
          className="w-full bg-transparent font-head text-[22px] font-bold tracking-[-0.01em] outline-none placeholder:text-mute2"
          placeholder="Meeting title"
          value={m.title || ''}
          onChange={(e) => patch({ title: e.target.value })}
        />
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
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => { if (window.confirm('Delete this meeting? Its action items are kept.')) a.removeMeeting(m.id) }}
            className="text-[12.5px] font-medium text-mute hover:text-pink"
          >
            Delete meeting
          </button>
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
