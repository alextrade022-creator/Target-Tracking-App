import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/helpers'
import { PageHeader, Seg, Empty } from '../ws/ui'
import { Chip } from '../pf/ui'
import SaleDrawer from './SaleDrawer'
import { PaymentDialog, ReceiptDialog, ReminderDialog, PlanDialog, SaleDialog, SettingsDialog } from './Dialogs'
import {
  arr, num, inr, shortInr, longDate, shortDate, todayIso, addDays, workFor, paidOf, balanceOf,
  dueItems, nextDue, dueStatus,
} from './lib'

const VIEWS = [
  { value: 'due', label: 'To collect' },
  { value: 'clients', label: 'Clients' },
  { value: 'history', label: 'Payments received' },
]
const GROUPS = [
  { k: 'overdue', t: 'Overdue' },
  { k: 'today', t: 'Due today' },
  { k: 'week', t: 'Next 7 days' },
  { k: 'later', t: 'Later' },
]

export default function Payments({ pay }) {
  const { state: s, actions: a } = pay
  const today = todayIso()
  const sales = arr(s.sales)
  const st = s.settings
  const due = sales.flatMap(dueItems).sort((x, y) => String(x.due).localeCompare(String(y.due)))
  const byStatus = (k) => due.filter((x) => dueStatus(x.due, today).k === k)
  const overdue = byStatus('overdue')
  const soon = byStatus('today').concat(byStatus('week'))
  const month = today.slice(0, 7)
  const monthPays = sales.flatMap((x) => arr(x.pays)).filter((p) => String(p.date).startsWith(month))
  const needPlan = sales.filter((x) => !x.plan && balanceOf(x) > 0)
  const active = sales.find((x) => x.id === s.openId) || null

  const [dialog, setDialog] = useState(null) // { type, saleId, payId }
  const [toast, setToast] = useState('')
  const timer = useRef(0)
  const say = (msg) => { setToast(msg); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 3800) }
  useEffect(() => () => clearTimeout(timer.current), [])
  const open = (type, saleId = '', payId = '') => setDialog({ type, saleId, payId })
  const close = () => setDialog(null)
  const dSale = dialog ? sales.find((x) => x.id === dialog.saleId) : null
  const sumLeft = (list) => list.reduce((t, x) => t + x.left, 0)

  return (
    <div>
      <PageHeader
        title="Client payments"
        subtitle="Business Consultation · plans, part payments, reminders and receipts."
        right={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => open('settings')} className="rounded-lg border border-hair/[0.14] px-3.5 py-2.5 text-[13px] font-medium hover:border-hair/[0.3]">Reminder & receipt settings</button>
            <button type="button" onClick={() => open('sale')} className="rounded-lg border border-hair/[0.14] px-3.5 py-2.5 text-[13px] font-medium hover:border-hair/[0.3]">+ Add sale</button>
            <button type="button" onClick={() => open('pay')} disabled={!sales.some((x) => balanceOf(x) > 0)} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt disabled:opacity-40">+ Record payment</button>
          </div>
        }
      />

      {(!st.upi || !st.name) && sales.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-yellow/[0.1] px-4 py-3 text-[13px]">
          <span>Add your name and UPI ID so reminders and receipts read correctly.</span>
          <button type="button" onClick={() => open('settings')} className="font-semibold text-teal">Open settings</button>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Collected this month" value={shortInr(monthPays.reduce((t, p) => t + num(p.amount), 0))} sub={`${monthPays.length} payment${monthPays.length === 1 ? '' : 's'} received`} tone="text-green" />
        <Kpi label="Overdue" value={shortInr(sumLeft(overdue))} sub={`${new Set(overdue.map((x) => x.s.id)).size} to remind`} tone={overdue.length ? 'text-pink' : ''} />
        <Kpi label="Due in the next 7 days" value={shortInr(sumLeft(soon))} sub={`${soon.length} payment${soon.length === 1 ? '' : 's'}`} />
        <Kpi label="Outstanding" value={shortInr(sales.reduce((t, x) => t + balanceOf(x), 0))} sub={`of ${shortInr(sales.reduce((t, x) => t + num(x.deal), 0))} billed`} />
      </div>

      {needPlan.map((x) => (
        <div key={x.id} className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-teal/[0.07] px-4 py-3 text-[13px]">
          <span><b>{x.name}</b> · {workFor(x)} · {inr(x.deal)}. Set how they will pay.</span>
          <button type="button" onClick={() => open('plan', x.id)} className="rounded-lg bg-teal px-3 py-1.5 text-[12.5px] font-semibold text-onaccent hover:bg-teal-lt">Set up payment plan</button>
        </div>
      ))}

      <div className="mb-4">
        <Seg
          value={s.view}
          onChange={a.setView}
          options={VIEWS.map((v) => (v.value === 'due' ? { ...v, count: overdue.length + soon.length || undefined } : v))}
        />
      </div>

      {sales.length === 0 ? (
        <section className="panel px-6 py-12 text-center">
          <div className="font-head text-[17px] font-semibold">No client payments yet</div>
          <p className="mx-auto mt-1 max-w-[460px] text-[13.5px] text-mute">
            Leads you mark as Won in Consultation leads appear here automatically. For referrals, repeat work, retainers or workshops, add a sale directly.
          </p>
          <button type="button" onClick={() => open('sale')} className="mt-5 rounded-lg bg-teal px-5 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">+ Add sale</button>
        </section>
      ) : (
        <>
          {s.view === 'due' && (
            <section className="panel">
              {due.length === 0 && <Empty>Nothing to collect. Every client is paid up.</Empty>}
              {GROUPS.map((g) => {
                const rows = byStatus(g.k)
                if (!rows.length) return null
                return (
                  <div key={g.k}>
                    <div className="px-5 pb-1 pt-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mute2">{g.t} · {inr(sumLeft(rows))}</div>
                    {rows.map((x, i) => <DueRow key={x.s.id + i} x={x} today={today} onOpen={() => a.openSale(x.s.id)} onRemind={() => open('remind', x.s.id)} onPay={() => open('pay', x.s.id)} />)}
                  </div>
                )
              })}
            </section>
          )}
          {s.view === 'clients' && <ClientsTable sales={sales} origin={s.origin} setOrigin={a.setOrigin} today={today} onOpen={a.openSale} />}
          {s.view === 'history' && <History sales={sales} onOpen={a.openSale} onReceipt={(sid, pid) => open('receipt', sid, pid)} />}
        </>
      )}

      {active && (
        <SaleDrawer
          key={active.id}
          sale={active}
          pay={pay}
          today={today}
          onClose={() => a.openSale('')}
          onDialog={open}
          say={say}
        />
      )}

      {dialog?.type === 'pay' && (
        <PaymentDialog
          sales={sales}
          saleId={dialog.saleId}
          onClose={close}
          onSave={(saleId, v, showReceipt) => {
            const payId = a.recordPayment(saleId, v)
            const x = sales.find((y) => y.id === saleId)
            say(`${inr(v.amount)} from ${x?.name || 'client'} saved.`)
            if (showReceipt) setDialog({ type: 'receipt', saleId, payId })
            else close()
          }}
        />
      )}
      {dialog?.type === 'receipt' && dSale && (
        <ReceiptDialog sale={dSale} payId={dialog.payId} settings={st} onClose={close} say={say} />
      )}
      {dialog?.type === 'remind' && dSale && (
        <ReminderDialog
          sale={dSale}
          settings={st}
          today={today}
          onClose={close}
          onSent={() => { a.logReminder(dSale.id); close(); say(`Reminder to ${dSale.name} logged.`) }}
          say={say}
        />
      )}
      {dialog?.type === 'plan' && dSale && (
        <PlanDialog
          sale={dSale}
          onClose={close}
          onSave={(plan, rows, expect) => { a.setPlan(dSale.id, plan, rows, expect); close(); say(`Payment plan saved for ${dSale.name}.`) }}
        />
      )}
      {dialog?.type === 'sale' && (
        <SaleDialog
          sales={sales}
          onClose={close}
          onSave={(v) => {
            const id = a.addSale({ ...v, origin: 'direct' })
            if (v.paidNow) {
              const payId = a.recordPayment(id, { amount: v.deal, date: v.won, mode: v.mode, ref: v.ref })
              setDialog({ type: 'receipt', saleId: id, payId })
              say('Sale added and marked as paid.')
            } else {
              setDialog({ type: 'plan', saleId: id })
              say(`Sale added. Now set how ${v.name} will pay.`)
            }
          }}
        />
      )}
      {dialog?.type === 'settings' && (
        <SettingsDialog settings={st} onClose={close} onSave={(v) => { a.setSettings(v); close(); say('Settings saved.') }} />
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
      <div className="mt-1 text-[12px] text-mute2">{sub}</div>
    </div>
  )
}

export function OriginTag({ sale }) {
  return sale?.origin === 'direct'
    ? <span className="ml-1.5 rounded-full border border-hair/[0.14] px-1.5 align-[1px] text-[10.5px] font-semibold text-mute">Direct</span>
    : null
}

function DueRow({ x, today, onOpen, onRemind, onPay }) {
  const st = dueStatus(x.due, today)
  const last = arr(x.s.reminders)[0]
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-hair/[0.06] px-5 py-3 first-of-type:border-t-0 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <button type="button" onClick={onOpen} className="text-left text-[14px] font-semibold hover:text-teal">{x.s.name || 'N/A'}</button>
        <OriginTag sale={x.s} />
        <div className="truncate text-[12px] text-mute">
          {x.s.title ? x.s.title + ' · ' : ''}{x.label}{x.s.plan === 'flexible' ? ' (flexible plan)' : ''}
          {x.part ? ` · ${inr(x.part)} of ${inr(x.of)} paid` : ''}
        </div>
        {last && <div className="text-[11.5px] text-mute2">Reminded {last.date === today ? 'today' : shortDate(last.date)}</div>}
      </div>
      <div className="text-right md:text-left">
        <div className="font-head text-[16px] font-bold tabular-nums">{inr(x.left)}</div>
        <div className="mt-0.5"><Chip tone={st.tone}>{st.label}</Chip></div>
      </div>
      <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:justify-end">
        {st.k !== 'later' && (
          <button type="button" onClick={onRemind} className="rounded-lg bg-[#128C4A] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">Remind on WhatsApp</button>
        )}
        <button type="button" onClick={onPay} className="rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[12.5px] font-medium hover:border-hair/[0.3]">Record payment</button>
      </div>
    </div>
  )
}

function ClientsTable({ sales, origin, setOrigin, today, onOpen }) {
  const list = sales.filter((x) => origin === 'all' || x.origin === origin).sort((a, b) => balanceOf(b) - balanceOf(a) || String(b.won).localeCompare(String(a.won)))
  const count = (k) => sales.filter((x) => k === 'all' || x.origin === k).length
  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/[0.07] px-5 py-3">
        <Seg
          value={origin}
          onChange={setOrigin}
          options={[
            { value: 'all', label: 'All', count: count('all') },
            { value: 'pipeline', label: 'From lead pipeline', count: count('pipeline') },
            { value: 'direct', label: 'Direct', count: count('direct') },
          ]}
        />
        <span className="text-[12.5px] text-mute">{list.length} sale{list.length === 1 ? '' : 's'} · {inr(list.reduce((t, x) => t + balanceOf(x), 0))} outstanding</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[13px] tabular-nums">
          <thead>
            <tr className="border-b border-hair/[0.07] text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">
              <th className="px-4 py-2.5">Client / work</th>
              <th className="px-4 py-2.5">Source</th>
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-4 py-2.5 text-right">Fee</th>
              <th className="px-4 py-2.5 text-right">Paid</th>
              <th className="px-4 py-2.5 text-right">Balance</th>
              <th className="px-4 py-2.5">Progress</th>
              <th className="px-4 py-2.5">Next due</th>
            </tr>
          </thead>
          <tbody>
            {list.map((x) => {
              const paid = paidOf(x), b = balanceOf(x), n = nextDue(x)
              const pct = num(x.deal) ? Math.min(100, Math.round((paid / num(x.deal)) * 100)) : 0
              return (
                <tr key={x.id} tabIndex={0} onClick={() => onOpen(x.id)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(x.id) }} className="cursor-pointer border-b border-hair/[0.06] last:border-b-0 hover:bg-hair/[0.03]">
                  <td className="px-4 py-2.5"><div className="font-semibold">{x.name || 'N/A'}</div><div className="text-[12px] text-mute">{workFor(x)}</div></td>
                  <td className="px-4 py-2.5">{x.origin === 'direct' ? 'Direct' : 'Lead pipeline'}</td>
                  <td className="px-4 py-2.5">{x.plan === 'flexible' ? 'Flexible' : x.plan ? `${arr(x.inst).length} instalment${arr(x.inst).length === 1 ? '' : 's'}` : '—'}</td>
                  <td className="px-4 py-2.5 text-right">{inr(x.deal)}</td>
                  <td className="px-4 py-2.5 text-right">{inr(paid)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{inr(b)}</td>
                  <td className="px-4 py-2.5"><div className="h-1.5 min-w-[90px] overflow-hidden rounded-full bg-hair/[0.07]"><div className="h-full rounded-full bg-green" style={{ width: pct + '%' }} /></div></td>
                  <td className="px-4 py-2.5">
                    {!b ? <Chip tone="green">Paid in full</Chip>
                      : !x.plan ? <Chip tone="blue">Needs a plan</Chip>
                        : n ? <span className="whitespace-nowrap"><Chip tone={dueStatus(n.due, today).tone}>{dueStatus(n.due, today).label}</Chip> <span className="text-[12px] text-mute">{inr(n.left)}</span></span>
                          : <span className="text-[12px] text-mute2">No date set</span>}
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-mute2">No sales here yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

async function exportPayments(rows) {
  if (!rows.length) return
  const XLSX = await import('xlsx')
  const data = rows.map(({ s, p }) => ({
    Date: p.date, 'Receipt no.': p.receipt, Client: s.name, 'For': workFor(s),
    Source: s.origin === 'direct' ? 'Direct' : 'Lead pipeline', Mode: p.mode, Reference: p.ref || '', 'Amount (₹)': num(p.amount),
  }))
  const sheet = XLSX.utils.json_to_sheet(data)
  sheet['!cols'] = Object.keys(data[0]).map((k) => ({ wch: k === 'For' || k === 'Client' ? 30 : 16 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Payments received')
  XLSX.writeFile(wb, 'client-payments-' + todayIso() + '.xlsx')
}

function History({ sales, onOpen, onReceipt }) {
  const [range, setRange] = useState('all')
  const today = todayIso()
  const from = range === 'month' ? today.slice(0, 7) + '-01' : range === '3m' ? addDays(-90) : range === 'fy' ? fyStart(today) : ''
  const rows = sales.flatMap((s) => arr(s.pays).map((p) => ({ s, p })))
    .filter(({ p }) => !from || p.date >= from)
    .sort((a, b) => (b.p.date + b.p.createdAt).localeCompare(a.p.date + a.p.createdAt))
  const total = rows.reduce((t, r) => t + num(r.p.amount), 0)
  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/[0.07] px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <select className="select w-auto" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Period">
            <option value="all">All time</option>
            <option value="month">This month</option>
            <option value="3m">Last 3 months</option>
            <option value="fy">This financial year</option>
          </select>
          <span className="text-[12.5px] text-mute">{rows.length} payment{rows.length === 1 ? '' : 's'} · {inr(total)}</span>
        </div>
        <button type="button" onClick={() => exportPayments(rows)} disabled={!rows.length} className="rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[12.5px] font-medium hover:border-hair/[0.3] disabled:opacity-40">Export to Excel</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px] tabular-nums">
          <thead>
            <tr className="border-b border-hair/[0.07] text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">
              <th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Client</th><th className="px-4 py-2.5">Mode</th>
              <th className="px-4 py-2.5">Reference</th><th className="px-4 py-2.5">Receipt no.</th><th className="px-4 py-2.5 text-right">Amount</th><th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, p }) => (
              <tr key={p.id} className="border-b border-hair/[0.06] last:border-b-0">
                <td className="whitespace-nowrap px-4 py-2.5">{longDate(p.date)}</td>
                <td className="px-4 py-2.5">
                  <button type="button" onClick={() => onOpen(s.id)} className="text-left font-medium text-teal hover:underline">{s.name}</button>
                  <div className="text-[12px] text-mute">{workFor(s)}</div>
                </td>
                <td className="px-4 py-2.5">{p.mode}</td>
                <td className="px-4 py-2.5 text-mute">{p.ref || '—'}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-mute">{p.receipt}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{inr(p.amount)}</td>
                <td className="px-4 py-2.5 text-right"><button type="button" onClick={() => onReceipt(s.id, p.id)} className="text-[12.5px] font-semibold text-teal hover:underline">Receipt</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-mute2">No payments in this period.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function fyStart(today) {
  const [y, m] = today.split('-').map(Number)
  return `${m >= 4 ? y : y - 1}-04-01`
}
