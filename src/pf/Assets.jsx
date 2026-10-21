import { useState } from 'react'
import { iso, pretty } from '../lib/helpers'
import { Section, Empty } from '../ws/ui'
import { Stat, Chip, ItemRow, RecordForm, AddLink } from './ui'
import { TransferDialog } from './Accounts'
import { inr, num, arr, sumBy, purposeOptions, purposeLabel, INVEST_KINDS, SAVINGS_KINDS } from './lib'

const KIND_COLORS = ['#2563EB', '#16A34A', '#7C5AE8', '#DD6A1E', '#0FA3A3', '#C6871B', '#DC4A63', '#5B6B7C', '#B45FD6', '#15803D', '#2D74D8', '#64748B']

export default function Assets({ pf }) {
  const { state: s, actions: a } = pf
  const [edit, setEdit] = useState('') // id being edited, or 'new-savings' / 'new-inv'
  const [transfer, setTransfer] = useState(null) // null | { from?, to? }
  const purpose = purposeOptions(s.goals)

  const savingsFields = [
    { k: 'name', label: 'Account name', required: true, placeholder: 'e.g. HDFC savings' },
    { k: 'kind', label: 'Type', type: 'select', options: SAVINGS_KINDS, default: SAVINGS_KINDS[0] },
    { k: 'balance', label: 'Balance (₹)', type: 'number', required: true },
    { k: 'asOf', label: 'Balance on date', type: 'date', hint: 'Transactions from this date on change the balance. Pick an earlier date if you import older statements.' },
    { k: 'purpose', label: 'Set aside for', type: 'select', options: purpose, hint: 'Counts toward that goal / emergency fund' },
  ]
  const invFields = [
    { k: 'name', label: 'Name', required: true, placeholder: 'e.g. Parag Parikh Flexi Cap' },
    { k: 'kind', label: 'Type', type: 'select', options: INVEST_KINDS, default: INVEST_KINDS[0] },
    { k: 'invested', label: 'Amount invested (₹)', type: 'number', required: true },
    { k: 'current', label: 'Current value (₹)', type: 'number', required: true, hint: 'Transfers into it add to both amounts.' },
    { k: 'asOf', label: 'Value on date', type: 'date' },
    { k: 'monthlySip', label: 'Monthly SIP (₹)', type: 'number', placeholder: '0 if none' },
    { k: 'purpose', label: 'Set aside for', type: 'select', options: purpose },
  ]

  const savingsTotal = sumBy(s.savings, 'balance')
  const invested = sumBy(s.investments, 'invested')
  const current = sumBy(s.investments, 'current')
  const gain = current - invested
  const sip = sumBy(s.investments, 'monthlySip')

  const byKind = {}
  arr(s.investments).forEach((i) => { byKind[i.kind || 'Other'] = (byKind[i.kind || 'Other'] || 0) + num(i.current) })
  const alloc = Object.entries(byKind).sort((x, y) => y[1] - x[1])

  const purposeChip = (p) => {
    const label = purposeLabel(p, s.goals)
    return label ? <Chip tone="blue">{label}</Chip> : null
  }

  const moved = (x) => (x.moves ? <span className="text-mute2">· {x.moves} transaction{x.moves === 1 ? '' : 's'} since {pretty(x.since)}</span> : null)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button type="button" onClick={() => setTransfer({})} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">⇄ Transfer money</button>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Savings & cash" value={inr(savingsTotal)} sub={`${arr(s.savings).length} accounts`} />
        <Stat label="Investments (current)" value={inr(current)} sub={`${inr(invested)} invested`} />
        <Stat
          label="Gain / loss"
          value={(gain >= 0 ? '+' : '−') + inr(Math.abs(gain))}
          tone={gain >= 0 ? 'text-green' : 'text-pink'}
          sub={invested > 0 ? `${((gain / invested) * 100).toFixed(1)}% overall` : '—'}
        />
        <Stat label="Monthly SIPs" value={inr(sip)} sub="Going in every month" />
      </div>

      <Section title="Savings & bank accounts" right={edit !== 'new-savings' && <AddLink onClick={() => setEdit('new-savings')}>+ Add account</AddLink>}>
        {edit === 'new-savings' && (
          <RecordForm fields={savingsFields} submitLabel="Add account" initial={{ asOf: iso(new Date()) }}
            onSave={(v) => { a.add('savings', v); setEdit('') }}
            onCancel={() => setEdit('')} />
        )}
        {arr(s.savings).length === 0 && edit !== 'new-savings' && <Empty>No accounts yet.</Empty>}
        {arr(s.savings).map((x) => (edit === x.id ? (
          <RecordForm key={x.id} fields={savingsFields} initial={{ ...x, asOf: iso(new Date()) }}
            onSave={(v) => { a.patch('savings', x.id, v); setEdit('') }}
            onCancel={() => setEdit('')} />
        ) : (
          <ItemRow key={x.id}
            title={x.name || 'N/A'}
            meta={<>
              {x.kind || 'N/A'}
              {x.since && <span className="text-mute2">· balance as of {pretty(x.since)}</span>}
              {moved(x)}
              {x.older > 0 && (
                <button type="button" onClick={() => setEdit(x.id)} className="text-yellow underline-offset-2 hover:underline" title="These are dated before the balance date, so they are treated as already included in it. Edit the account and pick an earlier 'Balance on date' to count them.">
                  · {x.older} older transaction{x.older === 1 ? '' : 's'} not counted
                </button>
              )}
              {purposeChip(x.purpose)}
            </>}
            value={inr(x.balance)}
            extra={<button type="button" onClick={() => setTransfer({ from: { kind: 'account', id: x.id } })} className="rounded-md px-2 py-1 text-[12px] font-medium text-teal hover:bg-teal/[0.06]">⇄ Transfer</button>}
            onEdit={() => setEdit(x.id)}
            onRemove={() => { if (window.confirm(`Delete ${x.name}?`)) a.remove('savings', x.id) }} />
        )))}
      </Section>

      <Section title="Investments" right={edit !== 'new-inv' && <AddLink onClick={() => setEdit('new-inv')}>+ Add investment</AddLink>}>
        {alloc.length > 0 && (
          <div className="border-b border-hair/[0.07] px-5 py-4">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full">
              {alloc.map(([k, v], i) => (
                <div key={k} style={{ width: (v / (current || 1)) * 100 + '%', background: KIND_COLORS[i % KIND_COLORS.length] }} title={`${k}: ${inr(v)}`} />
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-mute">
              {alloc.map(([k, v], i) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLORS[i % KIND_COLORS.length] }} />
                  {k} · {current ? Math.round((v / current) * 100) : 0}%
                </span>
              ))}
            </div>
          </div>
        )}
        {edit === 'new-inv' && (
          <RecordForm fields={invFields} submitLabel="Add investment" initial={{ asOf: iso(new Date()) }}
            onSave={(v) => { a.add('investments', v); setEdit('') }}
            onCancel={() => setEdit('')} />
        )}
        {arr(s.investments).length === 0 && edit !== 'new-inv' && <Empty>No investments yet.</Empty>}
        {arr(s.investments).map((x) => {
          if (edit === x.id) {
            return (
              <RecordForm key={x.id} fields={invFields} initial={{ ...x, asOf: iso(new Date()) }}
                onSave={(v) => { a.patch('investments', x.id, v); setEdit('') }}
                onCancel={() => setEdit('')} />
            )
          }
          const g = num(x.current) - num(x.invested)
          const gp = num(x.invested) > 0 ? (g / num(x.invested)) * 100 : null
          return (
            <ItemRow key={x.id}
              title={x.name || 'N/A'}
              meta={<>{x.kind || 'N/A'}{num(x.monthlySip) > 0 && <span>· SIP {inr(x.monthlySip)}/mo</span>}{moved(x)}{purposeChip(x.purpose)}</>}
              extra={<button type="button" onClick={() => setTransfer({ to: { kind: 'investment', id: x.id } })} className="rounded-md px-2 py-1 text-[12px] font-medium text-teal hover:bg-teal/[0.06]">+ Add money</button>}
              value={inr(x.current)}
              sub={<span className={g >= 0 ? 'text-green' : 'text-pink'}>{g >= 0 ? '+' : '−'}{inr(Math.abs(g))}{gp !== null ? ` (${gp.toFixed(1)}%)` : ''}</span>}
              onEdit={() => setEdit(x.id)}
              onRemove={() => { if (window.confirm(`Delete ${x.name}?`)) a.remove('investments', x.id) }} />
          )
        })}
      </Section>
      {transfer && <TransferDialog pf={pf} initial={transfer} onClose={() => setTransfer(null)} />}
    </div>
  )
}
