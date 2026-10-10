import { cn, fmt, iso, pretty } from '../lib/helpers'
import { MONTH_NAMES, DOW } from '../lib/constants'
import { PageHeader, Section, TaskRow, BizChip, Empty } from './ui'

export default function CalendarPage({ ws }) {
  const { state: s, sel, actions: a } = ws
  const today = iso(new Date())

  const first = new Date(s.calY, s.calM, 1)
  const offset = (first.getDay() + 6) % 7 // Monday-first
  const dim = new Date(s.calY, s.calM + 1, 0).getDate()
  const prevDim = new Date(s.calY, s.calM, 0).getDate()

  const cells = []
  for (let i = 0; i < 42; i++) {
    const n = i - offset + 1
    let y = s.calY, mo = s.calM, d = n, out = false
    if (n < 1) { mo -= 1; d = prevDim + n; out = true; if (mo < 0) { mo = 11; y -= 1 } }
    else if (n > dim) { mo += 1; d = n - dim; out = true; if (mo > 11) { mo = 0; y += 1 } }
    const key = fmt(y, mo, d)
    const meetings = sel.meetings.filter((m) => m.date === key)
    const tasks = sel.tasks.filter((t) => t.due === key)
    cells.push({ key, d, out, meetings, tasks })
  }

  const dayMeetings = sel.meetings.filter((m) => m.date === s.calSel).sort((x, y) => (x.time || '').localeCompare(y.time || ''))
  const dayTasks = sel.tasks.filter((t) => t.due === s.calSel)

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Meetings and task deadlines together."
        right={
          <div className="flex items-center gap-2">
            <button type="button" onClick={a.goToday} className="rounded-lg border border-hair/[0.14] px-3 py-2 text-[12.5px] font-medium text-mute hover:text-fg">Today</button>
            <button type="button" onClick={() => a.shiftMonth(-1)} className="rounded-lg border border-hair/[0.14] px-3 py-2 text-[13px] text-mute hover:text-fg" aria-label="Previous month">‹</button>
            <div className="min-w-[150px] text-center font-head text-[15px] font-semibold">{MONTH_NAMES[s.calM]} {s.calY}</div>
            <button type="button" onClick={() => a.shiftMonth(1)} className="rounded-lg border border-hair/[0.14] px-3 py-2 text-[13px] text-mute hover:text-fg" aria-label="Next month">›</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <section className="panel min-w-0">
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-7 border-b border-hair/[0.07]">
                {DOW.map((d) => <div key={d} className="px-3 py-2.5 text-center text-[11.5px] font-medium text-mute2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((c) => {
                  const items = [
                    ...c.meetings.map((m) => ({ k: 'm' + m.id, label: (m.time ? m.time + ' ' : '') + (m.title || 'Meeting'), kind: 'meeting' })),
                    ...c.tasks.map((t) => ({ k: 't' + t.id, label: t.title || 'Task', kind: t.status === 'done' ? 'done' : 'task' })),
                  ]
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => a.selectDay(c.key)}
                      className={cn(
                        'min-h-[96px] border-b border-r border-hair/[0.05] p-2 text-left transition-colors hover:bg-hair/[0.03]',
                        s.calSel === c.key && 'bg-teal/[0.07]',
                      )}
                    >
                      <div
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium',
                          c.key === today ? 'bg-teal text-onaccent' : c.out ? 'text-[var(--cal-out)]' : 'text-soft',
                        )}
                      >
                        {c.d}
                      </div>
                      <div className="mt-1 flex flex-col gap-1">
                        {items.slice(0, 3).map((it) => (
                          <div
                            key={it.k}
                            className={cn(
                              'truncate rounded px-1.5 py-0.5 text-[10.5px] leading-[1.35]',
                              it.kind === 'meeting' && 'bg-teal/[0.12] text-teal',
                              it.kind === 'task' && 'bg-yellow/[0.14] text-yellow',
                              it.kind === 'done' && 'bg-hair/[0.06] text-mute2 line-through',
                            )}
                          >
                            {it.label}
                          </div>
                        ))}
                        {items.length > 3 && <div className="pl-1 text-[10.5px] text-mute2">+{items.length - 3} more</div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <Section
            title={pretty(s.calSel)}
            right={
              <button type="button" onClick={() => a.addMeeting({ bizId: s.bizId, date: s.calSel })} className="text-[12.5px] font-medium text-teal hover:text-teal-lt">
                + Meeting
              </button>
            }
          >
            {dayMeetings.length === 0 && dayTasks.length === 0 && <Empty>Nothing scheduled.</Empty>}
            {dayMeetings.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => a.openMeeting(m.id)}
                className="flex w-full items-start gap-3 border-b border-hair/[0.06] px-5 py-3 text-left hover:bg-hair/[0.03]"
              >
                <div className="w-[44px] flex-none pt-0.5 text-[12.5px] font-semibold text-teal">{m.time || '—'}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{m.title || 'Untitled meeting'}</div>
                  <div className="mt-1.5"><BizChip biz={sel.bizMap[m.bizId]} /></div>
                </div>
              </button>
            ))}
            {dayTasks.map((t) => <TaskRow key={t.id} t={t} ws={ws} showBiz={s.bizId === 'all'} />)}
          </Section>
        </div>
      </div>
    </div>
  )
}
