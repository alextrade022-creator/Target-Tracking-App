import { useState } from 'react'
import { iso, pretty } from '../lib/helpers'
import { Section, Empty, Checkbox } from '../ws/ui'
import { Stat, Chip, ItemRow, RecordForm, AddLink } from './ui'
import { inr, num, arr, avgMonthly, monthKey, addMonths, monthLabel, loanMonthsLeft, nextDue, loanBalance, loanStatus, loanPaidMonths, LOAN_KINDS } from './lib'

export default function Loans({ pf }) {
  const { state: s, actions: a } = pf
  const [edit, setEdit] = useState('')
  const ym = monthKey()

  const fields = [
    { k: 'name', label: 'Loan name', required: true, placeholder: 'e.g. Home loan' },
    { k: 'lender', label: 'Lender', placeholder: 'e.g. SBI' },
    { k: 'kind', label: 'Type', type: 'select', options: LOAN_KINDS, default: LOAN_KINDS[0] },
    { k: 'emi', label: 'EMI (₹/month)', type: 'number', required: true },
    { k: 'outstanding', label: 'Outstanding (₹)', type: 'number' },
    { k: 'rate', label: 'Interest rate (% p.a.)', type: 'number' },
    { k: 'dueDay', label: 'EMI date (day of month)', type: 'number', placeholder: '1–31' },
    { k: 'endDate', label: 'Last EMI date', type: 'date', hint: 'Leave empty to estimate it' },
  ]

  const loans = arr(s.loans)
  // Balances after linked EMI payments (see loanBalance in lib.js)
  const live = loans.map((l) => ({ l, ...loanBalance(l, s.txns), st: loanStatus(l, s.txns, ym) }))
  const totalEmi = loans.reduce((t, l) => t + num(l.emi), 0)
  const outstanding = live.reduce((t, x) => t + x.balance, 0)
  const income = avgMonthly(s.txns, 'income', 3)
  const ratio = income > 0 ? (totalEmi / income) * 100 : null
  const left = live.map((x) => loanMonthsLeft({ ...x.l, outstanding: x.balance })).filter((m) => Number.isFinite(m))
  const freeBy = left.length && left.length === loans.length ? addMonths(ym, Math.max(...left) - 1) : null
  const paidCount = live.filter((x) => x.st.status === 'paid').length
  const today = iso(new Date())
  // A newly entered or changed outstanding counts from today; older linked EMIs are already in it.
  const stamp = (v, old) => (!old || num(v.outstanding) !== num(old.outstanding) ? { ...v, asOf: today } : v)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Total EMIs" value={inr(totalEmi)} sub={`${paidCount}/${loans.length} paid for ${monthLabel(ym)}`} />
        <Stat label="Outstanding" value={inr(outstanding)} sub={`${loans.length} loan(s)`} />
        <Stat
          label="EMI vs income"
          value={ratio === null ? '—' : Math.round(ratio) + '%'}
          tone={ratio === null ? '' : ratio > 50 ? 'text-pink' : ratio > 30 ? 'text-yellow' : 'text-green'}
          sub={ratio === null ? 'Needs income history' : ratio > 50 ? 'High — over half your income' : ratio > 30 ? 'Watch this' : 'Comfortable'}
        />
        <Stat label="Debt-free by" value={freeBy ? monthLabel(freeBy) : '—'} sub={freeBy ? 'If you keep paying as now' : 'Add end date or rate + outstanding'} />
      </div>

      <Section title="Loans & EMIs" right={edit !== 'new' && <AddLink onClick={() => setEdit('new')}>+ Add loan</AddLink>}>
        {edit === 'new' && (
          <RecordForm fields={fields} submitLabel="Add loan"
            onSave={(v) => { a.add('loans', { ...stamp(v), paidMonths: [] }); setEdit('') }} onCancel={() => setEdit('')} />
        )}
        {loans.length === 0 && edit !== 'new' && <Empty>No loans added. Nice.</Empty>}
        {live.map(({ l, balance, rows, st }) => {
          if (edit === l.id) {
            return <RecordForm key={l.id} fields={fields} initial={{ ...l, outstanding: balance }}
              onSave={(v) => { a.patch('loans', l.id, stamp(v, { outstanding: balance })); setEdit('') }} onCancel={() => setEdit('')} />
          }
          const m = loanMonthsLeft({ ...l, outstanding: balance })
          const recent = rows.slice(-3).reverse()
          return (
            <div key={l.id} className="border-b border-hair/[0.06] last:border-b-0 [&>div:first-child]:border-b-0">
              <ItemRow
                title={l.name || 'N/A'}
                meta={<>
                  <span>{[l.lender, l.kind].filter(Boolean).join(' · ') || 'N/A'}</span>
                  {num(l.rate) > 0 && <span>· {num(l.rate)}%</span>}
                  {balance > 0 && <span>· {inr(balance)} left</span>}
                  {m === Infinity
                    ? <Chip tone="red">EMI doesn't cover interest</Chip>
                    : m !== null && <span>· {m} months to go</span>}
                </>}
                extra={
                  <span className="flex items-center gap-2 text-[12.5px] text-mute">
                    {st.status === 'paid' && !st.manual ? (
                      <Chip tone="green">Paid for {monthLabel(ym, true)} · from expenses</Chip>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2">
                        <Checkbox checked={st.status === 'paid'} onClick={() => a.toggleLoanPaid(l.id, ym)} />
                        {st.status === 'paid'
                          ? `Paid for ${monthLabel(ym, true)}`
                          : st.status === 'part'
                            ? <span className="text-yellow">Part paid {inr(st.paid)} of {inr(l.emi)}</span>
                            : `Due ${pretty(nextDue(l, new Date(), loanPaidMonths(l, s.txns)))}`}
                      </label>
                    )}
                  </span>
                }
                value={inr(l.emi) + '/mo'}
                onEdit={() => setEdit(l.id)}
                onRemove={() => { if (window.confirm(`Delete ${l.name}? Linked EMI expenses stay, unlinked.`)) a.remove('loans', l.id) }}
              />
              {recent.length > 0 && (
                <div className="-mt-1 flex flex-wrap gap-x-4 gap-y-1 px-5 pb-3 text-[12px] text-mute">
                  <span className="font-medium text-mute2">Linked EMIs:</span>
                  {recent.map(({ t, interest, principal }) => (
                    <span key={t.id} title={`${inr(interest)} interest · ${inr(principal)} off the loan`}>
                      {pretty(t.date)} · {inr(t.amount)}
                      <span className="text-mute2"> ({inr(principal)} off the loan)</span>
                    </span>
                  ))}
                  {rows.length > 3 && <span className="text-mute2">+{rows.length - 3} more</span>}
                </div>
              )}
            </div>
          )
        })}
      </Section>
    </div>
  )
}
