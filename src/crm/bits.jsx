import { pretty } from '../lib/helpers'
import { followState, stageDef } from './lib'

/** "3d overdue" / "Today" / "Tomorrow" / date / "No follow-up" for an open lead. */
export function FollowUp({ l, today }) {
  const f = followState(l, today)
  if (!f) return <span className="whitespace-nowrap text-mute2">No follow-up</span>
  if (f.late) return <span className="whitespace-nowrap font-semibold text-pink">{-f.days}d overdue</span>
  if (f.today) return <span className="whitespace-nowrap font-semibold text-yellow">Today</span>
  if (f.days === 1) return <span className="whitespace-nowrap text-mute">Tomorrow</span>
  return <span className="whitespace-nowrap text-mute">{pretty(l.followUp)}</span>
}

export function StagePill({ stage }) {
  const s = stageDef(stage)
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium">
      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

export function Modal({ title, hint, children, onClose, width = 480 }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="w-full rounded-2xl bg-surface p-5 shadow-2xl" style={{ maxWidth: width }}>
        <h2 className="font-head text-[18px] font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-[13px] text-mute">{hint}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
