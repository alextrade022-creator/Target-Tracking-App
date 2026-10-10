import { useEffect, useRef, useState } from 'react'
import { cn, pretty } from '../lib/helpers'
import { Label } from '../ws/ui'
import {
  arr, num, IDX, OPEN, DEAL_FROM, SERVICES, SOURCES, stageLabel, isOpen, inr, addDays, phoneKey,
} from './lib'

const DOT = { stage: 'bg-teal', note: 'bg-purple', call: 'bg-yellow', meeting: 'bg-green', created: 'bg-mute2' }

export default function LeadDrawer({ lead: l, leads, today, pendingStage, onSavePending, onMove, onClose, crm, ws, bizId, say, onPayments }) {
  const a = crm.actions
  const panel = useRef(null)
  const [pendingDeal, setPendingDeal] = useState(String(num(l.deal) || num(l.budget) || ''))
  const [note, setNote] = useState('')
  const [meet, setMeet] = useState(null) // { date, time, advance }
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => { panel.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('[role="dialog"][aria-modal="true"]')) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const si = IDX[l.stage]
  const closed = !isOpen(l)
  const dealLocked = closed ? num(l.reached) < DEAL_FROM && !num(l.deal) : si < DEAL_FROM
  const set = (k) => (e) => a.patchLead(l.id, { [k]: e.target.value })
  const setNum = (k) => (e) => a.patchLead(l.id, { [k]: num(e.target.value) })
  const dupe = phoneKey(l.phone).length >= 10 ? leads.find((x) => x.id !== l.id && phoneKey(x.phone) === phoneKey(l.phone)) : null
  const meetings = ws.sel.allMeetings.filter((m) => m.leadId === l.id).sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time))

  const addNote = () => {
    const t = note.trim()
    if (!t) return
    a.logActivity(l.id, 'note', t)
    setNote('')
  }

  const copyPhone = () => {
    const fail = () => say('Could not copy. Select the number and press Cmd+C.')
    try { navigator.clipboard.writeText(l.phone).then(() => say('Phone number copied.'), fail) } catch { fail() }
  }

  const saveMeeting = () => {
    if (!meet?.date) { say('Pick a date for the meeting.'); return }
    const id = ws.actions.addMeeting({
      bizId,
      date: meet.date,
      time: meet.time,
      title: (si < IDX.proposal ? 'Discovery: ' : 'Meeting: ') + l.name,
      attendees: [l.person, l.phone].filter(Boolean).join(' · '),
      agenda: l.situation || '',
      leadId: l.id,
      stay: true,
    })
    const when = pretty(meet.date) + (meet.time ? ', ' + meet.time : '')
    a.logActivity(l.id, 'meeting', 'Meeting scheduled for ' + when, {
      followUp: !l.followUp || meet.date < l.followUp ? meet.date : l.followUp,
      meetingIds: arr(l.meetingIds).concat([id]),
    })
    if (meet.advance) onMove(l.id, 'discovery')
    setMeet(null)
    say('Meeting added to your Calendar and Meetings.')
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside
        ref={panel}
        tabIndex={-1}
        aria-label={`Lead: ${l.name}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[500px] flex-col gap-5 overflow-y-auto border-l border-hair/[0.08] bg-surface px-5 pb-8 pt-5 shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-mute">{[l.bizType, l.place].filter(Boolean).join(' · ') || 'Business Consultation'}</div>
            <h2 className="mt-0.5 font-head text-[21px] font-bold leading-tight">{l.name || 'N/A'}</h2>
            <div className="mt-0.5 text-[12.5px] text-mute">{l.person || 'No contact person yet'} · added {pretty(l.createdAt)}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg px-2 py-1 text-[22px] leading-none text-mute hover:bg-hair/[0.06] hover:text-fg">×</button>
        </div>

        {pendingStage && (
          <div className="grid gap-2.5 rounded-xl bg-yellow/[0.12] px-4 py-3 text-[13px]">
            <div><b className="text-yellow">Add the deal value</b> to move this lead to {stageLabel(pendingStage)}.</div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (num(pendingDeal)) onSavePending(num(pendingDeal)) }}>
              <input className="field flex-1" type="number" min="0" step="1000" autoFocus placeholder="Quoted amount (₹)" aria-label="Deal value" value={pendingDeal} onChange={(e) => setPendingDeal(e.target.value)} />
              <button type="submit" disabled={!num(pendingDeal)} className="whitespace-nowrap rounded-lg bg-teal px-4 text-[13px] font-semibold text-onaccent disabled:opacity-40">Save &amp; move</button>
            </form>
          </div>
        )}

        <Block title="Stage">
          <div className="flex flex-wrap gap-1">
            {OPEN.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onMove(l.id, k)}
                className={cn(
                  'min-w-[80px] flex-1 rounded-lg px-1.5 py-2 text-[11.5px] font-medium transition-colors',
                  k === l.stage ? 'bg-teal font-semibold text-onaccent'
                    : l.stage === 'won' || (!closed && IDX[k] < si) ? 'bg-teal/[0.1] text-teal'
                      : 'bg-hair/[0.05] text-mute hover:text-fg',
                )}
              >
                {stageLabel(k)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {closed ? (
              <>
                <span className={cn('rounded-full px-3 py-1 text-[12.5px] font-semibold', l.stage === 'won' ? 'bg-green/[0.12] text-green' : 'bg-pink/[0.1] text-pink')}>
                  {l.stage === 'won' ? `Won · ${inr(l.deal)}${l.startDate ? ' · starts ' + pretty(l.startDate) : ''}` : `Lost · ${l.lostReason || 'N/A'}`}
                </span>
                <button type="button" onClick={() => a.reopenLead(l.id)} className="rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[12.5px] font-medium hover:border-hair/[0.3]">Reopen</button>
                {onPayments && <button type="button" onClick={onPayments} className="rounded-lg bg-teal px-3 py-1.5 text-[12.5px] font-semibold text-onaccent hover:bg-teal-lt">Payments →</button>}
              </>
            ) : (
              <>
                <button type="button" onClick={() => onMove(l.id, 'won')} className="rounded-lg border border-green bg-green/[0.08] px-3 py-1.5 text-[12.5px] font-semibold text-green">Mark as won</button>
                <button type="button" onClick={() => onMove(l.id, 'lost')} className="rounded-lg border border-pink bg-pink/[0.07] px-3 py-1.5 text-[12.5px] font-semibold text-pink">Mark as lost</button>
              </>
            )}
          </div>
        </Block>

        {!closed && (
          <Block title="Next follow-up">
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" className="field w-auto" aria-label="Next follow-up date" value={l.followUp || ''} onChange={set('followUp')} />
              {[['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([t, n]) => (
                <button key={n} type="button" onClick={() => a.patchLead(l.id, { followUp: addDays(n) })} className="rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[12.5px] font-medium hover:border-hair/[0.3]">{t}</button>
              ))}
              {l.followUp && <button type="button" onClick={() => a.patchLead(l.id, { followUp: '' })} className="px-1 text-[12.5px] text-mute hover:text-fg">Clear</button>}
            </div>
            {l.followUp && l.followUp < today && <div className="text-[12px] font-medium text-pink">Overdue since {pretty(l.followUp)}</div>}
          </Block>
        )}

        <Block title="Money">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Can afford (₹)</Label>
              <input className="field" type="number" min="0" step="1000" value={l.budget || ''} onChange={setNum('budget')} />
              <div className="mt-1 text-[11.5px] text-mute2">What the client says they can spend</div>
            </div>
            <div>
              <Label>Deal value (₹)</Label>
              <input className="field disabled:cursor-not-allowed disabled:opacity-50" type="number" min="0" step="1000" disabled={dealLocked} value={l.deal || ''} onChange={setNum('deal')} />
              <div className="mt-1 text-[11.5px] text-mute2">{dealLocked ? 'Unlocks at Proposal sent' : 'The amount you quoted / agreed'}</div>
            </div>
          </div>
        </Block>

        <Block title="Contact">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>Lead / business name</Label><input className="field" value={l.name || ''} onChange={set('name')} /></div>
            <div><Label>Contact person</Label><input className="field" value={l.person || ''} onChange={set('person')} /></div>
            <div>
              <Label>Phone</Label>
              <div className="flex gap-1.5">
                <input className="field" inputMode="tel" value={l.phone || ''} onChange={set('phone')} />
                <button type="button" onClick={copyPhone} className="rounded-lg border border-hair/[0.14] px-2.5 text-[12px] font-medium hover:border-hair/[0.3]">Copy</button>
              </div>
            </div>
            <div><Label>Email</Label><input className="field" type="email" placeholder="name@company.com" value={l.email || ''} onChange={set('email')} /></div>
            <div>
              <Label>Source</Label>
              <select className="select" value={l.source} onChange={set('source')}>{SOURCES.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
          </div>
          {dupe && (
            <div className="rounded-lg bg-yellow/[0.12] px-3 py-2 text-[12.5px]">
              Same number as <button type="button" onClick={() => a.openLead(dupe.id)} className="font-semibold text-teal underline">{dupe.name}</button> ({stageLabel(dupe.stage)}).
            </div>
          )}
        </Block>

        <Block title="Business profile">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Service needed</Label>
              <select className="select" value={l.service} onChange={set('service')}>{SERVICES.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <div><Label>Business type</Label><input className="field" value={l.bizType || ''} onChange={set('bizType')} /></div>
            <div><Label>Place</Label><input className="field" value={l.place || ''} onChange={set('place')} /></div>
            <div><Label>Running since</Label><input className="field" placeholder="e.g. 2015" value={l.since || ''} onChange={set('since')} /></div>
            <div className="sm:col-span-2"><Label>Turnover (monthly or yearly)</Label><input className="field" placeholder="e.g. ₹20L / month" value={l.turnover || ''} onChange={set('turnover')} /></div>
            <div className="sm:col-span-2">
              <Label>Current situation</Label>
              <textarea className="field resize-y" rows={3} placeholder="What problem are they trying to solve?" value={l.situation || ''} onChange={set('situation')} />
            </div>
          </div>
        </Block>

        <Block title="Activity">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { a.logActivity(l.id, 'call', 'Call logged'); say('Call logged.') }} className="rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[12.5px] font-medium hover:border-hair/[0.3]">Log a call</button>
            <button
              type="button"
              onClick={() => setMeet(meet ? null : { date: addDays(2), time: '11:00', advance: si < IDX.discovery && !closed })}
              className="rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[12.5px] font-medium hover:border-hair/[0.3]"
            >
              Schedule meeting
            </button>
          </div>
          {meet && (
            <div className="grid gap-2 rounded-xl bg-hair/[0.03] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" className="field w-auto" aria-label="Meeting date" value={meet.date} onChange={(e) => setMeet({ ...meet, date: e.target.value })} />
                <input type="time" className="field w-auto" aria-label="Meeting time" value={meet.time} onChange={(e) => setMeet({ ...meet, time: e.target.value })} />
                <button type="button" onClick={saveMeeting} className="rounded-lg bg-teal px-3 py-2 text-[12.5px] font-semibold text-onaccent hover:bg-teal-lt">Add to calendar</button>
              </div>
              {si < IDX.discovery && !closed && (
                <label className="flex items-center gap-2 text-[12.5px] text-mute">
                  <input type="checkbox" checked={meet.advance} onChange={(e) => setMeet({ ...meet, advance: e.target.checked })} />
                  Also move this lead to Discovery meeting
                </label>
              )}
            </div>
          )}
          {meetings.length > 0 && (
            <div className="flex flex-col gap-1">
              {meetings.map((m) => (
                <button key={m.id} type="button" onClick={() => { onClose(); ws.actions.openMeeting(m.id) }} className="flex items-center justify-between rounded-lg bg-teal/[0.06] px-3 py-2 text-left text-[12.5px] hover:bg-teal/[0.1]">
                  <span className="truncate font-medium text-teal">↳ {m.title || 'Meeting'}</span>
                  <span className="whitespace-nowrap text-mute">{pretty(m.date)}{m.time ? ' · ' + m.time : ''}</span>
                </button>
              ))}
            </div>
          )}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addNote() }}>
            <input className="field flex-1" placeholder="Add a note after the call…" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="submit" className="rounded-lg border border-hair/[0.14] px-3 text-[12.5px] font-medium hover:border-hair/[0.3]">Add</button>
          </form>
          <ol className="flex flex-col gap-3">
            {arr(l.timeline).map((t) => (
              <li key={t.id} className="group grid grid-cols-[14px_1fr_auto] gap-2.5 text-[13px]">
                <span className={cn('mt-[6px] h-2 w-2 rounded-full', DOT[t.kind] || 'bg-mute2')} />
                <div className="min-w-0">
                  <div className="whitespace-pre-wrap break-words">{t.text}</div>
                  <div className="text-[12px] text-mute2">{pretty(String(t.at || '').slice(0, 10))}{t.kind !== 'created' ? ' · ' + t.kind : ''}</div>
                </div>
                {(t.kind === 'note' || t.kind === 'call') && (
                  <button type="button" onClick={() => a.removeEntry(l.id, t.id)} aria-label="Delete entry" className="px-1 text-[15px] leading-none text-mute2 opacity-0 hover:text-fg focus:opacity-100 group-hover:opacity-100">×</button>
                )}
              </li>
            ))}
          </ol>
        </Block>

        <div className="border-t border-hair/[0.07] pt-4">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <span className="text-mute">Delete this lead and its history? This can't be undone.</span>
              <button type="button" onClick={() => a.removeLead(l.id)} className="rounded-lg bg-pink px-3 py-1.5 font-semibold text-onaccent">Delete lead</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-1.5 font-medium text-mute hover:text-fg">Keep it</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-[12.5px] font-medium text-mute hover:text-pink">Delete lead</button>
          )}
        </div>
      </aside>
    </>
  )
}

function Block({ title, children }) {
  return (
    <section className="flex flex-col gap-2.5 border-t border-hair/[0.07] pt-4 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-mute2">{title}</div>
      {children}
    </section>
  )
}
