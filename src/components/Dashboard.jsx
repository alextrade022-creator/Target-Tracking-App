import { cn } from '../lib/helpers'
import { Bar, TickBox, GoalSelect, MonthSelect, WeekSelect } from './ui'

export default function Dashboard({ vals, actions }) {
  const { goals, months, weeks, draft } = vals

  return (
    <div>
      {/* Goal cards */}
      <div className="mt-7 grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))' }}>
        {goals.map((g) => (
          <div key={g.k} className="stat relative overflow-hidden px-4 pb-3.5 pt-4">
            <div className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ background: g.color }} />
            <div className="text-[17px] font-semibold tracking-[-0.01em]">{g.name}</div>
            <div className="mt-1.5 min-h-[34px] text-[13px] text-mute" style={{ textWrap: 'pretty' }}>{g.target}</div>
            <div className="mono mt-0.5 text-[11px] tracking-[0.06em] text-mute2">DUE {g.due}</div>
            <div className="mt-3 flex items-center gap-2">
              <Bar className="flex-1" pct={g.pct} color={g.color} />
              <div className="mono text-[12px] text-mute3">{g.ratio}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick add */}
      <div className="mt-[22px] flex flex-wrap items-center gap-3 rounded-2xl border border-hair/[0.08] bg-surface px-[18px] py-3.5">
        <div className="mono whitespace-nowrap text-[11px] tracking-[0.16em] text-mute2">QUICK ADD</div>
        <GoalSelect
          className="min-w-[170px] flex-none"
          value={draft.goal}
          options={vals.goalOptions}
          onChange={(e) => actions.setDraft({ goal: e.target.value })}
        />
        <MonthSelect
          className="min-w-[150px] flex-none"
          value={String(draft.month)}
          onChange={(e) => actions.setDraft({ month: Number(e.target.value) })}
        />
        <WeekSelect
          className="min-w-[170px] flex-none"
          value={draft.week}
          onChange={(e) => actions.setDraft({ week: e.target.value })}
        />
        <input
          className="field min-w-[260px] flex-1"
          value={draft.text}
          placeholder="What needs to happen?"
          onChange={(e) => actions.setDraft({ text: e.target.value })}
        />
        <button
          type="button"
          onClick={actions.addTask}
          className="whitespace-nowrap rounded-lg bg-teal px-5 py-[9px] text-[13px] font-bold text-onaccent"
        >
          + Add task
        </button>
      </div>

      {/* Monthly roadmap */}
      <div className="panel mt-[22px]">
        <div className="flex items-center justify-between border-b border-hair/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-semibold tracking-[-0.01em]">Monthly roadmap</div>
          <div className="mono text-[11px] tracking-[0.14em] text-mute2">CLICK A MONTH TO SEE ITS WEEKLY PLAN</div>
        </div>

        {/* Horizontal scroll on small screens keeps the 8-column grid aligned */}
        <div className="overflow-x-auto">
        <div className="min-w-[860px]">
        {/* Month header row */}
        <div className="grid border-b border-hair/[0.08] bg-hair/[0.02]" style={{ gridTemplateColumns: '212px repeat(7,1fr)' }}>
          <div className="mono px-[18px] py-3 text-[11px] tracking-[0.16em] text-mute2">TARGET</div>
          {months.map((m, i) => (
            <div
              key={i}
              onClick={m.select}
              className="cursor-pointer border-l border-hair/[0.07] px-3 py-2.5"
              style={{ background: m.selected ? 'rgba(78,205,196,.10)' : m.current ? 'rgba(244,211,94,.06)' : 'transparent' }}
            >
              <div className="flex items-center gap-1.5">
                <div className="text-[15px] font-semibold" style={{ color: m.selected ? '#4ECDC4' : 'var(--soft)' }}>{m.label}</div>
                <div className="mono text-[11px] text-mute2">'{m.yr}</div>
                {m.current && (
                  <div className="mono rounded bg-yellow px-[5px] py-px text-[9px] tracking-[0.1em] text-onaccent">NOW</div>
                )}
              </div>
              <div className="mt-[7px] flex items-center gap-[7px]">
                <Bar className="flex-1" pct={m.pct} color="#4ECDC4" height={4} />
                <div className="mono text-[10px] text-slate">{m.ratio}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Goal rows */}
        {goals.map((g) => (
          <div key={g.k} className="grid border-b border-hair/[0.06]" style={{ gridTemplateColumns: '212px repeat(7,1fr)' }}>
            <div className="flex items-start gap-2.5 px-[18px] py-3.5">
              <div className="mt-1.5 h-2 w-2 flex-none rounded-sm" style={{ background: g.color }} />
              <div>
                <div className="text-[14px] font-semibold">{g.name}</div>
                <div className="mono mt-[3px] text-[10.5px] text-mute2">{g.short}</div>
              </div>
            </div>
            {g.cells.map((cell, ci) => (
              <div
                key={ci}
                className="flex min-h-[74px] flex-col gap-1.5 border-l border-hair/[0.06] p-[9px]"
                style={{ background: cell.current ? 'rgba(244,211,94,.055)' : 'transparent' }}
              >
                {cell.ms.map((ms) => (
                  <div
                    key={ms.id}
                    onClick={ms.toggle}
                    className="flex cursor-pointer items-start gap-[7px] rounded-lg px-2 py-[7px]"
                    style={{ background: ms.chipBg, border: '1px solid ' + ms.chipBorder }}
                  >
                    <TickBox item={ms} size={13} />
                    <div
                      className={cn('text-[11.5px] leading-[1.32]', ms.strike && 'line-through')}
                      style={{ color: ms.textColor, textWrap: 'pretty' }}
                    >
                      {ms.t}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        </div>
        </div>
      </div>

      {/* Weekly plan */}
      {vals.showWeekly && (
        <div className="panel mt-[34px]">
          <div className="flex items-center justify-between border-b border-hair/[0.08] px-[22px] py-[18px]">
            <div className="flex items-baseline gap-3">
              <div className="text-[19px] font-semibold tracking-[-0.01em]">Weekly plan</div>
              <div className="mono text-[12px] tracking-[0.14em] text-yellow">{vals.selMonthLabel}</div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="mono text-[12px] text-mute">{vals.weekRatio} actions done</div>
              <Bar className="w-[150px]" pct={vals.weekPct} color="#4ECDC4" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {weeks.map((w, wi) => (
              <div key={wi} className="border-t border-hair/[0.06] px-4 pb-5 pt-4 sm:border-l xl:border-t-0">
                <div className="flex items-baseline justify-between">
                  <div className="mono text-[12px] tracking-[0.14em] text-mute3">{w.label}</div>
                  <div className="mono text-[11px] text-mute2">{w.ratio}</div>
                </div>
                <Bar className="my-[9px]" pct={w.pct} color="#7BC96F" height={3} />
                <div className="flex flex-col gap-2">
                  {w.tasks.map((t) => (
                    <div key={t.id} onClick={t.toggle} className="flex cursor-pointer items-start gap-2">
                      <TickBox item={t} size={14} />
                      <div
                        className={cn('text-[12.5px] leading-[1.4]', t.strike && 'line-through')}
                        style={{ color: t.textColor, textWrap: 'pretty' }}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend + reset */}
      <div className="mt-[26px] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-[22px]">
          <Legend swatch={<span className="h-[13px] w-[13px] rounded bg-teal" />} label="Completed" />
          <Legend swatch={<span className="box-border h-[13px] w-[13px] rounded border-[1.5px] border-[var(--box-border)]" />} label="Pending" />
          <Legend swatch={<span className="box-border h-[13px] w-[13px] rounded border border-yellow/50 bg-yellow/[0.16]" />} label="Current month" />
          <div className="text-[12.5px] text-mute2">Deadlines: EduDot 31 Dec 26 · School 31 Jan 27 · all others 31 Mar 27</div>
        </div>
        <button
          type="button"
          onClick={actions.resetProgress}
          className="mono rounded-lg border border-hair/[0.14] px-4 py-[9px] text-[11px] tracking-[0.12em] text-mute"
        >
          RESET PROGRESS
        </button>
      </div>
    </div>
  )
}

function Legend({ swatch, label }) {
  return (
    <div className="flex items-center gap-2">
      {swatch}
      <div className="text-[12.5px] text-mute">{label}</div>
    </div>
  )
}
