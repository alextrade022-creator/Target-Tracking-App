import { cn } from '../lib/helpers'
import { PALETTE } from '../lib/constants'
import { TickBox, GoalSelect, MonthSelect, WeekSelect } from './ui'

export default function Notes({ vals, actions }) {
  const { draft, gdraft, customList, editRows, filters, msRows, wkRows } = vals

  return (
    <div className="mt-7 grid grid-cols-2 items-start gap-[22px]">
      {/* Add a new task */}
      <div className="panel">
        <div className="border-b border-white/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-semibold tracking-[-0.01em]">Add a new task</div>
          <div className="mt-1 text-[13px] text-mute">
            Pick the company and the month. Choose a week to make it a weekly action, or leave it as a monthly milestone —
            either way it lands on the dashboard straight away.
          </div>
        </div>
        <div className="flex flex-col gap-4 p-[22px]">
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="COMPANY / TARGET">
              <GoalSelect value={draft.goal} options={vals.goalOptions} onChange={(e) => actions.setDraft({ goal: e.target.value })} />
            </Field>
            <Field label="MONTH">
              <MonthSelect value={String(draft.month)} onChange={(e) => actions.setDraft({ month: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="PLACE IT IN">
            <WeekSelect value={draft.week} onChange={(e) => actions.setDraft({ week: e.target.value })} />
          </Field>
          <Field label="TASK">
            <input className="field" value={draft.text} placeholder="e.g. Visit Kozhikode site with contractor" onChange={(e) => actions.setDraft({ text: e.target.value })} />
          </Field>
          <div className="flex items-center gap-3.5">
            <button type="button" onClick={actions.addTask} className="rounded-lg bg-teal px-[26px] py-3 text-[14px] font-bold text-ink">
              + Add to dashboard
            </button>
            <div className="text-[12.5px] text-slate">{vals.addHint}</div>
          </div>
        </div>
      </div>

      {/* Tasks you added */}
      <div className="panel">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-semibold tracking-[-0.01em]">Tasks you added</div>
          <div className="mono text-[11px] tracking-[0.14em] text-mute2">{vals.customCount}</div>
        </div>
        <div className="flex min-h-[120px] flex-col gap-2.5 px-[22px] pb-[22px] pt-3.5">
          {customList.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-[10px] border border-white/[0.07] bg-white/[0.04] px-3.5 py-3">
              <div className="mt-0.5">
                <TickBox item={c} size={15} onClick={c.toggle} />
              </div>
              <div className="flex-1">
                <div className={cn('text-[13.5px] leading-[1.35]', c.strike && 'line-through')} style={{ color: c.textColor, textWrap: 'pretty' }}>
                  {c.text}
                </div>
                <div className="mt-[7px] flex flex-wrap gap-[7px]">
                  <span className="mono rounded-md bg-white/[0.06] px-2 py-[3px] text-[10px] tracking-[0.1em]" style={{ color: c.color }}>{c.goalName}</span>
                  <span className="mono rounded-md bg-white/[0.06] px-2 py-[3px] text-[10px] tracking-[0.1em] text-mute3">{c.where}</span>
                </div>
              </div>
              <div onClick={c.remove} className="cursor-pointer px-1 py-0.5 text-[16px] leading-none text-mute2">×</div>
            </div>
          ))}
          {vals.customEmpty && (
            <div className="text-[13px] text-mute2">Nothing added yet — new tasks will show up here and on the dashboard.</div>
          )}
        </div>
      </div>

      {/* Add a new target */}
      <div className="panel col-span-full">
        <div className="border-b border-white/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-semibold tracking-[-0.01em]">Add a new target</div>
          <div className="mt-1 text-[13px] text-mute">
            A new business or goal — it gets its own card, its own row in the monthly roadmap, and appears in every task dropdown.
          </div>
        </div>
        <div className="grid items-end gap-3.5 px-[22px] py-5" style={{ gridTemplateColumns: '1fr 1.5fr 160px auto auto' }}>
          <Field label="TARGET NAME">
            <input className="field" value={gdraft.name} placeholder="e.g. EduDot Online" onChange={(e) => actions.setG({ name: e.target.value })} />
          </Field>
          <Field label="GOAL">
            <input className="field" value={gdraft.target} placeholder="e.g. 3 online cohorts launched" onChange={(e) => actions.setG({ target: e.target.value })} />
          </Field>
          <Field label="DEADLINE">
            <input type="date" className="field [color-scheme:dark]" value={gdraft.due} onChange={(e) => actions.setG({ due: e.target.value })} />
          </Field>
          <Field label="COLOUR">
            <div className="flex h-[38px] items-center gap-2">
              {PALETTE.map((c) => {
                const on = gdraft.color === c
                return (
                  <div
                    key={c}
                    onClick={() => actions.setG({ color: c })}
                    className="cursor-pointer rounded-full"
                    style={{ background: c, width: on ? 26 : 20, height: on ? 26 : 20, border: on ? '2px solid #E8EDF3' : '1px solid rgba(255,255,255,.18)' }}
                  />
                )
              })}
            </div>
          </Field>
          <button type="button" onClick={actions.addGoal} className="whitespace-nowrap rounded-lg bg-teal px-6 py-3 text-[14px] font-bold text-ink">
            + Add target
          </button>
        </div>

        <div className="mono border-t border-white/[0.08] px-[22px] pb-2 pt-[18px] text-[11px] tracking-[0.16em] text-mute2">
          EDIT EXISTING TARGETS
        </div>
        <div className="flex flex-col gap-2.5 px-[22px] pb-[22px]">
          {editRows.map((g) => (
            <div
              key={g.k}
              className="grid items-center gap-3 rounded-[10px] border border-white/[0.07] bg-white/[0.035] px-3.5 py-[11px]"
              style={{ gridTemplateColumns: '1fr 1.5fr 150px auto auto auto' }}
            >
              <input className="field border-white/10 px-[11px] py-[9px] text-[13.5px] font-semibold" value={g.name} onChange={(e) => actions.editGoal(g.k, { name: e.target.value })} />
              <input className="field border-white/10 px-[11px] py-[9px] text-[13px] text-mute3" value={g.targetText} onChange={(e) => actions.editGoal(g.k, { target: e.target.value })} />
              <input type="date" className="field border-white/10 px-2.5 py-2 text-[13px] text-mute3 [color-scheme:dark]" value={g.dueIso} onChange={(e) => actions.editGoal(g.k, { due: e.target.value })} />
              <div className="flex items-center gap-1.5">
                {PALETTE.map((c) => (
                  <div
                    key={c}
                    onClick={() => actions.editGoal(g.k, { color: c })}
                    className="h-[17px] w-[17px] cursor-pointer rounded-full"
                    style={{ background: c, border: g.color === c ? '2px solid #E8EDF3' : '1px solid rgba(255,255,255,.18)' }}
                  />
                ))}
              </div>
              <div className="mono whitespace-nowrap text-[9.5px] tracking-[0.1em] text-mute2">{g.origin}</div>
              {g.showRemove ? (
                <div onClick={() => actions.removeGoal(g.k)} className="cursor-pointer px-0.5 text-[16px] leading-none text-mute2">×</div>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="col-span-full flex flex-wrap items-center gap-2.5">
        <div className="mono text-[11px] tracking-[0.16em] text-mute2">FILTER</div>
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={f.select}
            className={cn(
              'rounded-lg border px-[15px] py-[7px] text-[12.5px] font-medium',
              f.on ? 'border-teal bg-teal text-ink' : 'border-white/[0.14] bg-transparent text-mute',
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        {vals.restoreShow && (
          <button type="button" onClick={actions.restoreAll} className="mono rounded-lg border border-white/[0.14] px-3.5 py-[7px] text-[10.5px] tracking-[0.12em] text-mute">
            {vals.restoreLabel}
          </button>
        )}
      </div>

      {/* Monthly milestones */}
      <ItemList title="Monthly milestones" count={vals.msCount} rows={msRows} actions={actions} />
      {/* Weekly actions */}
      <ItemList title="Weekly actions" count={vals.wkCount} rows={wkRows} actions={actions} />

      {/* Notes */}
      <div className="panel col-span-full">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-semibold tracking-[-0.01em]">Notes</div>
          <div className="mono text-[11px] tracking-[0.14em] text-mute2">SAVED AUTOMATICALLY</div>
        </div>
        <div className="px-[22px] py-5">
          <textarea
            className="field min-h-[220px] resize-y rounded-[10px] px-4 py-3.5 leading-[1.6]"
            value={vals.notes}
            placeholder="Ideas, blockers, people to call, numbers to check…"
            onChange={(e) => actions.setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mono mb-[7px] text-[11px] tracking-[0.16em] text-mute2">{label}</div>
      {children}
    </div>
  )
}

function ItemList({ title, count, rows, actions }) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-[22px] py-[18px]">
        <div className="text-[19px] font-semibold tracking-[-0.01em]">{title}</div>
        <div className="mono text-[11px] tracking-[0.14em] text-mute2">{count}</div>
      </div>
      <div className="flex max-h-[620px] flex-col gap-2.5 overflow-auto px-[22px] pb-[22px] pt-3.5">
        {rows.map((x) => (
          <div key={x.id} className="flex items-center gap-[11px] rounded-[10px] border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
            <TickBox item={x} size={15} onClick={x.toggle} />
            <div className="mono whitespace-nowrap rounded-md bg-white/[0.06] px-[7px] py-1 text-[9.5px] tracking-[0.09em] text-mute3">{x.month}</div>
            <div className="mono whitespace-nowrap rounded-md bg-white/[0.06] px-[7px] py-1 text-[9.5px] tracking-[0.09em]" style={{ color: x.color }}>{x.tag}</div>
            <input
              className={cn('min-w-0 flex-1 border-none bg-transparent py-0.5 text-[13px] outline-none', x.strike && 'line-through')}
              style={{ color: x.textColor }}
              value={x.text}
              onChange={x.edit}
            />
            <div onClick={x.remove} className="cursor-pointer px-0.5 text-[16px] leading-none text-mute2">×</div>
          </div>
        ))}
      </div>
    </div>
  )
}
