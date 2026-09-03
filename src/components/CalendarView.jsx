import { cn } from '../lib/helpers'

export default function CalendarView({ vals, actions }) {
  const { calDays, dayMeetings, dayTodos, upcoming, mdraft } = vals
  const setM = actions.setM

  return (
    <div className="mt-7 grid items-start gap-[22px] xl:grid-cols-[1fr_400px]">
      {/* Calendar */}
      <div className="panel min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair/[0.08] px-5 py-4">
          <div className="flex items-center gap-3">
            <NavBtn onClick={() => actions.shiftMonth(-1)}>‹</NavBtn>
            <div className="min-w-[190px] text-center text-[20px] font-semibold tracking-[-0.01em]">{vals.calLabel}</div>
            <NavBtn onClick={() => actions.shiftMonth(1)}>›</NavBtn>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Key color="#F4D35E" label="Meeting pending" />
            <Key color="#7BC96F" label="Done" />
            <Key color="#FF6B8A" label="Cancelled" />
            <Key color="#FF8A3D" label="Todo deadline" />
          </div>
        </div>

        <div className="overflow-x-auto">
        <div className="min-w-[600px]">
        <div className="grid grid-cols-7 border-b border-hair/[0.08] bg-hair/[0.02]">
          {vals.dow.map((d) => (
            <div key={d} className="mono px-3 py-2.5 text-center text-[10.5px] tracking-[0.16em] text-mute2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calDays.map((d, i) => (
            <div
              key={i}
              onClick={d.select}
              className="min-h-[112px] cursor-pointer border-b border-r border-hair/[0.05] p-2"
              style={{ background: d.bg }}
            >
              <div
                className="flex h-[23px] w-[23px] items-center justify-center rounded-md text-[12.5px] font-semibold"
                style={{ color: d.numColor, background: d.numBg }}
              >
                {d.num}
              </div>
              <div className="mt-1.5 flex flex-col gap-1">
                {d.items.map((it, j) => (
                  <div
                    key={j}
                    className={cn('overflow-hidden text-ellipsis whitespace-nowrap rounded px-1.5 py-[3px] text-[10.5px] leading-[1.3]', it.strike && 'line-through')}
                    style={{ color: it.color, background: it.bg }}
                  >
                    {it.label}
                  </div>
                ))}
                {d.more && <div className="pl-1 text-[10px] text-mute2">{d.more}</div>}
              </div>
            </div>
          ))}
        </div>
        </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-[22px]">
        {/* Schedule a meeting */}
        <div className="panel">
          <div className="border-b border-hair/[0.08] px-5 py-4 text-[17px] font-semibold">Schedule a meeting</div>
          <div className="flex flex-col gap-3 px-5 py-[18px]">
            <input className="field" value={mdraft.title} placeholder="Meeting title" onChange={(e) => setM({ title: e.target.value })} />
            <input className="field" value={mdraft.who} placeholder="With whom" onChange={(e) => setM({ who: e.target.value })} />
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 118px' }}>
              <input type="date" className="field" value={mdraft.date} onChange={(e) => setM({ date: e.target.value })} />
              <input type="time" className="field" value={mdraft.time} onChange={(e) => setM({ time: e.target.value })} />
            </div>
            <input className="field" value={mdraft.notes} placeholder="Agenda / notes (optional)" onChange={(e) => setM({ notes: e.target.value })} />
            <button type="button" onClick={actions.addMeeting} className="rounded-lg bg-teal py-3 text-center text-[14px] font-bold text-onaccent">
              + Add to calendar
            </button>
          </div>
        </div>

        {/* Selected day */}
        <div className="panel">
          <div className="flex items-baseline justify-between border-b border-hair/[0.08] px-5 py-4">
            <div className="text-[17px] font-semibold">{vals.selDayLabel}</div>
            <div className="mono text-[10.5px] tracking-[0.14em] text-mute2">SELECTED DAY</div>
          </div>
          <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
            {dayMeetings.map((m) => (
              <div key={m.id} className="rounded-[11px] border border-hair/[0.07] bg-hair/[0.04] px-3.5 py-[13px]">
                <div className="flex items-start justify-between gap-2.5">
                  <div className={cn('text-[14px] font-semibold leading-[1.35]', m.strike && 'line-through')} style={{ textWrap: 'pretty' }}>
                    {m.time} · {m.title}
                  </div>
                  <div onClick={m.remove} className="cursor-pointer text-[16px] leading-none text-mute2">×</div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-[7px]">
                  <span className="mono rounded-md bg-hair/[0.07] px-2 py-1 text-[10px] tracking-[0.08em] text-soft">👤 {m.who}</span>
                  <span className="mono rounded-md px-2 py-1 text-[10px] tracking-[0.08em]" style={{ color: m.statusColor, background: m.statusBg }}>{m.statusLabel}</span>
                </div>
                {m.hasNotes && <div className="mt-2 text-[12.5px] leading-[1.5] text-mute" style={{ textWrap: 'pretty' }}>{m.notes}</div>}
                <div className="mt-[11px] flex gap-[7px]">
                  <StatusBtn color="#7BC96F" onClick={m.setDone}>Done</StatusBtn>
                  <StatusBtn color="#F4D35E" onClick={m.setPending}>Pending</StatusBtn>
                  <StatusBtn color="#FF6B8A" onClick={m.setCancel}>Cancel</StatusBtn>
                </div>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="mono whitespace-nowrap text-[10px] tracking-[0.12em] text-mute2">POSTPONE TO</div>
                  <input
                    type="date"
                    className="field min-w-0 flex-1 px-2.5 py-[7px] text-[12.5px] text-soft"
                    value={m.date}
                    onChange={m.postpone}
                  />
                </div>
              </div>
            ))}
            {vals.dayMeetingsEmpty && (
              <div className="text-[13px] text-mute2">No meetings on this day. Add one above — it schedules straight into the calendar.</div>
            )}

            {vals.dayTodosShow && (
              <div className="flex flex-col gap-2 border-t border-hair/[0.07] pt-1.5">
                <div className="mono mt-2 text-[10.5px] tracking-[0.14em] text-mute2">TODOS DUE TODAY</div>
                {dayTodos.map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-2.5 rounded-lg bg-hair/[0.035] px-3 py-2.5">
                    <div className="text-[13px] text-soft" style={{ textWrap: 'pretty' }}>{t.title}</div>
                    <div className="mono whitespace-nowrap text-[10px] tracking-[0.08em]" style={{ color: t.statusColor }}>{t.statusLabel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming */}
        {vals.upcomingShow && (
          <div className="panel">
            <div className="border-b border-hair/[0.08] px-5 py-4 text-[17px] font-semibold">Upcoming meetings</div>
            <div className="flex flex-col gap-2.5 px-5 pb-[18px] pt-3.5">
              {upcoming.map((u, i) => (
                <div key={i} onClick={u.go} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-hair/[0.035] px-3 py-2.5">
                  <div>
                    <div className="text-[13.5px] text-soft" style={{ textWrap: 'pretty' }}>{u.title}</div>
                    <div className="mono mt-[3px] text-[10.5px] text-slate">{u.who}</div>
                  </div>
                  <div className="mono whitespace-nowrap text-[11px] text-yellow">{u.when}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NavBtn({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-hair/[0.14] text-[15px] text-mute3"
    >
      {children}
    </button>
  )
}

function Key({ color, label }) {
  return (
    <div className="flex items-center gap-[7px]">
      <div className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      <div className="text-[12px] text-mute">{label}</div>
    </div>
  )
}

function StatusBtn({ color, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-md py-1.5 text-center text-[11.5px]"
      style={{ border: '1px solid ' + color + '99', color }}
    >
      {children}
    </button>
  )
}
