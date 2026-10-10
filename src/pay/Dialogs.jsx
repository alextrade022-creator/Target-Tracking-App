import { useState } from 'react'
import { cn } from '../lib/helpers'
import { Label } from '../ws/ui'
import { Modal } from '../crm/bits'
import {
  MODES, SERVICES, DEFAULT_SETTINGS, arr, num, inr, longDate, shortDate, todayIso, addDays, workFor,
  balanceOf, allocate, nextDue, inWords, receiptFigures, receiptText, reminderMessage, waLink, hasPhone, splitPlan,
} from './lib'

const btn = 'rounded-lg px-4 py-2 text-[13px] font-semibold'
const ghost = 'rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg'
const outline = 'rounded-lg border border-hair/[0.14] px-3.5 py-2 text-[13px] font-medium hover:border-hair/[0.3]'
const wa = 'rounded-lg bg-[#128C4A] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90'

async function copy(text, say) {
  try { await navigator.clipboard.writeText(text); say('Copied.') } catch { say('Could not copy. Select the text and press Cmd+C.') }
}

/* ---------- record a payment ---------- */
export function PaymentDialog({ sales, saleId, onSave, onClose }) {
  const open = sales.filter((x) => balanceOf(x) > 0)
  const first = open.find((x) => x.id === saleId) || open[0]
  const suggest = (x) => String(nextDue(x)?.left || balanceOf(x) || '')
  const [id, setId] = useState(first?.id || '')
  const [amount, setAmount] = useState(first ? suggest(first) : '')
  const [date, setDate] = useState(todayIso())
  const [mode, setMode] = useState('UPI')
  const [ref, setRef] = useState('')
  const [nextDate, setNextDate] = useState(addDays(30))
  const [showReceipt, setShowReceipt] = useState(true)
  const [err, setErr] = useState('')
  const x = sales.find((y) => y.id === id)
  const amt = num(amount)

  const submit = (e) => {
    e.preventDefault()
    if (!x) return
    if (!amt) { setErr('Enter the amount received.'); return }
    if (amt > balanceOf(x) + 0.5) { setErr(`That is more than the ${inr(balanceOf(x))} balance. Change the fee first if the client is paying more.`); return }
    onSave(x.id, { amount: amt, date, mode, ref, nextDate: balanceOf(x) - amt > 0 ? nextDate : '' }, showReceipt)
  }

  return (
    <Modal title="Record payment" onClose={onClose}>
      {!x ? <p className="text-[13px] text-mute">Every client is paid up.</p> : (
        <form onSubmit={submit} noValidate className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Client</Label>
              <select className="select" value={id} onChange={(e) => { const y = sales.find((s) => s.id === e.target.value); setId(e.target.value); setAmount(suggest(y)); setErr('') }}>
                {open.map((y) => <option key={y.id} value={y.id}>{y.name} · {workFor(y)} · {inr(balanceOf(y))} due</option>)}
              </select>
            </div>
            <div><Label>Amount received (₹)</Label><input className="field" type="number" min="1" step="500" autoFocus value={amount} onChange={(e) => { setAmount(e.target.value); setErr('') }} /></div>
            <div><Label>Date received</Label><input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Mode</Label><select className="select" value={mode} onChange={(e) => setMode(e.target.value)}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div><Label>Reference (UTR / cheque no.)</Label><input className="field" placeholder="optional" value={ref} onChange={(e) => setRef(e.target.value)} /></div>
            {x.plan === 'flexible' && balanceOf(x) - amt > 0 && (
              <div className="sm:col-span-2"><Label>Next payment expected on</Label><input className="field" type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} /></div>
            )}
          </div>
          <Allocation sale={x} amount={amt} />
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={showReceipt} onChange={(e) => setShowReceipt(e.target.checked)} />
            Show the receipt after saving
          </label>
          {err && <p className="text-[12.5px] text-pink">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={ghost}>Cancel</button>
            <button type="submit" className={cn(btn, 'bg-teal text-onaccent hover:bg-teal-lt')}>Save payment</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function Allocation({ sale, amount }) {
  if (!amount) return <div className="rounded-xl bg-hair/[0.04] px-3 py-2.5 text-[12.5px] text-mute">Enter an amount to see how it is applied.</div>
  const after = Math.max(0, balanceOf(sale) - amount)
  const lines = []
  if (sale.plan === 'instalments') {
    const before = allocate(sale), now = allocate(sale, amount)
    now.forEach((n, i) => {
      const add = n.paid - before[i].paid
      if (add <= 0) return
      lines.push(n.left === 0
        ? <span key={i}>Clears <b>{n.i.label}</b> ({inr(add)})</span>
        : <span key={i}>{inr(add)} towards <b>{n.i.label}</b>, {inr(n.left)} still due {shortDate(n.i.due)}</span>)
    })
  }
  return (
    <div className="grid gap-1 rounded-xl bg-hair/[0.04] px-3 py-2.5 text-[12.5px]">
      {lines}
      <span className="text-mute">Balance after this payment: <b className="text-fg">{inr(after)}</b></span>
    </div>
  )
}

/* ---------- receipt ---------- */
export function ReceiptDialog({ sale: x, payId, settings, onClose, say }) {
  const p = arr(x.pays).find((y) => y.id === payId)
  if (!p) return null
  const st = { ...DEFAULT_SETTINGS, ...settings }
  const { upto, balance } = receiptFigures(x, p)
  const text = receiptText(x, p, st)

  const printPdf = () => {
    const w = window.open('', '_blank', 'width=720,height=900')
    if (!w) { say('Allow pop-ups for this site to save the receipt as PDF.'); return }
    w.document.write(receiptHtml(x, p, st, upto, balance))
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  return (
    <Modal title={`Receipt ${p.receipt}`} onClose={onClose} width={520}>
      <div className="grid gap-3 rounded-xl border border-hair/[0.1] bg-hair/[0.02] p-5 text-[13px]">
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-hair/[0.15] pb-3">
          <div>
            <div className="font-head text-[16px] font-bold">Payment receipt</div>
            <div className="text-[12px] text-mute">{st.business}{st.gstin ? ' · GSTIN ' + st.gstin : ''}</div>
            {(st.address || st.phone) && <div className="text-[12px] text-mute">{[st.address, st.phone].filter(Boolean).join(' · ')}</div>}
          </div>
          <div className="text-right text-[12px] text-mute">{p.receipt}<br />{longDate(p.date)}</div>
        </div>
        <div><div className="text-[12px] text-mute">Received with thanks from</div><b>{x.name}</b>{x.person ? <span className="text-mute"> · {x.person}</span> : null}</div>
        <div>
          <div className="font-head text-[26px] font-extrabold tabular-nums">{inr(p.amount)}</div>
          <div className="italic text-soft">Rupees {inWords(p.amount)} Only</div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-mute">Mode</dt><dd className="text-right">{p.mode}{p.ref ? ' · ' + p.ref : ''}</dd>
          <dt className="text-mute">For</dt><dd className="text-right">{workFor(x)}</dd>
        </dl>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-dashed border-hair/[0.15] pt-2.5 tabular-nums">
          <dt className="text-mute">Total fee</dt><dd className="text-right font-semibold">{inr(x.deal)}</dd>
          <dt className="text-mute">Paid to date</dt><dd className="text-right font-semibold">{inr(upto)}</dd>
          <dt className="text-mute">Balance</dt><dd className="text-right font-semibold">{inr(balance)}</dd>
        </dl>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} className={ghost}>Close</button>
        <button type="button" onClick={printPdf} className={outline}>Print / Save PDF</button>
        <button type="button" onClick={() => copy(text, say)} className={outline}>Copy as text</button>
        {hasPhone(x.phone)
          ? <a href={waLink(x.phone, text)} target="_blank" rel="noopener noreferrer" className={wa}>Send on WhatsApp</a>
          : <span className="self-center text-[12px] text-mute2">Add a phone number to send on WhatsApp</span>}
      </div>
    </Modal>
  )
}

const escHtml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function receiptHtml(x, p, st, upto, balance) {
  const row = (k, v, strong) => `<tr><td>${k}</td><td style="text-align:right;${strong ? 'font-weight:600' : ''}">${escHtml(v)}</td></tr>`
  return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escHtml(p.receipt)}</title>
<style>body{font:14px/1.5 -apple-system,Inter,Segoe UI,sans-serif;color:#1b2a4a;margin:40px}
.box{max-width:560px;margin:auto;border:1px solid #d8dee8;border-radius:10px;padding:28px}
h1{font-size:20px;margin:0}.muted{color:#64748b;font-size:12px}.amt{font-size:30px;font-weight:800;margin:6px 0 0}
table{width:100%;border-collapse:collapse;margin-top:10px}td{padding:4px 0}hr{border:0;border-top:1px dashed #cbd5e1;margin:16px 0}
.top{display:flex;justify-content:space-between;gap:12px}</style></head><body><div class="box">
<div class="top"><div><h1>Payment receipt</h1><div class="muted">${escHtml(st.business)}${st.gstin ? ' · GSTIN ' + escHtml(st.gstin) : ''}</div>
${st.address || st.phone ? `<div class="muted">${escHtml([st.address, st.phone].filter(Boolean).join(' · '))}</div>` : ''}</div>
<div class="muted" style="text-align:right">${escHtml(p.receipt)}<br>${escHtml(longDate(p.date))}</div></div><hr>
<div class="muted">Received with thanks from</div><div><b>${escHtml(x.name)}</b>${x.person ? ' · ' + escHtml(x.person) : ''}</div>
<div class="amt">${escHtml(inr(p.amount))}</div><div><i>Rupees ${escHtml(inWords(p.amount))} Only</i></div>
<table>${row('Mode', p.mode + (p.ref ? ' · ' + p.ref : ''))}${row('For', workFor(x))}</table><hr>
<table>${row('Total fee', inr(x.deal), 1)}${row('Paid to date', inr(upto), 1)}${row('Balance', inr(balance), 1)}</table>
${st.name ? `<p style="margin-top:28px">Thank you,<br>${escHtml(st.name)}</p>` : ''}</div></body></html>`
}

/* ---------- WhatsApp reminder ---------- */
export function ReminderDialog({ sale: x, settings, today, onSent, onClose, say }) {
  const st = { ...DEFAULT_SETTINGS, ...settings }
  const [text, setText] = useState(() => reminderMessage(x, st, today))
  const last = arr(x.reminders)[0]
  const phoneOk = hasPhone(x.phone)
  return (
    <Modal
      title={`Remind ${x.name}`}
      hint={`To ${[x.person, x.phone].filter(Boolean).join(' · ') || 'no contact saved'}${last ? ` · last reminded ${longDate(last.date)}` : ''}`}
      onClose={onClose}
    >
      <div className="grid gap-3">
        <div>
          <Label>Message (edit before sending if you like)</Label>
          <textarea className="field resize-y" rows={9} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <p className="text-[12px] text-mute">
          {phoneOk ? 'Opens WhatsApp with this message filled in. Press Send there; the reminder is logged here.' : 'This client has no phone number. Add one in the client details, or copy the message.'}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className={ghost}>Cancel</button>
          <button type="button" onClick={() => copy(text, say)} className={outline}>Copy message</button>
          {phoneOk && <a href={waLink(x.phone, text)} target="_blank" rel="noopener noreferrer" onClick={onSent} className={wa}>Open WhatsApp</a>}
          {!phoneOk && <button type="button" onClick={onSent} className={outline}>Mark as reminded</button>}
        </div>
      </div>
    </Modal>
  )
}

/* ---------- payment plan ---------- */
const QUICK = [['Full upfront', [100]], ['50 / 50', [50, 50]], ['40 / 30 / 30', [40, 30, 30]], ['Monthly × 3', [34, 33, 33]], ['Monthly × 4', [25, 25, 25, 25]]]

export function PlanDialog({ sale: x, onSave, onClose }) {
  const deal = num(x.deal)
  const [plan, setPlan] = useState(x.plan || 'instalments')
  const [rows, setRows] = useState(() => (arr(x.inst).length
    ? arr(x.inst).map((i) => ({ label: i.label, due: i.due, amount: i.amount }))
    : splitPlan(deal, [50, 50], x.won > todayIso() ? x.won : todayIso())))
  const [expect, setExpect] = useState(() => ({ date: x.expect?.date || addDays(7), amount: x.expect?.amount || '' }))
  const planned = rows.reduce((t, r) => t + num(r.amount), 0)
  const gap = Math.round((deal - planned) * 100) / 100
  const setRow = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  const paid = arr(x.pays).reduce((t, p) => t + num(p.amount), 0)

  return (
    <Modal title={`Payment plan · ${x.name}`} hint={`Fee ${inr(deal)}${paid ? ` · ${inr(paid)} already received (applied to the earliest instalments)` : ''}`} onClose={onClose} width={560}>
      <div className="grid gap-3">
        <div className="inline-flex w-fit gap-1 rounded-xl bg-hair/[0.05] p-1" role="group" aria-label="Plan type">
          {[['instalments', 'Fixed instalments'], ['flexible', 'Flexible']].map(([k, t]) => (
            <button key={k} type="button" aria-pressed={plan === k} onClick={() => setPlan(k)} className={cn('rounded-lg px-3 py-1.5 text-[12.5px] font-medium', plan === k ? 'bg-panel text-fg shadow-sm' : 'text-mute hover:text-fg')}>{t}</button>
          ))}
        </div>

        {plan === 'flexible' ? (
          <>
            <p className="text-[12.5px] text-mute">No fixed schedule. Set when you expect the next payment so it shows up in "To collect" and can be reminded.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Next payment expected on</Label><input className="field" type="date" value={expect.date} onChange={(e) => setExpect({ ...expect, date: e.target.value })} /></div>
              <div><Label>Expected amount (₹, optional)</Label><input className="field" type="number" min="0" step="500" value={expect.amount} onChange={(e) => setExpect({ ...expect, amount: e.target.value })} /></div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] text-mute">Quick split:</span>
              {QUICK.map(([t, parts]) => (
                <button key={t} type="button" onClick={() => setRows(splitPlan(deal, parts))} className="rounded-full border border-hair/[0.14] px-3 py-1 text-[12px] hover:border-teal hover:text-teal">{t}</button>
              ))}
            </div>
            <div className="grid gap-2">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input className="field" aria-label="Instalment name" value={r.label} onChange={(e) => setRow(i, 'label', e.target.value)} />
                  <input className="field" type="date" aria-label="Due date" value={r.due} onChange={(e) => setRow(i, 'due', e.target.value)} />
                  <input className="field" type="number" min="0" step="500" aria-label="Amount" value={r.amount} onChange={(e) => setRow(i, 'amount', e.target.value)} />
                  <button type="button" disabled={rows.length < 2} onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove instalment" className="px-2 text-[18px] text-mute2 hover:text-fg disabled:opacity-30">×</button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRows(rows.concat([{ label: 'Instalment ' + (rows.length + 1), due: addDays(30 * rows.length), amount: Math.max(0, gap) }]))}
              className="w-fit text-[12.5px] font-semibold text-teal"
            >
              + Add instalment
            </button>
            <div className={cn('text-[12.5px] tabular-nums', gap ? 'text-pink' : 'text-green')}>
              {inr(planned)} of {inr(deal)} planned{gap ? ` · ${gap > 0 ? inr(gap) + ' not scheduled yet' : inr(-gap) + ' too much'}` : ' ✓'}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghost}>Cancel</button>
          <button
            type="button"
            disabled={plan === 'instalments' && (gap !== 0 || rows.some((r) => !r.due))}
            onClick={() => onSave(plan, rows, expect)}
            className={cn(btn, 'bg-teal text-onaccent hover:bg-teal-lt disabled:opacity-40')}
          >
            Save plan
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- add a sale that didn't come through the lead pipeline ---------- */
export function SaleDialog({ sales, onSave, onClose }) {
  const [v, setV] = useState({ name: '', phone: '', person: '', service: 'Finance', title: '', deal: '', won: todayIso(), paidNow: false, mode: 'UPI', ref: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); setErr('') }
  const names = [...new Set(sales.map((x) => x.name).filter(Boolean))]
  const known = sales.filter((x) => x.name && x.name.toLowerCase() === v.name.trim().toLowerCase())
  const owed = known.reduce((t, x) => t + balanceOf(x), 0)

  const pickName = (e) => {
    const name = e.target.value
    const ex = sales.find((x) => x.name && x.name.toLowerCase() === name.trim().toLowerCase())
    setV(ex ? { ...v, name, phone: v.phone || ex.phone, person: v.person || ex.person, service: ex.service } : { ...v, name })
    setErr('')
  }

  const submit = (e) => {
    e.preventDefault()
    if (!v.name.trim()) { setErr('Enter the client name.'); return }
    if (!v.title.trim()) { setErr('Say what the sale is for, so it reads clearly on reminders and receipts.'); return }
    if (!num(v.deal)) { setErr('Enter the fee.'); return }
    onSave({ ...v, deal: num(v.deal) })
  }

  return (
    <Modal title="Add a sale" hint="For work that didn't come through the lead pipeline: referrals, repeat or extra work for an existing client, retainers, workshops." onClose={onClose} width={540}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Client / business</Label>
            <input className="field" list="pay-client-names" autoFocus placeholder="New or existing client" value={v.name} onChange={pickName} />
            <datalist id="pay-client-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
          </div>
          <div><Label>Phone (for WhatsApp)</Label><input className="field" inputMode="tel" placeholder="+91 …" value={v.phone} onChange={set('phone')} /></div>
          <div><Label>Contact person</Label><input className="field" value={v.person} onChange={set('person')} /></div>
          <div><Label>Service</Label><select className="select" value={v.service} onChange={set('service')}>{SERVICES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="sm:col-span-2"><Label>What is it for?</Label><input className="field" placeholder="e.g. Monthly retainer · November, GST cleanup, 1-day workshop" value={v.title} onChange={set('title')} /></div>
          <div><Label>Fee (₹)</Label><input className="field" type="number" min="1" step="500" value={v.deal} onChange={set('deal')} /></div>
          <div><Label>Sale date</Label><input className="field" type="date" value={v.won} onChange={set('won')} /></div>
        </div>
        {known.length > 0 && (
          <div className="text-[12.5px] text-mute">Existing client. Details filled in.{owed ? ` They still owe ${inr(owed)} on earlier work.` : ''}</div>
        )}
        <div>
          <Label>How will they pay?</Label>
          <div className="flex flex-wrap gap-2">
            {[[false, 'Set up a plan next'], [true, 'Already paid in full']].map(([k, t]) => (
              <label key={t} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px]', v.paidNow === k ? 'border-teal/60 bg-teal/[0.05]' : 'border-hair/[0.14]')}>
                <input type="radio" name="paidNow" checked={v.paidNow === k} onChange={() => setV({ ...v, paidNow: k })} />{t}
              </label>
            ))}
          </div>
        </div>
        {v.paidNow && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>Mode</Label><select className="select" value={v.mode} onChange={set('mode')}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div><Label>Reference</Label><input className="field" placeholder="optional" value={v.ref} onChange={set('ref')} /></div>
          </div>
        )}
        {err && <p className="text-[12.5px] text-pink">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghost}>Cancel</button>
          <button type="submit" className={cn(btn, 'bg-teal text-onaccent hover:bg-teal-lt')}>Add sale</button>
        </div>
      </form>
    </Modal>
  )
}

/* ---------- reminder + receipt settings ---------- */
export function SettingsDialog({ settings, onSave, onClose }) {
  const [v, setV] = useState({ ...DEFAULT_SETTINGS, ...settings })
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  return (
    <Modal title="Reminder & receipt settings" onClose={onClose} width={560}>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ name: v.name.trim(), upi: v.upi.trim(), prefix: v.prefix.trim().toUpperCase() || 'BC', business: v.business.trim() || 'Business Consultation', address: v.address.trim(), phone: v.phone.trim(), gstin: v.gstin.trim().toUpperCase(), template: v.template }) }} className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label>Your name (sign-off)</Label><input className="field" autoFocus value={v.name} onChange={set('name')} /></div>
          <div><Label>UPI ID shown to clients</Label><input className="field" placeholder="name@bank" value={v.upi} onChange={set('upi')} /></div>
          <div><Label>Business name on receipts</Label><input className="field" value={v.business} onChange={set('business')} /></div>
          <div><Label>Receipt number prefix</Label><input className="field" value={v.prefix} onChange={set('prefix')} /><div className="mt-1 text-[11.5px] text-mute2">Receipts read {v.prefix || 'BC'}/26-27/001</div></div>
          <div className="sm:col-span-2"><Label>Address (optional)</Label><input className="field" value={v.address} onChange={set('address')} /></div>
          <div><Label>Phone (optional)</Label><input className="field" value={v.phone} onChange={set('phone')} /></div>
          <div><Label>GSTIN (optional)</Label><input className="field" value={v.gstin} onChange={set('gstin')} /></div>
          <div className="sm:col-span-2">
            <Label>Reminder message</Label>
            <textarea className="field resize-y" rows={7} value={v.template} onChange={set('template')} />
            <div className="mt-1 text-[11.5px] text-mute2">Placeholders: {'{client} {amount} {work} {when} {upi} {name} {kind}'}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setV({ ...v, template: DEFAULT_SETTINGS.template })} className={ghost}>Reset message</button>
          <button type="button" onClick={onClose} className={ghost}>Cancel</button>
          <button type="submit" className={cn(btn, 'bg-teal text-onaccent hover:bg-teal-lt')}>Save</button>
        </div>
      </form>
    </Modal>
  )
}
