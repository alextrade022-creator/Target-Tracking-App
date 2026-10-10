import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/helpers'
import { Label } from '../ws/ui'
import { Chip } from '../pf/ui'
import { SERVICES, arr, num, inr, longDate, workFor, paidOf, balanceOf, allocate, nextDue, dueStatus } from './lib'

export default function SaleDrawer({ sale: x, pay, today, onClose, onDialog, say }) {
  const a = pay.actions
  const panel = useRef(null)
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState('') // '' | 'sale' | <payment id>

  useEffect(() => { panel.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('[role="dialog"][aria-modal="true"]')) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const paid = paidOf(x), b = balanceOf(x), n = nextDue(x)
  const pct = num(x.deal) ? Math.min(100, Math.round((paid / num(x.deal)) * 100)) : 0
  const set = (k) => (e) => a.patchSale(x.id, { [k]: e.target.value })
  const pays = arr(x.pays).slice().sort((p, q) => (q.date + q.createdAt).localeCompare(p.date + p.createdAt))

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside
        ref={panel}
        tabIndex={-1}
        aria-label={`Payments: ${x.name}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col gap-5 overflow-y-auto border-l border-hair/[0.08] bg-surface px-5 pb-8 pt-5 shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-mute">
              {x.origin === 'direct' ? `Direct sale · ${longDate(x.won)}` : `From lead pipeline · won ${longDate(x.won)}`}
            </div>
            <h2 className="mt-0.5 font-head text-[21px] font-bold leading-tight">{x.name || 'N/A'}</h2>
            <div className="mt-0.5 text-[13px] font-semibold">{workFor(x)}</div>
            <div className="text-[12.5px] text-mute">{[x.person, x.phone].filter(Boolean).join(' · ') || 'No contact details'}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-[22px] leading-none text-mute hover:bg-hair/[0.06] hover:text-fg">×</button>
        </div>

        <Block>
          <div className="grid grid-cols-3 gap-2">
            <Fig label="Fee" value={inr(x.deal)} />
            <Fig label="Paid" value={inr(paid)} tone="text-green" />
            <Fig label="Balance" value={inr(b)} tone={b ? '' : 'text-green'} />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-hair/[0.07]"><div className="h-full rounded-full bg-green" style={{ width: pct + '%' }} /></div>
          <div className="flex flex-wrap gap-2">
            {b > 0 && n && (
              <button type="button" onClick={() => onDialog('remind', x.id)} className="rounded-lg bg-[#128C4A] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">Remind on WhatsApp</button>
            )}
            {b > 0
              ? <button type="button" onClick={() => onDialog('pay', x.id)} className="rounded-lg bg-teal px-3 py-1.5 text-[12.5px] font-semibold text-onaccent hover:bg-teal-lt">Record payment</button>
              : <Chip tone="green">Paid in full</Chip>}
          </div>
        </Block>

        <Block title="Payment plan" action={x.plan && <button type="button" onClick={() => onDialog('plan', x.id)} className="text-[12.5px] font-semibold text-teal">Edit plan</button>}>
          {!x.plan && (
            <>
              <p className="text-[12.5px] text-mute">No payment plan yet.</p>
              <button type="button" onClick={() => onDialog('plan', x.id)} className="self-start rounded-lg bg-teal px-3 py-1.5 text-[12.5px] font-semibold text-onaccent">Set up payment plan</button>
            </>
          )}
          {x.plan === 'flexible' && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-hair/[0.08] px-3 py-2.5">
              <div>
                <div className="text-[13px] font-semibold">Flexible plan</div>
                <div className="text-[12px] text-mute">
                  Pays as they go. {x.expect?.date ? <>Next expected {num(x.expect.amount) ? <b>{inr(x.expect.amount)} </b> : ''}on {longDate(x.expect.date)}.</> : 'No next date set.'}
                </div>
              </div>
              {x.expect?.date && b > 0 && <Chip tone={dueStatus(x.expect.date, today).tone}>{dueStatus(x.expect.date, today).label}</Chip>}
            </div>
          )}
          {x.plan === 'instalments' && allocate(x).map(({ i, paid: ip, left }) => {
            const st = dueStatus(i.due, today)
            return (
              <div key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 rounded-xl border border-hair/[0.08] px-3 py-2.5">
                <div>
                  <div className="text-[13px] font-semibold">{i.label}</div>
                  <div className="text-[12px] text-mute">Due {longDate(i.due)}{ip > 0 && left > 0 ? ` · ${inr(ip)} paid, ${inr(left)} left` : ''}</div>
                </div>
                <div className="text-right text-[13px] font-semibold tabular-nums">
                  {inr(i.amount)}
                  <div className="mt-0.5">{left === 0 ? <Chip tone="green">Paid</Chip> : <Chip tone={st.tone}>{st.label}</Chip>}</div>
                </div>
                <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-hair/[0.07]"><div className="h-full rounded-full bg-green" style={{ width: (num(i.amount) ? (ip / num(i.amount)) * 100 : 0) + '%' }} /></div>
              </div>
            )
          })}
        </Block>

        <Block title="Payments received">
          {pays.length === 0 && <p className="text-[12.5px] text-mute">No payments yet.</p>}
          <div>
            {pays.map((p) => (
              <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-hair/[0.06] py-2 text-[13px] first:border-t-0">
                <div>
                  <b className="tabular-nums">{inr(p.amount)}</b>
                  <div className="text-[12px] text-mute">{longDate(p.date)} · {p.mode}{p.ref ? ' · ' + p.ref : ''}</div>
                </div>
                <span className="text-[12px] text-mute2">{p.receipt}</span>
                {confirm === p.id ? (
                  <span className="flex gap-2 text-[12px]">
                    <button type="button" onClick={() => { a.removePayment(x.id, p.id); setConfirm(''); say('Payment deleted.') }} className="font-semibold text-pink">Delete</button>
                    <button type="button" onClick={() => setConfirm('')} className="text-mute">Keep</button>
                  </span>
                ) : (
                  <span className="flex gap-3 text-[12.5px]">
                    <button type="button" onClick={() => onDialog('receipt', x.id, p.id)} className="font-semibold text-teal hover:underline">Receipt</button>
                    <button type="button" onClick={() => setConfirm(p.id)} aria-label="Delete payment" className="text-mute2 hover:text-pink">×</button>
                  </span>
                )}
              </div>
            ))}
          </div>
        </Block>

        <Block title="Notes">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); a.addNote(x.id, note); setNote('') }}>
            <input className="field flex-1" placeholder="e.g. Promised to pay after the 15th" aria-label="Add a note" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="submit" className="rounded-lg border border-hair/[0.14] px-3 text-[12.5px] font-medium hover:border-hair/[0.3]">Add</button>
          </form>
          <ul className="flex flex-col gap-2.5">
            {arr(x.notes).map((nt) => (
              <li key={nt.id} className="group flex items-start justify-between gap-3 text-[13px]">
                <div><div className="whitespace-pre-wrap break-words">{nt.text}</div><div className="text-[11.5px] text-mute2">{longDate(nt.date)}</div></div>
                <button type="button" onClick={() => a.removeNote(x.id, nt.id)} aria-label="Delete note" className="px-1 text-mute2 opacity-0 hover:text-fg focus:opacity-100 group-hover:opacity-100">×</button>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Reminders sent">
          {arr(x.reminders).length === 0
            ? <p className="text-[12.5px] text-mute">None yet.</p>
            : <ul className="flex flex-col gap-1 text-[12.5px] text-mute">{arr(x.reminders).map((r) => <li key={r.id}>{longDate(r.date)} · {r.note}</li>)}</ul>}
        </Block>

        <Block title="Details" action={<button type="button" onClick={() => setEditing((v) => !v)} className="text-[12.5px] font-semibold text-teal">{editing ? 'Done' : 'Edit'}</button>}>
          {editing ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Client / business</Label><input className="field" value={x.name} onChange={set('name')} /></div>
              <div><Label>What is it for?</Label><input className="field" placeholder={workFor({ service: x.service })} value={x.title || ''} onChange={set('title')} /></div>
              <div><Label>Contact person</Label><input className="field" value={x.person || ''} onChange={set('person')} /></div>
              <div><Label>Phone (for WhatsApp)</Label><input className="field" inputMode="tel" value={x.phone || ''} onChange={set('phone')} /></div>
              <div><Label>Service</Label><select className="select" value={x.service} onChange={set('service')}>{SERVICES.map((v) => <option key={v}>{v}</option>)}</select></div>
              <div>
                <Label>Fee (₹)</Label>
                <input className="field" type="number" min="0" step="500" value={x.deal || ''} onChange={(e) => a.patchSale(x.id, { deal: num(e.target.value) })} />
                {x.plan === 'instalments' && <div className="mt-1 text-[11.5px] text-mute2">Edit the plan too if the fee changes.</div>}
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
              <dt className="text-mute">Service</dt><dd>{x.service}</dd>
              <dt className="text-mute">Phone</dt><dd>{x.phone || '—'}</dd>
            </dl>
          )}
        </Block>

        <div className="border-t border-hair/[0.07] pt-4">
          {confirm === 'sale' ? (
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <span className="text-mute">Delete this sale, its payments and notes? This can't be undone.</span>
              <button type="button" onClick={() => { a.removeSale(x.id); say('Sale deleted.') }} className="rounded-lg bg-pink px-3 py-1.5 font-semibold text-onaccent">Delete sale</button>
              <button type="button" onClick={() => setConfirm('')} className="px-2 py-1.5 font-medium text-mute hover:text-fg">Keep it</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm('sale')} className="text-[12.5px] font-medium text-mute hover:text-pink">Delete sale</button>
          )}
        </div>
      </aside>
    </>
  )
}

function Block({ title, action, children }) {
  return (
    <section className="flex flex-col gap-2.5 border-t border-hair/[0.07] pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      {title && (
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-mute2">{title}</div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function Fig({ label, value, tone = '' }) {
  return (
    <div className="rounded-xl bg-hair/[0.04] px-3 py-2.5">
      <div className="text-[11.5px] text-mute">{label}</div>
      <div className={cn('font-head text-[16px] font-bold tabular-nums sm:text-[17px]', tone)}>{value}</div>
    </div>
  )
}
