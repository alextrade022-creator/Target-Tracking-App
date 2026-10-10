import { useState } from 'react'
import { Label } from '../ws/ui'
import { Modal } from './bits'
import { SERVICES, SOURCES, LOST_REASONS, num, phoneKey, stageLabel, addDays } from './lib'

export function AddLeadDialog({ leads, onAdd, onClose, onOpenExisting }) {
  const [v, setV] = useState({ name: '', phone: '', service: 'Finance', source: 'Ads', budget: '', person: '', followUp: addDays(1) })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const key = phoneKey(v.phone)
  const dup = key.length >= 10 ? leads.find((l) => phoneKey(l.phone) === key) : null

  const submit = (e) => {
    e.preventDefault()
    if (!v.name.trim() || !v.phone.trim()) { setErr('Enter the lead name and phone number to add the lead.'); return }
    onAdd(v)
  }

  return (
    <Modal title="New lead" hint="Only name, phone, service and source are needed now. Fill the rest after the first call." onClose={onClose}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label>Lead / business name *</Label><input className="field" autoFocus value={v.name} onChange={set('name')} /></div>
          <div><Label>Phone *</Label><input className="field" inputMode="tel" placeholder="+91 …" value={v.phone} onChange={set('phone')} /></div>
          <div>
            <Label>Service needed</Label>
            <select className="select" value={v.service} onChange={set('service')}>{SERVICES.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          <div>
            <Label>Source</Label>
            <select className="select" value={v.source} onChange={set('source')}>{SOURCES.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          <div><Label>Can afford (₹, optional)</Label><input className="field" type="number" min="0" step="1000" value={v.budget} onChange={set('budget')} /></div>
          <div><Label>Contact person (optional)</Label><input className="field" value={v.person} onChange={set('person')} /></div>
          <div><Label>First follow-up</Label><input className="field" type="date" value={v.followUp} onChange={set('followUp')} /></div>
        </div>
        {dup && (
          <div className="rounded-lg bg-yellow/[0.12] px-3 py-2 text-[12.5px]">
            This number is already in your pipeline:{' '}
            <button type="button" onClick={() => onOpenExisting(dup.id)} className="font-semibold text-teal underline">{dup.name}</button>{' '}
            ({stageLabel(dup.stage)}).
          </div>
        )}
        {err && <p className="text-[12.5px] text-pink">{err}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Cancel</button>
          <button type="submit" className="rounded-lg bg-teal px-4 py-2 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">Add lead</button>
        </div>
      </form>
    </Modal>
  )
}

export function CloseDialog({ lead, kind, onCancel, onConfirm }) {
  const won = kind === 'won'
  const [deal, setDeal] = useState(String(num(lead?.deal) || num(lead?.budget) || ''))
  const [start, setStart] = useState(addDays(7))
  const [reason, setReason] = useState(LOST_REASONS[0])
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (won) {
      if (!num(deal)) { setErr('Enter the final deal value to mark this lead as won.'); return }
      onConfirm({ deal: num(deal), startDate: start })
    } else {
      onConfirm({ lostReason: reason, note: note.trim() })
    }
  }

  return (
    <Modal
      title={`${won ? 'Mark' : 'Close'} ${lead?.name || 'lead'} as ${kind}`}
      hint={won ? 'Confirm the final amount the client agreed to.' : 'Pick the closest reason. It feeds the "Why leads are lost" report.'}
      onClose={onCancel}
    >
      <form onSubmit={submit} noValidate className="grid gap-3">
        {won ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>Final deal value (₹)</Label><input className="field" type="number" min="0" step="1000" autoFocus value={deal} onChange={(e) => setDeal(e.target.value)} /></div>
            <div><Label>Engagement starts</Label><input className="field" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          </div>
        ) : (
          <div className="grid gap-3">
            <div>
              <Label>Why was it lost?</Label>
              <select className="select" autoFocus value={reason} onChange={(e) => setReason(e.target.value)}>{LOST_REASONS.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <div><Label>Note (optional)</Label><input className="field" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          </div>
        )}
        {err && <p className="text-[12.5px] text-pink">{err}</p>}
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Cancel</button>
          <button type="submit" className={'rounded-lg px-4 py-2 text-[13px] font-semibold text-onaccent ' + (won ? 'bg-green' : 'bg-pink')}>
            Mark as {kind}
          </button>
        </div>
      </form>
    </Modal>
  )
}
