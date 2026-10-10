import { iso } from '../lib/helpers'
import { greeting, longDate } from './lib'
import { PageHeader, Section, TaskRow, TaskAdder, BizChip, Empty } from './ui'
import { FollowUp } from '../crm/bits'
import { arr, isDue, stageLabel, CONSULTING_ID } from '../crm/lib'
import { Chip } from '../pf/ui'
import { dueItems, dueStatus, inr as rupees } from '../pay/lib'

export default function Today({ ws, crm, pay }) {
  const { state: s, sel, actions: a } = ws
  const today = iso(new Date())
  const open = sel.tasks.filter((t) => t.status !== 'done')
  const overdue = open.filter((t) => t.due && t.due < today)
  const dueToday = open.filter((t) => t.due === today)
  const meetings = sel.meetings
    .filter((m) => m.date === today)
    .sort((x, y) => (x.time || '').localeCompare(y.time || ''))
  const waiting = open.filter((t) => sel.ownerOf(t) === 'team')

  // "Waiting on" grouped by business + department
  const groups = {}
  waiting.forEach((t) => {
    const key = t.bizId + ':' + t.deptId
    const g = groups[key] || (groups[key] = { biz: sel.bizMap[t.bizId], dept: sel.deptOf(t.bizId, t.deptId), count: 0, overdue: 0 })
    g.count += 1
    if (t.due && t.due < today) g.overdue += 1
  })
  const groupList = Object.values(groups).sort((x, y) => y.count - x.count)
  // Consultation lead follow-ups (shown for All businesses or Business Consultation)
  const showLeads = !!crm && (s.bizId === 'all' || s.bizId === CONSULTING_ID)
  const leadsDue = showLeads
    ? arr(crm.state.leads).filter((l) => isDue(l, today)).sort((x, y) => x.followUp.localeCompare(y.followUp))
    : []
  const openLead = (id) => { crm.actions.openLead(id); a.go('leads') }
  // Client payments due today or overdue
  const payDue = showLeads && pay
    ? arr(pay.state.sales).flatMap(dueItems).filter((x) => x.due <= today).sort((x, y) => x.due.localeCompare(y.due))
    : []
  const openSale = (id) => { pay.actions.openSale(id); a.go('payments') }
  const scopeName = s.bizId === 'all' ? 'all your businesses' : sel.bizMap[s.bizId]?.name || 'N/A'

  return (
    <div>
      <PageHeader title={greeting()} subtitle={`${longDate()} · showing ${scopeName}`} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Overdue" value={overdue.length} tone={overdue.length ? 'text-pink' : ''} />
        <Stat label="Due today" value={dueToday.length} />
        <Stat label="Meetings today" value={meetings.length} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="flex flex-col gap-5 xl:col-span-3">
          <Section title="Quick add">
            <TaskAdder ws={ws} placeholder="What needs doing?" defaultDue={today} />
          </Section>

          <Section title="Needs your attention" right={<span className="text-[12px] text-mute2">{overdue.length + dueToday.length} open</span>}>
            {overdue.length + dueToday.length === 0 && <Empty>Nothing due today. Nice and clear.</Empty>}
            {overdue.concat(dueToday).map((t) => <TaskRow key={t.id} t={t} ws={ws} showBiz={s.bizId === 'all'} />)}
          </Section>
        </div>

        <div className="flex flex-col gap-5 xl:col-span-2">
          {showLeads && pay && (
            <Section
              title="Payments to collect"
              right={<button type="button" onClick={() => { pay.actions.setView('due'); a.go('payments') }} className="text-[12.5px] font-medium text-teal hover:text-teal-lt">All payments →</button>}
            >
              {payDue.length === 0 && <Empty>No client payments due today.</Empty>}
              {payDue.map((x, i) => {
                const st = dueStatus(x.due, today)
                return (
                  <button
                    key={x.s.id + i}
                    type="button"
                    onClick={() => openSale(x.s.id)}
                    className="flex w-full items-center justify-between gap-3 border-b border-hair/[0.06] px-5 py-3 text-left last:border-b-0 hover:bg-hair/[0.03]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium">{x.s.name || 'N/A'}</div>
                      <div className="mt-0.5 truncate text-[12px] text-mute">{x.s.title ? x.s.title + ' · ' : ''}{x.label}</div>
                    </div>
                    <div className="flex-none text-right">
                      <div className="text-[14px] font-semibold tabular-nums">{rupees(x.left)}</div>
                      <Chip tone={st.tone}>{st.label}</Chip>
                    </div>
                  </button>
                )
              })}
            </Section>
          )}

          {showLeads && (
            <Section
              title="Lead follow-ups"
              right={<button type="button" onClick={() => a.go('leads')} className="text-[12.5px] font-medium text-teal hover:text-teal-lt">Pipeline →</button>}
            >
              {leadsDue.length === 0 && <Empty>No lead follow-ups due today.</Empty>}
              {leadsDue.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => openLead(l.id)}
                  className="flex w-full items-center justify-between gap-3 border-b border-hair/[0.06] px-5 py-3 text-left last:border-b-0 hover:bg-hair/[0.03]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium">{l.name || 'N/A'}</div>
                    <div className="mt-0.5 truncate text-[12px] text-mute">{stageLabel(l.stage)} · {l.phone || 'N/A'}</div>
                  </div>
                  <span className="text-[12px]"><FollowUp l={l} today={today} /></span>
                </button>
              ))}
            </Section>
          )}

          <Section title="Meetings today" right={<button type="button" onClick={() => a.addMeeting({ bizId: s.bizId, date: today })} className="text-[12.5px] font-medium text-teal hover:text-teal-lt">+ New</button>}>
            {meetings.length === 0 && <Empty>No meetings today.</Empty>}
            {meetings.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => a.openMeeting(m.id)}
                className="flex w-full items-start gap-3 border-b border-hair/[0.06] px-5 py-3 text-left last:border-b-0 hover:bg-hair/[0.03]"
              >
                <div className="w-[44px] flex-none pt-0.5 text-[12.5px] font-semibold text-teal">{m.time || '—'}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{m.title || 'Untitled meeting'}</div>
                  <div className="mt-1.5"><BizChip biz={sel.bizMap[m.bizId]} /></div>
                </div>
              </button>
            ))}
          </Section>

          <Section title="Waiting on teams">
            {groupList.length === 0 && <Empty>You aren't waiting on any department.</Empty>}
            {groupList.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { a.setTaskView('waiting'); a.go('tasks') }}
                className="flex w-full items-center justify-between gap-3 border-b border-hair/[0.06] px-5 py-3 text-left last:border-b-0 hover:bg-hair/[0.03]"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium">{g.dept?.name || 'N/A'}</div>
                  <div className="mt-1"><BizChip biz={g.biz} /></div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-semibold">{g.count}</div>
                  {g.overdue > 0 && <div className="text-[11px] font-medium text-pink">{g.overdue} overdue</div>}
                </div>
              </button>
            ))}
          </Section>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone = '' }) {
  return (
    <div className="stat px-5 py-4">
      <div className="text-[12px] font-medium text-mute">{label}</div>
      <div className={`mt-1 font-head text-[30px] font-bold leading-none ${tone}`}>{value}</div>
    </div>
  )
}
