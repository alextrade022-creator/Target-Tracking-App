import { cn } from '../lib/helpers'

export default function TodoBoard({ vals, actions }) {
  const { tdraft, columns, history } = vals
  const setT = actions.setT

  return (
    <div>
      {/* New todo */}
      <div className="panel mt-7">
        <div className="border-b border-white/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-semibold tracking-[-0.01em]">New todo</div>
          <div className="mt-1 text-[13px] text-mute">
            Anything ad-hoc that isn't part of the roadmap — assign it, date it, and move it across the board.
          </div>
        </div>
        <div className="grid items-end gap-3.5 px-[22px] py-5" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
          <Labeled label="TASK NAME">
            <input className="field" value={tdraft.title} placeholder="July month hiring teachers — detailed report" onChange={(e) => setT({ title: e.target.value })} />
          </Labeled>
          <Labeled label="ASSIGNED TO">
            <input className="field" value={tdraft.who} placeholder="Name" onChange={(e) => setT({ who: e.target.value })} />
          </Labeled>
          <Labeled label="ASSIGNED ON">
            <input type="date" className="field [color-scheme:dark]" value={tdraft.from} onChange={(e) => setT({ from: e.target.value })} />
          </Labeled>
          <Labeled label="DEADLINE">
            <input type="date" className="field [color-scheme:dark]" value={tdraft.due} onChange={(e) => setT({ due: e.target.value })} />
          </Labeled>
          <button type="button" onClick={actions.addTodo} className="whitespace-nowrap rounded-lg bg-teal px-6 py-3 text-[14px] font-bold text-ink">
            + Add todo
          </button>
          <div className="col-span-full">
            <Labeled label="DETAILS (OPTIONAL)">
              <textarea
                className="field min-h-[70px] resize-y leading-[1.5]"
                value={tdraft.details}
                placeholder="Include CAC, CPR, conversion %, channel split…"
                onChange={(e) => setT({ details: e.target.value })}
              />
            </Labeled>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="mt-[22px] grid grid-cols-3 items-start gap-4">
        {columns.map((col) => (
          <div key={col.label} className="min-h-[260px] rounded-2xl border border-white/[0.08] bg-surface p-4">
            <div className="mb-3.5 flex items-center gap-2.5">
              <div className="mono rounded-md px-[11px] py-[5px] text-[11px] tracking-[0.14em]" style={{ color: col.color, background: col.tint }}>
                {col.label}
              </div>
              <div className="mono text-[15px]" style={{ color: col.color }}>{col.count}</div>
            </div>
            <div className="flex flex-col gap-2.5">
              {col.cards.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/[0.08] bg-card p-3.5" style={{ borderLeft: '3px solid ' + c.accent }}>
                  <div className="flex items-start justify-between gap-2.5">
                    <div
                      className={cn('text-[14.5px] font-semibold leading-[1.35]', c.strike && 'line-through')}
                      style={{ color: c.titleColor, textWrap: 'pretty' }}
                    >
                      {c.title}
                    </div>
                    <div onClick={c.remove} className="cursor-pointer px-0.5 text-[16px] leading-none text-mute2">×</div>
                  </div>
                  {c.hasDetails && (
                    <div className="mt-[7px] text-[12.5px] leading-[1.5] text-mute" style={{ textWrap: 'pretty' }}>{c.details}</div>
                  )}
                  <div className="mt-[11px] flex flex-wrap gap-[7px]">
                    {c.hasWho && <Chip className="bg-white/[0.07] text-soft">👤 {c.who}</Chip>}
                    {c.hasFrom && <Chip className="bg-white/[0.05] text-mute">FROM {c.from}</Chip>}
                    {c.hasDue && (
                      <Chip style={{ color: c.dueColor, background: c.dueBg }}>DUE {c.due}</Chip>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {c.showBack && (
                      <button type="button" onClick={c.back} className="flex-1 rounded-md border border-white/[0.12] py-[7px] text-center text-[11.5px] text-mute">
                        ← {c.backLabel}
                      </button>
                    )}
                    {c.showFwd && (
                      <button type="button" onClick={c.forward} className="flex-1 rounded-md py-[7px] text-center text-[11.5px]" style={{ border: '1px solid ' + c.fwdColor, color: c.fwdColor }}>
                        {c.fwdLabel} →
                      </button>
                    )}
                    {c.showArchive && (
                      <button type="button" onClick={c.archive} className="flex-1 rounded-md border border-white/[0.12] py-[7px] text-center text-[11.5px] text-mute">
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {col.empty && <div className="px-0.5 py-2 text-[12.5px] text-mute2">Nothing here.</div>}
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="panel mt-[22px]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-semibold tracking-[-0.01em]">History — completed &amp; archived</div>
          <div className="mono text-[11px] tracking-[0.14em] text-mute2">{vals.historyCount}</div>
        </div>
        <div className="flex flex-col gap-2 px-[22px] pb-[22px] pt-3.5">
          {history.map((h) => (
            <div
              key={h.id}
              className="grid items-center gap-3.5 rounded-[10px] border border-white/[0.07] bg-white/[0.035] px-3.5 py-[11px]"
              style={{ gridTemplateColumns: '1fr 160px 130px 130px auto' }}
            >
              <div className="text-[13.5px] text-mute3" style={{ textWrap: 'pretty' }}>{h.title}</div>
              <div className="mono text-[11px] text-mute">{h.who}</div>
              <div className="mono text-[11px] text-mute2">DUE {h.due}</div>
              <div className="mono text-[11px] text-green">DONE {h.at}</div>
              <div className="flex gap-2">
                <button type="button" onClick={h.restore} className="rounded-md border border-white/[0.12] px-3 py-[5px] text-[11px] text-mute">Restore</button>
                <div onClick={h.remove} className="cursor-pointer px-0.5 text-[16px] leading-none text-mute2">×</div>
              </div>
            </div>
          ))}
          {vals.historyEmpty && (
            <div className="text-[13px] text-mute2">Completed todos you archive will be listed here with their dates.</div>
          )}
        </div>
      </div>
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

function Chip({ children, className, style }) {
  return (
    <div className={cn('mono rounded-md px-2 py-1 text-[10px] tracking-[0.08em]', className)} style={style}>
      {children}
    </div>
  )
}
