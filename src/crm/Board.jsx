import { useState } from 'react'
import { cn } from '../lib/helpers'
import { STAGES, IDX, DEAL_FROM, money, inr, shortInr, boardSort, quietDays, isOpen } from './lib'
import { FollowUp } from './bits'

export default function Board({ leads, today, flashId, onOpen, onMove }) {
  const [dragId, setDragId] = useState('')
  const [over, setOver] = useState('')

  return (
    <div className="-mx-1 flex items-start gap-3 overflow-x-auto px-1 pb-3">
      {STAGES.map((st) => {
        const items = leads.filter((l) => l.stage === st.k).sort(boardSort)
        const closed = st.k === 'won' || st.k === 'lost'
        const total = items.reduce((t, l) => t + (money(l).v || 0), 0)
        const dealCol = IDX[st.k] >= DEAL_FROM && st.k !== 'lost'
        const sub = st.k === 'lost' ? `${items.length} closed` : total ? `${shortInr(total)} ${dealCol ? 'deal value' : 'can afford'}` : '—'
        return (
          <section
            key={st.k}
            aria-label={st.label}
            onDragOver={(e) => { if (!dragId) return; e.preventDefault(); if (over !== st.k) setOver(st.k) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver('') }}
            onDrop={(e) => {
              e.preventDefault()
              const id = dragId
              setDragId(''); setOver('')
              if (id) onMove(id, st.k)
            }}
            className={cn(
              'min-h-[440px] flex-none rounded-2xl border-2 border-dashed p-2.5 transition-colors',
              closed ? 'w-[220px]' : 'w-[258px]',
              over === st.k ? 'border-teal bg-teal/[0.06]' : 'border-transparent bg-hair/[0.04]',
            )}
          >
            <header className="flex items-center gap-2 px-1 pt-0.5">
              <span className="h-2 w-2 flex-none rounded-full" style={{ background: st.color }} />
              <span className="flex-1 text-[13px] font-semibold">{st.label}</span>
              <span className="rounded-full bg-surface px-2 text-[12px] font-semibold text-mute">{items.length}</span>
            </header>
            <div className="px-1 pb-2.5 pt-0.5 text-[12px] tabular-nums text-mute">{sub}</div>
            <div className="flex flex-col gap-2">
              {items.map((l) => (
                <Card
                  key={l.id}
                  l={l}
                  today={today}
                  flash={flashId === l.id}
                  dragging={dragId === l.id}
                  onOpen={() => onOpen(l.id)}
                  onDragStart={(e) => {
                    setDragId(l.id)
                    e.dataTransfer.effectAllowed = 'move'
                    try { e.dataTransfer.setData('text/plain', l.id) } catch { /* some browsers refuse */ }
                  }}
                  onDragEnd={() => { setDragId(''); setOver('') }}
                />
              ))}
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-hair/[0.12] px-2 py-5 text-center text-[12px] text-mute2">Drag a lead here</div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Card({ l, today, flash, dragging, onOpen, onDragStart, onDragEnd }) {
  const quiet = quietDays(l, today)
  const m = money(l)
  return (
    <article
      draggable
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'cursor-grab rounded-xl border border-hair/[0.08] bg-surface px-3 py-2.5 shadow-[var(--shadow-card)] transition hover:border-hair/[0.2] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal',
        dragging && 'opacity-40',
        quiet && 'opacity-60',
        flash && 'ring-2 ring-teal',
      )}
    >
      <div className="text-[13.5px] font-semibold leading-snug">{l.name || 'N/A'}</div>
      <div className="mt-0.5 truncate text-[12px] text-mute">{[l.bizType, l.place].filter(Boolean).join(' · ') || l.person || l.phone}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded-full bg-teal/[0.09] px-2 text-[11px] font-medium text-teal">{l.service || 'N/A'}</span>
        <span className="rounded-full border border-hair/[0.12] px-2 text-[11px] font-medium text-mute">{l.source || 'N/A'}</span>
        {quiet > 0 && <span className="rounded-full bg-yellow/[0.13] px-2 text-[11px] font-medium text-yellow">{quiet}d quiet</span>}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-hair/[0.07] pt-2 text-[12px]">
        {l.stage === 'lost' ? (
          <span className="truncate text-mute2">{l.lostReason || 'Lost'}</span>
        ) : m.kind === 'deal' ? (
          <span className="tabular-nums text-soft"><b className="font-semibold text-fg">{inr(m.v)}</b> {l.stage === 'won' ? 'won' : 'deal'}</span>
        ) : IDX[l.stage] >= DEAL_FROM && l.stage !== 'won' ? (
          <span className="text-yellow">Add deal value</span>
        ) : m.v ? (
          <span className="tabular-nums text-soft">Can afford <b className="font-semibold text-fg">{inr(m.v)}</b></span>
        ) : (
          <span className="text-mute2">Budget not known</span>
        )}
        {isOpen(l) && <FollowUp l={l} today={today} />}
      </div>
    </article>
  )
}
