import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../lib/helpers'
import { PageHeader, Seg } from '../ws/ui'
import Board from './Board'
import LeadList from './LeadList'
import Insights from './Insights'
import LeadDrawer from './LeadDrawer'
import { AddLeadDialog, CloseDialog } from './Dialogs'
import {
  arr, num, IDX, DEAL_FROM, SERVICES, SOURCES, CONSULTING_ID, isDue, followState,
  matchesFilters, summary, shortInr, stageLabel, todayIso, addDays,
} from './lib'

const VIEWS = [
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'list', label: 'List' },
  { value: 'insights', label: 'Insights' },
]

export default function Leads({ crm, ws, pay }) {
  const { state: s, actions: a } = crm
  const today = todayIso()
  const leads = arr(s.leads)
  const f = s.filters
  const visible = useMemo(() => leads.filter((l) => matchesFilters(l, f, today)), [leads, f, today])
  const sum = summary(visible)
  const due = leads.filter((l) => isDue(l, today))
  const late = due.filter((l) => followState(l, today)?.late)
  const lead = leads.find((l) => l.id === s.openId) || null

  const [adding, setAdding] = useState(false)
  const [pending, setPending] = useState(null) // { id, stage } waiting for a deal value
  const [closing, setClosing] = useState(null) // { id, kind: 'won' | 'lost' }
  const [flashId, setFlashId] = useState('')
  const [toast, setToast] = useState('')
  const timer = useRef(0)
  const say = (msg) => { setToast(msg); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 3600) }
  useEffect(() => () => clearTimeout(timer.current), [])

  // Meetings scheduled from a lead go to the Business Consultation workspace.
  const bizId = ws.sel.bizMap[CONSULTING_ID]
    ? CONSULTING_ID
    : ws.sel.businesses.find((b) => /consult/i.test(b.name))?.id || ws.sel.businesses[0]?.id || ''

  const flash = (id) => { setFlashId(''); requestAnimationFrame(() => setFlashId(id)) }

  const requestMove = (id, stage) => {
    const l = leads.find((x) => x.id === id)
    if (!l || l.stage === stage) return
    if (stage === 'won' || stage === 'lost') { setClosing({ id, kind: stage }); return }
    if (IDX[stage] >= DEAL_FROM && !num(l.deal)) {
      a.openLead(id)
      setPending({ id, stage })
      say(`Add the deal value to move ${l.name} to ${stageLabel(stage)}.`)
      return
    }
    a.moveLead(id, stage)
    flash(id)
    say(`${l.name} moved to ${stageLabel(stage)}.`)
  }

  const savePending = (deal) => {
    if (!pending) return
    const l = leads.find((x) => x.id === pending.id)
    a.moveLead(pending.id, pending.stage, { deal })
    flash(pending.id)
    say(`${l?.name || 'Lead'} moved to ${stageLabel(pending.stage)}.`)
    setPending(null)
  }

  const confirmClose = (opts) => {
    const l = leads.find((x) => x.id === closing.id)
    a.moveLead(closing.id, closing.kind, opts)
    flash(closing.id)
    if (closing.kind === 'won' && pay && l) {
      pay.actions.addFromLead(l, opts.deal)
      say(`${l.name} marked as won and added to Client payments. Set up their payment plan there.`)
    } else {
      say(`${l?.name || 'Lead'} marked as ${closing.kind}.`)
    }
    setClosing(null)
  }

  const closeDrawer = () => { a.openLead(''); setPending(null) }
  const open = (id) => { setPending(null); a.openLead(id) }

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Business Consultation · from first enquiry to signed client."
        right={
          <button type="button" onClick={() => setAdding(true)} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">
            + New lead
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Open leads" value={sum.open.length} sub={`${shortInr(sum.early)} can afford, before proposal`} />
        <button
          type="button"
          onClick={() => a.setFilter({ due: !f.due })}
          aria-pressed={f.due}
          className={cn('stat px-5 py-4 text-left transition-colors hover:border-teal/50', f.due && 'border-teal/60 bg-teal/[0.06]')}
        >
          <div className="text-[12px] font-medium text-mute">Follow-ups due today</div>
          <div className={cn('mt-1 font-head text-[24px] font-bold leading-tight', late.length && 'text-pink')}>{due.length}</div>
          <div className="mt-1 text-[12px] text-mute2">
            {late.length ? `${late.length} overdue · ` : ''}{f.due ? 'Showing only these' : 'Click to show only these'}
          </div>
        </button>
        <Kpi label="Proposals in play" value={shortInr(sum.inPlay)} sub="Deal value in Proposal + Negotiation" />
        <Kpi
          label="Won"
          value={shortInr(sum.wonValue)}
          tone="text-green"
          sub={`${sum.won.length} client${sum.won.length === 1 ? '' : 's'} · win rate ${sum.rate === null ? '—' : sum.rate + '%'}`}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Seg value={s.view} onChange={a.setView} options={VIEWS} />
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <input
            type="search"
            className="field w-full sm:w-[210px]"
            placeholder="Search name, phone, place…"
            aria-label="Search leads"
            value={f.q}
            onChange={(e) => a.setFilter({ q: e.target.value })}
          />
          <select className="select w-auto" aria-label="Service" value={f.service} onChange={(e) => a.setFilter({ service: e.target.value })}>
            <option value="all">All services</option>
            {SERVICES.map((x) => <option key={x}>{x}</option>)}
          </select>
          <select className="select w-auto" aria-label="Source" value={f.source} onChange={(e) => a.setFilter({ source: e.target.value })}>
            <option value="all">All sources</option>
            {SOURCES.map((x) => <option key={x}>{x}</option>)}
          </select>
          <select
            className="select w-auto"
            aria-label="Date added"
            value={f.range}
            onChange={(e) => {
              const range = e.target.value
              a.setFilter(range === 'custom' && !f.from ? { range, from: addDays(-30), to: today } : { range })
            }}
          >
            <option value="all">Added: all time</option>
            <option value="month">Added: this month</option>
            <option value="3m">Added: last 3 months</option>
            <option value="custom">Added: custom range</option>
          </select>
          {f.range === 'custom' && (
            <>
              <input type="date" className="field w-auto" aria-label="From date" value={f.from} onChange={(e) => a.setFilter({ from: e.target.value })} />
              <input type="date" className="field w-auto" aria-label="To date" value={f.to} onChange={(e) => a.setFilter({ to: e.target.value })} />
            </>
          )}
        </div>
      </div>

      {leads.length === 0 ? (
        <section className="panel px-6 py-12 text-center">
          <div className="font-head text-[17px] font-semibold">No consultation leads yet</div>
          <p className="mx-auto mt-1 max-w-[420px] text-[13.5px] text-mute">
            Add your first enquiry. Only the name, phone, service and source are needed; fill in the rest after the first call.
          </p>
          <button type="button" onClick={() => setAdding(true)} className="mt-5 rounded-lg bg-teal px-5 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">
            + New lead
          </button>
        </section>
      ) : (
        <>
          {s.view === 'pipeline' && <Board leads={visible} today={today} flashId={flashId} onOpen={open} onMove={requestMove} />}
          {s.view === 'list' && <LeadList leads={visible} today={today} onOpen={open} />}
          {s.view === 'insights' && <Insights leads={visible} sum={sum} />}
        </>
      )}

      {lead && (
        <LeadDrawer
          key={lead.id}
          lead={lead}
          leads={leads}
          today={today}
          pendingStage={pending?.id === lead.id ? pending.stage : null}
          onSavePending={savePending}
          onMove={requestMove}
          onClose={closeDrawer}
          crm={crm}
          ws={ws}
          bizId={bizId}
          onPayments={pay && lead.stage === 'won' ? () => {
            const sale = pay.state.sales.find((x) => x.leadId === lead.id)
            const id = sale ? sale.id : pay.actions.addFromLead(lead, lead.deal)
            closeDrawer()
            pay.actions.openSale(id)
            ws.actions.go('payments')
          } : null}
          say={say}
        />
      )}

      {adding && (
        <AddLeadDialog
          leads={leads}
          onClose={() => setAdding(false)}
          onOpenExisting={(id) => { setAdding(false); open(id) }}
          onAdd={(d) => {
            const id = a.addLead(d)
            setAdding(false)
            a.setView('pipeline')
            flash(id)
            say(`${d.name.trim()} added to New${d.followUp ? ', with a follow-up ' + (d.followUp === addDays(1) ? 'tomorrow' : 'set') : ''}.`)
          }}
        />
      )}

      {closing && (
        <CloseDialog
          lead={leads.find((l) => l.id === closing.id)}
          kind={closing.kind}
          onCancel={() => setClosing(null)}
          onConfirm={confirmClose}
        />
      )}

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[70] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl bg-fg px-4 py-2.5 text-[13px] text-ink shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, sub, tone = '' }) {
  return (
    <div className="stat px-5 py-4">
      <div className="text-[12px] font-medium text-mute">{label}</div>
      <div className={cn('mt-1 font-head text-[24px] font-bold leading-tight', tone)}>{value}</div>
      {sub && <div className="mt-1 text-[12px] text-mute2">{sub}</div>}
    </div>
  )
}
