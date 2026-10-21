import { useState } from 'react'
import { cn, iso, pretty } from '../lib/helpers'
import { Section, Empty, Checkbox, Label } from '../ws/ui'
import { Stat, Chip, AddLink } from './ui'
import LoanPage from './LoanPage'
import {
  inr, num, arr, avgMonthly, monthKey, addMonths, monthLabel, loanMonthsLeft, nextDue, loanLedger, loanStatus,
  loanPaidMonths, loanOpening, isFlexible, LOAN_KINDS,
} from './lib'

export default function Loans({ pf }) {
  const { state: s, actions: a } = pf
  const [adding, setAdding] = useState(false)
  const ym = monthKey()
  const loans = arr(s.loans)
  const open = loans.find((l) => l.id === s.loanId)
  if (open) return <LoanPage pf={pf} loan={open} />

  const live = loans.map((l) => ({ l, led: loanLedger(l, s.txns), st: loanStatus(l, s.txns, ym) }))
  const fixed = live.filter((x) => !isFlexible(x.l))
  const totalEmi = fixed.reduce((t, x) => t + num(x.l.emi), 0)
  const outstanding = live.reduce((t, x) => t + x.led.balance, 0)
  const principal = live.reduce((t, x) => t + x.led.principalPaid, 0)
  const interest = live.reduce((t, x) => t + x.led.interestPaid, 0)
  const income = avgMonthly(s.txns, 'income', 3)
  const ratio = income > 0 && totalEmi ? (totalEmi / income) * 100 : null
  const left = fixed.map((x) => loanMonthsLeft({ ...x.l, outstanding: x.led.balance })).filter((m) => Number.isFinite(m))
  const freeBy = left.length && left.length === loans.length ? addMonths(ym, Math.max(...left) - 1) : null
  const paidCount = fixed.filter((x) => x.st.status === 'paid').length

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Outstanding" value={inr(outstanding)} sub={`${loans.length} loan${loans.length === 1 ? '' : 's'}`} />
        <Stat label="Principal repaid" value={inr(principal)} tone="text-teal" sub="All loans, since they started" />
        <Stat label="Interest paid" value={inr(interest)} tone="text-orange" sub="Money that went to the lenders" />
        <Stat
          label="Fixed EMIs"
          value={totalEmi ? inr(totalEmi) : '—'}
          sub={fixed.length ? `${paidCount}/${fixed.length} paid for ${monthLabel(ym)}${ratio !== null ? ` · ${Math.round(ratio)}% of income` : ''}` : 'No fixed-EMI loans'}
        />
      </div>

      <Section title="Loans & EMIs" right={!adding && <AddLink onClick={() => setAdding(true)}>+ Add loan</AddLink>}>
        {adding && (
          <LoanForm
            onCancel={() => setAdding(false)}
            onSave={(v) => { const id = a.add('loans', { ...v, paidMonths: [] }); setAdding(false); a.openLoan(id) }}
          />
        )}
        {loans.length === 0 && !adding && <Empty>No loans added. Nice.</Empty>}
        {live.map(({ l, led, st }) => {
          const borrowed = num(l.amount) || led.open.balance + led.open.principal
          const repaid = Math.max(0, borrowed - led.balance)
          const pct = borrowed ? Math.min(100, (repaid / borrowed) * 100) : 0
          const months = isFlexible(l) ? null : loanMonthsLeft({ ...l, outstanding: led.balance })
          const others = Object.keys(led.by).filter((k) => k !== 'me')
          const names = Object.fromEntries(arr(s.settings?.contributors).map((c) => [c.id, c.name]))
          return (
            <div key={l.id} className="border-b border-hair/[0.06] last:border-b-0">
              <button type="button" onClick={() => a.openLoan(l.id)} className="block w-full px-5 py-4 text-left hover:bg-hair/[0.02]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold">{l.name || 'N/A'}</span>
                      {isFlexible(l) ? <Chip tone="slate">Flexible payments</Chip> : <Chip tone="blue">Fixed EMI {inr(l.emi)}/mo</Chip>}
                      {led.estimated > 0 && <Chip tone="amber">{led.estimated} split{led.estimated === 1 ? '' : 's'} to enter</Chip>}
                      <span className="text-[13px] text-mute2" aria-hidden="true">›</span>
                    </div>
                    <div className="mt-1 text-[12.5px] text-mute">
                      {[l.lender, l.kind].filter(Boolean).join(' · ') || 'N/A'}
                      {num(l.rate) > 0 && ` · ${num(l.rate)}%`}
                      {months === Infinity ? ' · EMI doesn\'t cover interest' : months ? ` · ${months} months to go` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-head text-[18px] font-bold tabular-nums">{inr(led.balance)}</div>
                    <div className="text-[12px] text-mute">left to repay</div>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-hair/[0.07]"><div className="h-full rounded-full bg-teal" style={{ width: pct + '%' }} /></div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mute">
                  <span>{Math.round(pct)}% repaid</span>
                  <span>Interest paid {inr(led.interestPaid)}</span>
                  {others.map((k) => <span key={k}>{names[k] || 'Someone'} contributed {inr(led.by[k])}</span>)}
                </div>
              </button>
              <div className="-mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 px-5 pb-3.5 text-[12.5px] text-mute">
                {!isFlexible(l) && (st.status === 'paid' && !st.manual ? (
                    <Chip tone="green">Paid for {monthLabel(ym, true)}</Chip>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox checked={st.status === 'paid'} onClick={() => a.toggleLoanPaid(l.id, ym)} />
                      {st.status === 'paid'
                        ? `Paid for ${monthLabel(ym, true)}`
                        : st.status === 'part'
                          ? <span className="text-yellow">Part paid {inr(st.paid)} of {inr(l.emi)}</span>
                          : `Due ${pretty(nextDue(l, new Date(), loanPaidMonths(l, s.txns)))}`}
                    </label>
                  ))}
                <div className="ml-auto flex flex-wrap gap-2">
                  {led.estimated > 0 && (
                    <button type="button" onClick={() => a.openLoan(l.id, 'split')} className="rounded-lg border border-yellow/50 bg-yellow/[0.1] px-3 py-1.5 font-semibold text-yellow hover:bg-yellow/[0.16]">
                      Enter split
                    </button>
                  )}
                  <button type="button" onClick={() => a.openLoan(l.id, 'edit')} className="rounded-lg border border-hair/[0.14] px-3 py-1.5 font-medium text-fg hover:border-hair/[0.3]">Edit</button>
                  <button type="button" onClick={() => a.openLoan(l.id, 'record')} className="rounded-lg border border-hair/[0.14] px-3 py-1.5 font-medium text-fg hover:border-hair/[0.3]">+ Record payment</button>
                  <button type="button" onClick={() => a.openLoan(l.id)} className="rounded-lg bg-teal px-3 py-1.5 font-semibold text-onaccent hover:bg-teal-lt">Open loan →</button>
                </div>
              </div>
            </div>
          )
        })}
      </Section>
    </div>
  )
}

/* Add / edit a loan. "Where it stands today" is the opening position the ledger starts from. */
export function LoanForm({ initial, onSave, onCancel, submitLabel = 'Add loan' }) {
  const o = initial ? loanOpening(initial) : null
  const [v, setV] = useState(() => ({
    name: initial?.name || '',
    lender: initial?.lender || '',
    kind: initial?.kind || LOAN_KINDS[0],
    mode: initial?.mode || (initial && !num(initial.emi) ? 'flexible' : 'fixed'),
    amount: initial?.amount || '',
    rate: initial?.rate || '',
    emi: initial?.emi || '',
    dueDay: initial?.dueDay || '',
    start: initial?.start || '',
    endDate: initial?.endDate || '',
    balance: o ? o.balance : '',
    principal: o ? o.principal || '' : '',
    interest: o ? o.interest || '' : '',
  }))
  const [err, setErr] = useState('')
  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); setErr('') }
  const fixed = v.mode === 'fixed'

  const save = () => {
    if (!v.name.trim()) { setErr('Enter a name for the loan.'); return }
    if (fixed && !num(v.emi)) { setErr('Enter the EMI, or choose flexible payments.'); return }
    const balance = v.balance === '' ? num(v.amount) : num(v.balance)
    const same = o && balance === o.balance && num(v.principal) === o.principal && num(v.interest) === o.interest
    onSave({
      name: v.name.trim(), lender: v.lender.trim(), kind: v.kind, mode: v.mode,
      amount: num(v.amount), rate: num(v.rate), emi: fixed ? num(v.emi) : 0, dueDay: fixed ? num(v.dueDay) : 0,
      start: v.start, endDate: fixed ? v.endDate : '',
      outstanding: balance,
      // A changed opening position starts the ledger again from today.
      opening: same ? initial.opening || { ...o } : { date: iso(new Date()), balance, principal: num(v.principal), interest: num(v.interest) },
    })
  }

  return (
    <div className="border-b border-hair/[0.07] bg-hair/[0.02] px-5 py-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2"><Label>Loan name *</Label><input className="field" placeholder="e.g. Home loan" value={v.name} onChange={set('name')} /></div>
        <div><Label>Lender</Label><input className="field" placeholder="e.g. SBI" value={v.lender} onChange={set('lender')} /></div>
        <div>
          <Label>Type</Label>
          <select className="select" value={v.kind} onChange={set('kind')}>{LOAN_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        </div>
        <div className="sm:col-span-2">
          <Label>How do you repay?</Label>
          <div className="flex flex-wrap gap-2">
            {[['fixed', 'Fixed EMI every month'], ['flexible', 'Flexible: any amount, any time']].map(([k, t]) => (
              <button key={k} type="button" onClick={() => setV({ ...v, mode: k })} aria-pressed={v.mode === k}
                className={cn('rounded-lg border px-3 py-2 text-[13px] font-medium', v.mode === k ? 'border-teal bg-teal/[0.07] text-teal' : 'border-hair/[0.14] text-mute hover:text-fg')}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div><Label>Amount borrowed (₹)</Label><input className="field" type="number" min="0" step="1000" value={v.amount} onChange={set('amount')} /></div>
        <div><Label>Interest rate (% p.a.)</Label><input className="field" type="number" min="0" step="0.05" value={v.rate} onChange={set('rate')} /></div>
        {fixed && <div><Label>EMI (₹/month) *</Label><input className="field" type="number" min="0" step="100" value={v.emi} onChange={set('emi')} /></div>}
        {fixed && <div><Label>EMI date (day of month)</Label><input className="field" type="number" min="1" max="31" placeholder="1–31" value={v.dueDay} onChange={set('dueDay')} /></div>}
        <div><Label>Loan start date</Label><input className="field" type="date" value={v.start} onChange={set('start')} /></div>
        {fixed && <div><Label>Last EMI date</Label><input className="field" type="date" value={v.endDate} onChange={set('endDate')} /></div>}
      </div>
      <div className="mt-4 text-[12.5px] font-medium">Where it stands today <span className="font-normal text-mute">(from your loan statement)</span></div>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div><Label>Outstanding now (₹)</Label><input className="field" type="number" min="0" step="1000" placeholder="Same as amount borrowed" value={v.balance} onChange={set('balance')} /></div>
        <div><Label>Principal repaid so far (₹)</Label><input className="field" type="number" min="0" step="1000" value={v.principal} onChange={set('principal')} /></div>
        <div><Label>Interest paid so far (₹)</Label><input className="field" type="number" min="0" step="1000" value={v.interest} onChange={set('interest')} /></div>
      </div>
      {initial && <div className="mt-1.5 text-[11.5px] text-mute2">Changing these restarts the payment history from today. Payments before today stay in Expenses.</div>}
      {err && <p className="mt-2 text-[12.5px] text-pink">{err}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Cancel</button>
        <button type="button" onClick={save} className="rounded-lg bg-teal px-4 py-2 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">{submitLabel}</button>
      </div>
    </div>
  )
}
