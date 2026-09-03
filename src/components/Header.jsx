import { cn } from '../lib/helpers'
import { Bar } from './ui'
import ThemeToggle from './ThemeToggle'

const TABS = [
  { key: 'dash', label: 'Dashboard' },
  { key: 'todo', label: 'Todo Board' },
  { key: 'cal', label: 'Calendar' },
  { key: 'notes', label: 'Notes & New Tasks' },
  { key: 'report', label: 'Monthly Report' },
]

function Tab({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-[18px] py-[9px] text-[13.5px] font-semibold transition-colors',
        active ? 'border-teal bg-teal text-onaccent' : 'border-hair/[0.14] bg-transparent text-mute hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

function Stat({ label, children, className, valueClass }) {
  return (
    <div className={cn('stat px-[22px] py-4', className)}>
      <div className="mono text-[11px] tracking-[0.16em] text-mute2">{label}</div>
      <div className={cn('mono text-[34px] font-semibold leading-[1.2]', valueClass)}>{children}</div>
    </div>
  )
}

export default function Header({ vals, goPage, theme, toggleTheme }) {
  return (
    <div className="border-b border-hair/10 pb-6">
      {/* Eyebrow + theme toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="mono pt-1 text-[11px] uppercase tracking-[0.22em] text-mute2 sm:text-xs">
          Goal Map · Sep 2026 → Mar 2027
        </div>
        <ThemeToggle theme={theme} toggle={toggleTheme} />
      </div>

      <div className="mt-2 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[32px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[40px] xl:text-[46px]">
            {vals.ownerName}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <Tab key={t.key} active={vals.page === t.key} onClick={() => goPage(t.key)}>
                {t.label}
              </Tab>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-3.5">
          <Stat label="DONE" valueClass="text-teal" className="min-w-[104px] flex-1 sm:flex-none">
            {vals.doneCount}
          </Stat>
          <Stat label="PENDING" valueClass="text-orange" className="min-w-[104px] flex-1 sm:flex-none">
            {vals.pendingCount}
          </Stat>
          <div className="stat min-w-[172px] flex-1 px-[22px] py-4 sm:flex-none">
            <div className="mono text-[11px] tracking-[0.16em] text-mute2">OVERALL</div>
            <div className="flex items-baseline gap-1.5">
              <div className="mono text-[34px] font-semibold leading-[1.2]">{vals.pct}%</div>
              <div className="text-[13px] text-mute2">of {vals.totalCount} milestones</div>
            </div>
            <div className="mt-2">
              <Bar pct={vals.pct} color="linear-gradient(90deg,#4ECDC4,#7BC96F)" height={6} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
