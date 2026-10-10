import { useState } from 'react'
import { pretty } from '../lib/helpers'
import { Section, Empty, Checkbox } from '../ws/ui'
import { Stat, Chip, ItemRow, RecordForm, AddLink } from './ui'
import { inr, num, arr, sumBy, avgMonthly, monthKey, addMonths, monthLabel, loanMonthsLeft, nextDue, LOAN_KINDS } from './lib'

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
  const totalEmi = sumBy(loans, 'emi')
  const outstanding = sumBy(loans, 'outstanding')
  const income = avgMonthly(s.txns, 'income', 3)
  const ratio = income > 0 ? (totalEmi / income) * 100 : null
  const left = loans.map(loanMonthsLeft).filter((m) => Number.isFinite(m))
  const freeBy = left.length && left.length === loans.length ? addMonths(ym, Math.max(...left) - 1) : null
  const paidCount = loans.filter((l) => arr(l.paidMonths).includes(ym)).length

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
            onSave={(v) => { a.add('loans', { ...v, paidMonths: [] }); setEdit('') }} onCancel={() => setEdit('')} />
        )}
        {loans.length === 0 && edit !== 'new' && <Empty>No loans added. Nice.</Empty>}
        {loans.map((l) => {
          if (edit === l.id) {
            return <RecordForm key={l.id} fields={fields} initial={l}
              onSave={(v) => { a.patch('loans', l.id, v); setEdit('') }} onCancel={() => setEdit('')} />
          }
          const m = loanMonthsLeft(l)
          const paid = arr(l.paidMonths).includes(ym)
          return (
            <ItemRow key={l.id}
              title={l.name || 'N/A'}
              meta={<>
                <span>{[l.lender, l.kind].filter(Boolean).join(' · ') || 'N/A'}</span>
                {num(l.rate) > 0 && <span>· {num(l.rate)}%</span>}
                {num(l.outstanding) > 0 && <span>· {inr(l.outstanding)} left</span>}
                {m === Infinity
                  ? <Chip tone="red">EMI doesn't cover interest</Chip>
                  : m !== null && <span>· {m} months to go</span>}
              </>}
              extra={
                <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-mute">
                  <Checkbox checked={paid} onClick={() => a.toggleLoanPaid(l.id, ym)} />
                  {paid ? `Paid for ${monthLabel(ym, true)}` : `Due ${pretty(nextDue(l))}`}
                </label>
              }
              value={inr(l.emi) + '/mo'}
              onEdit={() => setEdit(l.id)}
              onRemove={() => { if (window.confirm(`Delete ${l.name}?`)) a.remove('loans', l.id) }} />
          )
        })}
      </Section>
    </div>
  )
}
