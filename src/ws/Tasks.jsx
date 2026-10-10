import { cn } from '../lib/helpers'
import { PageHeader, Section, TaskRow, TaskAdder, Seg, Empty } from './ui'

export default function Tasks({ ws }) {
  const { state: s, sel, actions: a } = ws
  const all = sel.tasks
  const open = all.filter((t) => t.status !== 'done')
  const counts = {
    open: open.length,
    mine: open.filter((t) => sel.ownerOf(t) === 'me').length,
    waiting: open.filter((t) => sel.ownerOf(t) === 'team').length,
    done: all.length - open.length,
  }

  let list = s.taskView === 'done' ? all.filter((t) => t.status === 'done')
    : s.taskView === 'mine' ? open.filter((t) => sel.ownerOf(t) === 'me')
    : s.taskView === 'waiting' ? open.filter((t) => sel.ownerOf(t) === 'team')
    : open

  // Department filter works by name so "Finance" spans every business.
  const nameOf = (t) => (t.deptId ? sel.deptOf(t.bizId, t.deptId)?.name || '' : '').toLowerCase()
  const deptNames = []
  const seen = new Set()
  sel.businesses
    .filter((b) => s.bizId === 'all' || b.id === s.bizId)
    .forEach((b) => (b.departments || []).forEach((d) => {
      const k = (d.name || '').toLowerCase()
      if (k && !seen.has(k)) { seen.add(k); deptNames.push({ k, label: d.name }) }
    }))
  if (s.taskDept === 'personal') list = list.filter((t) => !t.deptId)
  else if (s.taskDept !== 'all') list = list.filter((t) => nameOf(t) === s.taskDept)

  list = list.slice().sort((x, y) => {
    if (s.taskView === 'done') return (y.doneAt || '').localeCompare(x.doneAt || '')
    if (!!x.due !== !!y.due) return x.due ? -1 : 1
    return (x.due || '').localeCompare(y.due || '') || (x.createdAt || 0) - (y.createdAt || 0)
  })

  const countFor = (k) => {
    const base = s.taskView === 'done' ? all.filter((t) => t.status === 'done') : open
    return k === 'personal' ? base.filter((t) => !t.deptId).length : base.filter((t) => nameOf(t) === k).length
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={s.bizId === 'all' ? 'Across all your businesses' : sel.bizMap[s.bizId]?.name}
      />

      <div className="mb-5">
        <Section title="Add a task">
          <TaskAdder ws={ws} />
        </Section>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Seg
          value={s.taskView}
          onChange={a.setTaskView}
          options={[
            { value: 'open', label: 'All open', count: counts.open },
            { value: 'mine', label: 'Mine', count: counts.mine },
            { value: 'waiting', label: 'Waiting on teams', count: counts.waiting },
            { value: 'done', label: 'Done', count: counts.done },
          ]}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Pill on={s.taskDept === 'all'} onClick={() => a.setTaskDept('all')}>All departments</Pill>
        <Pill on={s.taskDept === 'personal'} onClick={() => a.setTaskDept('personal')}>Personal · {countFor('personal')}</Pill>
        {deptNames.map((d) => (
          <Pill key={d.k} on={s.taskDept === d.k} onClick={() => a.setTaskDept(d.k)}>
            {d.label} · {countFor(d.k)}
          </Pill>
        ))}
      </div>

      <section className="panel">
        {list.length === 0 && <Empty>No tasks here.</Empty>}
        {list.map((t) => <TaskRow key={t.id} t={t} ws={ws} showBiz={s.bizId === 'all'} />)}
      </section>
    </div>
  )
}

function Pill({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
        on ? 'border-teal bg-teal/[0.1] text-teal' : 'border-hair/[0.12] text-mute hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}
