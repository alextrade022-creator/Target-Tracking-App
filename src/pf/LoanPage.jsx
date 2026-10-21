import { useState } from 'react'
import { cn, iso, pretty } from '../lib/helpers'
import { Label } from '../ws/ui'
import { Modal } from '../crm/bits'
import { Stat, Chip } from './ui'
import { LoanForm } from './Loans'
import { inr, num, arr, monthKey, monthLabel, loanLedger, loanStatus, isFlexible } from './lib'

const COLORS = ['#2563EB', '#7C5AE8', '#0FA3A3', '#C6871B', '#DC4A63', '#16A34A']

export default function LoanPage({ pf, loan: l }) {
  const { state: s, actions: a } = pf
  const [editing, setEditing] = useState(false)
  const [payment, setPayment] = useState(null) // null | { txn? } — txn set when editing a payment's split
  const [people, setPeople] = useState(false)
  const [confirm, setConfirm] = useState('') // '' | 'loan' | <txn id>

  const led = loanLedger(l, s.txns)
  const contributors = arr(s.settings?.contributors)
  const nameOf = (id) => (id === 'me' ? 'Me' : contributors.find((c) => c.id === id)?.name || 'Removed person')
  const colorOf = (id) => (id === 'me' ? COLORS[0] : COLORS[1 + (Math.max(0, contributors.findIndex((c) => c.id === id)) % (COLORS.length - 1))])
  const borrowed = num(l.amount) || led.open.balance + led.open.principal
  const repaidPct = borrowed ? Math.min(100, ((borrowed - led.balance) / borrowed) * 100) : 0
  const paidSince = led.principalSince + led.interestSince
  const pPct = paidSince ? (led.principalSince / paidSince) * 100 : 0
  const byIds = Object.keys(led.by).sort((x, y) => (x === 'me' ? -1 : y === 'me' ? 1 : led.by[y] - led.by[x]))
  const byTotal = byIds.reduce((t, k) => t + led.by[k], 0) || 1
  const st = loanStatus(l, s.txns, monthKey())

  return (
    <div className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => a.openLoan('')} className="text-[13px] font-medium text-teal hover:text-teal-lt">← All loans</button>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[12.5px] text-mute">
              {[l.lender, l.kind, num(l.rate) ? num(l.rate) + '%' : '', l.start ? 'started ' + pretty(l.start) : ''].filter(Boolean).join(' · ')}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h2 className="font-head text-[22px] font-bold">{l.name || 'Loan'}</h2>
              {isFlexible(l) ? <Chip tone="slate">Flexible payments</Chip> : <Chip tone="blue">Fixed EMI {inr(l.emi)}/mo</Chip>}
              {!isFlexible(l) && st.status === 'paid' && <Chip tone="green">Paid for {monthLabel(monthKey(), true)}</Chip>}
              {!isFlexible(l) && st.status === 'part' && <Chip tone="amber">Part paid {inr(st.paid)}</Chip>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-lg border border-hair/[0.14] px-3.5 py-2 text-[13px] font-medium hover:border-hair/[0.3]">{editing ? 'Close' : 'Edit loan'}</button>
            <button type="button" onClick={() => setPayment({})} className="rounded-lg bg-teal px-4 py-2 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">+ Record payment</button>
          </div>
        </div>
      </div>

      {editing && (
        <section className="panel">
          <LoanForm initial={l} submitLabel="Save loan" onCancel={() => setEditing(false)} onSave={(v) => { a.patch('loans', l.id, v); setEditing(false) }} />
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Left to repay" value={inr(led.balance)} sub={borrowed ? `of ${inr(borrowed)} borrowed` : ''} />
        <Stat label="Principal repaid" value={inr(led.principalPaid)} tone="text-teal" sub={`${Math.round(repaidPct)}% of the loan`} />
        <Stat label="Interest paid" value={inr(led.interestPaid)} tone="text-orange" sub="Since the loan started" />
        <Stat label="Total paid" value={inr(led.principalPaid + led.interestPaid)} sub="Principal + interest" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="panel px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-head text-[15px] font-semibold">Where your payments went</h3>
            {led.open.date && <span className="text-[12px] text-mute">since {pretty(led.open.date)}</span>}
          </div>
          {paidSince ? (
            <>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-hair/[0.07]">
                <div className="h-full bg-teal" style={{ width: pPct + '%' }} />
                <div className="h-full bg-orange" style={{ width: 100 - pPct + '%' }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-[12.5px] text-mute">
                <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-teal align-[-1px]" />Principal {inr(led.principalSince)} ({Math.round(pPct)}%)</span>
                <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-orange align-[-1px]" />Interest {inr(led.interestSince)} ({Math.round(100 - pPct)}%)</span>
              </div>
            </>
          ) : <p className="mt-2 text-[13px] text-mute">No payments recorded yet.</p>}
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
            <dt className="text-mute">Opening balance{led.open.date ? ` on ${pretty(led.open.date)}` : ''}</dt><dd className="text-right tabular-nums">{inr(led.open.balance)}</dd>
            <dt className="text-mute">Principal repaid before that</dt><dd className="text-right tabular-nums">{inr(led.open.principal)}</dd>
            <dt className="text-mute">Interest paid before that</dt><dd className="text-right tabular-nums">{inr(led.open.interest)}</dd>
          </dl>
        </section>

        <section className="panel px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-head text-[15px] font-semibold">Who paid</h3>
            <button type="button" onClick={() => setPeople(true)} className="text-[12.5px] font-semibold text-teal">Contributors</button>
          </div>
          {byIds.length === 0 ? <p className="mt-2 text-[13px] text-mute">No payments recorded yet.</p> : (
            <>
              <div className="mt-3 flex flex-col gap-2.5">
                {byIds.map((k) => (
                  <div key={k} className="flex items-center gap-2.5 text-[13.5px]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(k) }} />
                    <span className="flex-1">{nameOf(k)}</span>
                    <b className="tabular-nums">{inr(led.by[k])}</b>
                    <span className="w-9 text-right text-[12px] text-mute">{Math.round((led.by[k] / byTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-hair/[0.07]">
                {byIds.map((k) => <div key={k} className="h-full" style={{ width: (led.by[k] / byTotal) * 100 + '%', background: colorOf(k) }} />)}
              </div>
              {byIds.length > 1 && <p className="mt-3 text-[12.5px] text-mute">Your own cost of this loan so far: <b className="text-fg">{inr(led.by.me || 0)}</b></p>}
            </>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/[0.07] px-5 py-3">
          <h3 className="font-head text-[15px] font-semibold">Payments</h3>
          <span className="text-[12.5px] text-mute">{led.rows.length} payment{led.rows.length === 1 ? '' : 's'} · {inr(paidSince)}</span>
        </div>
        {led.estimated > 0 && (
          <div className="border-b border-hair/[0.07] bg-yellow/[0.08] px-5 py-2.5 text-[12.5px]">
            {led.estimated} payment{led.estimated === 1 ? ' was' : 's were'} linked from Expenses without a principal/interest split, so {led.estimated === 1 ? 'it is' : 'they are'} estimated. Click <b>Enter split</b> and copy the figures from your bank statement.
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px] tabular-nums">
            <thead>
              <tr className="border-b border-hair/[0.07] text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-3 py-2.5 text-right">Principal</th>
                <th className="px-3 py-2.5 text-right">Interest</th>
                <th className="px-3 py-2.5 text-right">Total paid</th>
                <th className="px-3 py-2.5">Funded by</th>
                <th className="px-3 py-2.5 text-right">Balance after</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {led.rows.slice().reverse().map((r) => (
                <tr key={r.t.id} className="border-b border-hair/[0.06]">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {pretty(r.t.date)}
                    {r.t.note && <div className="max-w-[160px] truncate text-[11.5px] text-mute" title={r.t.note}>{r.t.note}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-teal">{inr(r.principal)}{r.estimated && <span className="text-mute2">*</span>}</td>
                  <td className="px-3 py-2.5 text-right text-orange">{inr(r.interest)}{r.estimated && <span className="text-mute2">*</span>}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{inr(r.t.amount)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {r.funded.map((f) => (
                        <span key={f.who} className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: colorOf(f.who), background: colorOf(f.who) + '1f' }}>{nameOf(f.who)} {inr(f.amount)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">{inr(r.after)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[12.5px]">
                    {confirm === r.t.id ? (
                      <span className="flex justify-end gap-2">
                        <button type="button" onClick={() => { a.remove('txns', r.t.id); setConfirm('') }} className="font-semibold text-pink">Delete</button>
                        <button type="button" onClick={() => setConfirm('')} className="text-mute">Keep</button>
                      </span>
                    ) : (
                      <span className="flex justify-end gap-3">
                        <button type="button" onClick={() => setPayment({ txn: r.t })} className={cn('font-semibold', r.estimated ? 'text-yellow' : 'text-teal')}>{r.estimated ? 'Enter split' : 'Edit'}</button>
                        <button type="button" onClick={() => setConfirm(r.t.id)} className="text-mute hover:text-pink">Delete</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-hair/[0.03] text-[12.5px] text-mute">
                <td className="px-4 py-2.5">{led.open.date ? pretty(led.open.date) : '—'}</td>
                <td colSpan={4} className="px-3 py-2.5">Opening balance (entered with the loan)</td>
                <td className="px-3 py-2.5 text-right">{inr(led.open.balance)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-[12px] text-mute">
          Every payment is also in Expenses as an <b>EMI &amp; loan payment</b> for the full amount you paid.
          {led.estimated > 0 && ' * estimated split.'}
        </p>
      </section>

      <div>
        {confirm === 'loan' ? (
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="text-mute">Delete this loan? Its payments stay in Expenses, unlinked.</span>
            <button type="button" onClick={() => { a.remove('loans', l.id); a.openLoan('') }} className="rounded-lg bg-pink px-3 py-1.5 font-semibold text-onaccent">Delete loan</button>
            <button type="button" onClick={() => setConfirm('')} className="font-medium text-mute hover:text-fg">Keep</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm('loan')} className="text-[12.5px] font-medium text-mute hover:text-pink">Delete loan</button>
        )}
      </div>

      {payment && <PaymentDialog pf={pf} loan={l} balance={led.balance} txn={payment.txn} onClose={() => setPayment(null)} />}
      {people && <ContributorsDialog pf={pf} onClose={() => setPeople(false)} />}
    </div>
  )
}

/* Record a payment, or enter / correct the split of an existing one. */
function PaymentDialog({ pf, loan: l, balance, txn, onClose }) {
  const { state: s, actions: a } = pf
  const contributors = arr(s.settings?.contributors)
  const [date, setDate] = useState(txn?.date || iso(new Date()))
  const [principal, setPrincipal] = useState(txn?.loanPrincipal != null ? String(txn.loanPrincipal) : '')
  const [interest, setInterest] = useState(txn?.loanInterest != null ? String(txn.loanInterest) : '')
  const [note, setNote] = useState(txn?.note || '')
  const [funded, setFunded] = useState(() => arr(txn?.loanFunded).map((f) => ({ who: f.who, amount: String(f.amount) })))
  const [newName, setNewName] = useState('')
  const [err, setErr] = useState('')

  const p = num(principal), i = num(interest), total = p + i
  const others = funded.reduce((t, f) => t + num(f.amount), 0)
  const mine = Math.max(0, total - others)
  // An existing payment's amount comes from Expenses; the split must add up to it.
  const fixedAmount = txn ? num(txn.amount) : 0
  const balanceAfter = Math.max(0, balance + (txn && txn.loanPrincipal != null ? num(txn.loanPrincipal) : 0) - p)

  const addPerson = (id) => setFunded(funded.concat([{ who: id, amount: '' }]))
  const save = () => {
    if (!total) { setErr('Enter the principal and interest from the bank statement.'); return }
    if (txn && Math.abs(total - fixedAmount) > 1) { setErr(`Principal + interest must add up to the ${inr(fixedAmount)} paid. Now ${inr(total)}.`); return }
    if (others > total) { setErr('Contributions are more than the payment.'); return }
    const loanFunded = funded.filter((f) => f.who && num(f.amount) > 0).map((f) => ({ who: f.who, amount: num(f.amount) }))
    const fields = { date, loanPrincipal: p, loanInterest: i, loanFunded, note: note.trim(), loanId: l.id }
    if (txn) a.patch('txns', txn.id, fields)
    else a.add('txns', { ...fields, desc: `${l.name || 'Loan'} payment`, amount: total, type: 'expense', category: 'emi', source: 'manual' })
    onClose()
  }

  return (
    <Modal title={txn ? `Payment of ${inr(txn.amount)} · ${l.name}` : `Record payment · ${l.name}`} hint={isFlexible(l) ? 'Flexible loan: enter what you paid this time, split as on the bank statement.' : `Fixed EMI of ${inr(l.emi)}. Copy the principal and interest split from your bank statement.`} onClose={onClose} width={560}>
      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><Label>Date</Label><input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Principal (₹)</Label><input className="field" type="number" min="0" step="100" autoFocus value={principal} onChange={(e) => { setPrincipal(e.target.value); setErr('') }} /></div>
          <div><Label>Interest (₹)</Label><input className="field" type="number" min="0" step="100" value={interest} onChange={(e) => { setInterest(e.target.value); setErr('') }} /></div>
        </div>

        <div>
          <Label>Who paid</Label>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_140px_24px] items-center gap-2 text-[13px]">
              <span className="font-medium">Me (my account)</span>
              <input className="field py-2 opacity-70" disabled value={inr(mine)} aria-label="My share" />
              <span />
            </div>
            {funded.map((f, k) => (
              <div key={k} className="grid grid-cols-[minmax(0,1fr)_140px_24px] items-center gap-2">
                <select className="select py-2" value={f.who} onChange={(e) => setFunded(funded.map((x, j) => (j === k ? { ...x, who: e.target.value } : x)))} aria-label="Contributor">
                  {contributors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="field py-2" type="number" min="0" step="100" placeholder="Amount" value={f.amount} onChange={(e) => setFunded(funded.map((x, j) => (j === k ? { ...x, amount: e.target.value } : x)))} aria-label="Contribution" />
                <button type="button" onClick={() => setFunded(funded.filter((_, j) => j !== k))} aria-label="Remove" className="text-[16px] text-mute2 hover:text-pink">×</button>
              </div>
            ))}
            {contributors.length > 0 && (
              <button type="button" onClick={() => addPerson(contributors[0].id)} className="w-fit text-[12.5px] font-semibold text-teal">+ Someone contributed</button>
            )}
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const id = a.addContributor(newName); if (id) { addPerson(id); setNewName('') } }}>
              <input className="field py-1.5 text-[13px]" placeholder={contributors.length ? 'Or add a new person, e.g. Spouse' : 'Did someone contribute? Add their name, e.g. Father'} value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="New contributor" />
              <button type="submit" disabled={!newName.trim()} className="rounded-lg border border-hair/[0.14] px-3 text-[12.5px] font-medium disabled:opacity-40">Add</button>
            </form>
          </div>
        </div>

        <div><Label>Note (optional)</Label><input className="field" placeholder="e.g. Part prepayment" value={note} onChange={(e) => setNote(e.target.value)} /></div>

        <div className="grid gap-1 rounded-xl bg-hair/[0.04] px-3 py-2.5 text-[13px]">
          <span>Total paid{l.lender ? ` to ${l.lender}` : ''}: <b className="tabular-nums">{inr(total)}</b> ({inr(p)} principal + {inr(i)} interest)</span>
          {txn && <span className={cn(Math.abs(total - fixedAmount) > 1 ? 'text-pink' : 'text-mute')}>Amount in Expenses: {inr(fixedAmount)}</span>}
          <span>Balance after this payment: <b className="tabular-nums">{inr(balanceAfter)}</b></span>
          {others > 0 && <span>Your share: <b>{inr(mine)}</b> · from others: <b>{inr(others)}</b></span>}
        </div>
        {err && <p className="text-[12.5px] text-pink">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-teal px-4 py-2 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">Save payment</button>
        </div>
      </div>
    </Modal>
  )
}

function ContributorsDialog({ pf, onClose }) {
  const { state: s, actions: a } = pf
  const [name, setName] = useState('')
  const list = arr(s.settings?.contributors)
  const used = (id) => arr(s.txns).filter((t) => arr(t.loanFunded).some((f) => f.who === id)).length
  return (
    <Modal title="Contributors" hint="People who sometimes give you money towards a loan. You are always included as “Me”." onClose={onClose}>
      <div className="grid gap-3">
        <div className="flex flex-col divide-y divide-hair/[0.07]">
          {list.map((c) => (
            <div key={c.id} className="flex items-center gap-2 py-2">
              <input className="field flex-1 py-1.5" value={c.name} onChange={(e) => a.renameContributor(c.id, e.target.value)} aria-label="Name" />
              <span className="w-[86px] text-right text-[12px] text-mute2">{used(c.id)} payment{used(c.id) === 1 ? '' : 's'}</span>
              <button type="button" disabled={used(c.id) > 0} title={used(c.id) ? 'Used in payments, so it can only be renamed' : 'Remove'} onClick={() => a.removeContributor(c.id)} className="px-1 text-[16px] text-mute2 hover:text-pink disabled:opacity-30">×</button>
            </div>
          ))}
          {list.length === 0 && <p className="py-2 text-[12.5px] text-mute2">No contributors yet.</p>}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (a.addContributor(name)) setName('') }}>
          <input className="field flex-1" placeholder="Add a name, e.g. Father" value={name} onChange={(e) => setName(e.target.value)} aria-label="New contributor" />
          <button type="submit" disabled={!name.trim()} className="rounded-lg bg-teal px-3.5 py-2 text-[13px] font-semibold text-onaccent disabled:opacity-40">Add</button>
        </form>
        <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Done</button></div>
      </div>
    </Modal>
  )
}
