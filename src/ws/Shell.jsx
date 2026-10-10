import { useState } from 'react'
import { cn } from '../lib/helpers'
import ThemeToggle from '../components/ThemeToggle'
import { logout } from '../lib/api'

const NAV = [
  { k: 'today', label: 'Today', icon: '◎' },
  { k: 'tasks', label: 'Tasks', icon: '✓' },
  { k: 'meetings', label: 'Meetings', icon: '✎' },
  { k: 'calendar', label: 'Calendar', icon: '▦' },
  { k: 'leads', label: 'Consultation leads', icon: '◇' },
  { k: 'payments', label: 'Client payments', icon: '₹' },
  { k: 'branding', label: 'Personal branding', icon: '✦' },
  { k: 'finance', label: 'Personal finance', icon: '◔' },
  { k: 'settings', label: 'Businesses', icon: '⚙' },
]

export default function Shell({ ws, theme, toggleTheme, children }) {
  const { state: s, sel, actions: a } = ws
  const [open, setOpen] = useState(false)
  const pick = (fn) => { fn(); setOpen(false) }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="flex-none border-b border-hair/[0.08] bg-surface/80 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-[256px] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:py-5">
          <div className="font-head text-[17px] font-bold tracking-[-0.01em]">Command Center</div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-hair/[0.14] px-2.5 py-1 text-[13px] text-mute lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>

        <div className={cn('flex-col gap-5 px-3 pb-4 lg:flex lg:h-[calc(100vh-72px)] lg:overflow-y-auto', open ? 'flex' : 'hidden')}>
          {/* Business switcher */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mute2">Business</div>
            <SideItem
              active={s.bizId === 'all'}
              onClick={() => pick(() => a.setBiz('all'))}
              dot="var(--mute2)"
              label="All businesses"
              count={sel.openCount('all')}
            />
            {sel.businesses.map((b) => (
              <SideItem
                key={b.id}
                active={s.bizId === b.id}
                onClick={() => pick(() => a.setBiz(b.id))}
                dot={b.color}
                label={b.name}
                count={sel.openCount(b.id)}
              />
            ))}
          </div>

          {/* Navigation */}
          <nav>
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mute2">Workspace</div>
            {NAV.map((n) => (
              <button
                key={n.k}
                type="button"
                onClick={() => pick(() => a.go(n.k))}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors',
                  s.page === n.k ? 'bg-teal text-onaccent' : 'text-soft hover:bg-hair/[0.05]',
                )}
              >
                <span className="w-4 text-center text-[13px] opacity-80">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-hair/[0.08] px-2 pt-3">
            <button
              type="button"
              onClick={async () => { await logout(); window.location.reload() }}
              className="rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-mute hover:bg-hair/[0.05] hover:text-fg"
            >
              Log out
            </button>
            <ThemeToggle theme={theme} toggle={toggleTheme} />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-[1080px]">{children}</div>
      </main>
    </div>
  )
}

function SideItem({ active, onClick, dot, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors',
        active ? 'bg-hair/[0.07] font-semibold text-fg' : 'text-soft hover:bg-hair/[0.05]',
      )}
    >
      <span className="h-2 w-2 flex-none rounded-full" style={{ background: dot }} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count > 0 && <span className="text-[11.5px] text-mute2">{count}</span>}
    </button>
  )
}
