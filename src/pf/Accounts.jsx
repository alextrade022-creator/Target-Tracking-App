import { useState } from 'react'
import { cn, iso } from '../lib/helpers'
import { Label } from '../ws/ui'
import { Modal } from '../crm/bits'
import { inr, num, arr } from './lib'

/* Which savings / bank account money left or arrived in. Lists every account from
   Savings & investments, so a new account appears here as soon as it is added. */
export function AccountPicker({ accounts, value, onChange, type = 'expense', className = 'py-1.5 text-[12px]', showBalance = false }) {
  return (
    <select
      className={cn('select', className, !value && 'text-mute')}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={type === 'income' ? 'Received into account' : 'Paid from account'}
      title={type === 'income' ? 'Which account did the money go into?' : 'Which account was it paid from?'}
    >
      <option value="">{type === 'income' ? 'Into: cash / not tracked' : 'From: cash / not tracked'}</option>
      {arr(accounts).map((x) => (
        <option key={x.id} value={x.id}>
          {type === 'income' ? 'Into: ' : 'From: '}{x.name || 'Account'}{showBalance ? ` · ${inr(x.balance)}` : ''}
        </option>
      ))}
    </select>
  )
}

/* Which investment an "Investments / SIP" expense went into. */
export function InvestmentPicker({ investments, value, onChange, className = 'py-1.5 text-[12px]' }) {
  return (
    <select
      className={cn('select', className, !value && 'text-yellow')}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Which investment?"
      title="Adds this amount to the investment"
    >
      <option value="">Which investment? (not linked)</option>
      {arr(investments).map((x) => <option key={x.id} value={x.id}>↳ {x.name || 'Investment'}</option>)}
    </select>
  )
}

const key = (end) => (end ? `${end.kind}:${end.id}` : '')
const parse = (k) => { const [kind, id] = String(k || '').split(':'); return id ? { kind, id } : null }

/* Move money between your own accounts and investments. It isn't income or spending:
   the source goes down and the destination goes up by the same amount. */
export function TransferDialog({ pf, onClose, initial = {} }) {
  const { state: s, actions: a } = pf
  const accounts = arr(s.savings)
  const investments = arr(s.investments)
  const firstAcc = accounts.find((x) => x.id === s.settings?.lastAccount) || accounts[0]
  const [from, setFrom] = useState(key(initial.from) || (firstAcc ? `account:${firstAcc.id}` : ''))
  const [to, setTo] = useState(key(initial.to) || (investments[0] ? `investment:${investments[0].id}` : accounts[1] ? `account:${accounts[1].id}` : ''))
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(iso(new Date()))
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const find = (k) => { const e = parse(k); if (!e) return null; const x = (e.kind === 'investment' ? investments : accounts).find((y) => y.id === e.id); return x ? { ...e, x } : null }
  const src = find(from), dst = find(to)
  const amt = num(amount)
  const valueOf = (e) => (e.kind === 'investment' ? num(e.x.current) : num(e.x.balance))

  const options = (
    <>
      {accounts.length > 0 && <optgroup label="Savings & bank accounts">{accounts.map((x) => <option key={x.id} value={`account:${x.id}`}>{x.name} · {inr(x.balance)}</option>)}</optgroup>}
      {investments.length > 0 && <optgroup label="Investments">{investments.map((x) => <option key={x.id} value={`investment:${x.id}`}>{x.name} · {inr(x.current)}</option>)}</optgroup>}
    </>
  )

  const save = () => {
    if (!src || !dst) { setErr('Choose where the money comes from and where it goes.'); return }
    if (from === to) { setErr('Pick two different places.'); return }
    if (!amt) { setErr('Enter the amount.'); return }
    a.add('txns', {
      type: 'transfer',
      date,
      amount: amt,
      from: { kind: src.kind, id: src.id },
      to: { kind: dst.kind, id: dst.id },
      // money into an investment counts as "Invested" in the monthly totals
      category: dst.kind === 'investment' && src.kind === 'account' ? 'investment' : 'transfer',
      desc: `${src.x.name} → ${dst.x.name}`,
      note: note.trim(),
      source: 'manual',
    })
    onClose()
  }

  if (accounts.length + investments.length < 2) {
    return (
      <Modal title="Transfer money" onClose={onClose}>
        <p className="text-[13px] text-mute">Add at least two accounts or investments in <b>Savings &amp; investments</b> first.</p>
        <div className="mt-4 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Close</button></div>
      </Modal>
    )
  }

  return (
    <Modal title="Transfer money" hint="Between your own accounts, or from an account into an investment. It isn't counted as income or spending." onClose={onClose}>
      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label>From</Label><select className="select" value={from} onChange={(e) => { setFrom(e.target.value); setErr('') }}><option value="">Choose…</option>{options}</select></div>
          <div><Label>To</Label><select className="select" value={to} onChange={(e) => { setTo(e.target.value); setErr('') }}><option value="">Choose…</option>{options}</select></div>
          <div><Label>Amount (₹)</Label><input className="field" type="number" min="1" step="100" autoFocus value={amount} onChange={(e) => { setAmount(e.target.value); setErr('') }} /></div>
          <div><Label>Date</Label><input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Note (optional)</Label><input className="field" placeholder="e.g. Monthly SIP top-up" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        {src && dst && amt > 0 && from !== to && (
          <div className="grid gap-1 rounded-xl bg-hair/[0.04] px-3 py-2.5 text-[13px] tabular-nums">
            <span>{src.x.name}: {inr(valueOf(src))} → <b>{inr(valueOf(src) - amt)}</b></span>
            <span>{dst.x.name}: {inr(valueOf(dst))} → <b>{inr(valueOf(dst) + amt)}</b>{dst.kind === 'investment' && <span className="text-mute"> (amount invested goes up too)</span>}</span>
            {src.kind === 'account' && valueOf(src) - amt < 0 && <span className="text-yellow">{src.x.name} would go below zero.</span>}
          </div>
        )}
        {err && <p className="text-[12.5px] text-pink">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-teal px-4 py-2 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">Transfer</button>
        </div>
      </div>
    </Modal>
  )
}
