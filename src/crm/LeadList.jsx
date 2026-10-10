import { useState } from 'react'
import { pretty } from '../lib/helpers'
import { IDX, money, inr, stageLabel, isOpen, arr } from './lib'
import { FollowUp, StagePill } from './bits'

const COLS = [
  { k: 'name', label: 'Lead' },
  { k: 'service', label: 'Service' },
  { k: 'source', label: 'Source' },
  { k: 'stage', label: 'Stage' },
  { k: 'money', label: 'Can afford / deal', num: true },
  { k: 'followUp', label: 'Next follow-up' },
  { k: 'createdAt', label: 'Added' },
  { k: 'lastAt', label: 'Last activity' },
]

function val(l, k) {
  if (k === 'money') return money(l).v || 0
  if (k === 'stage') return IDX[l.stage] ?? 0
  if (k === 'followUp') return l.followUp || (isOpen(l) ? '9999' : '99999')
  return String(l[k] || '').toLowerCase()
}

// Export the leads currently shown. xlsx loads on demand.
async function exportXlsx(rows) {
  if (!rows.length) return
  const XLSX = await import('xlsx')
  const data = rows.map((l) => ({
    Lead: l.name || '',
    'Contact person': l.person || '',
    Phone: l.phone || '',
    Email: l.email || '',
    Service: l.service || '',
    Source: l.source || '',
    Stage: stageLabel(l.stage),
    'Can afford (₹)': l.budget || '',
    'Deal value (₹)': l.deal || '',
    'Lost reason': l.lostReason || '',
    'Next follow-up': l.followUp || '',
    Added: l.createdAt || '',
    'Closed on': l.closedAt || '',
    'Business type': l.bizType || '',
    Place: l.place || '',
    'Running since': l.since || '',
    Turnover: l.turnover || '',
    'Current situation': l.situation || '',
    Notes: arr(l.timeline).filter((t) => t.kind === 'note' || t.kind === 'call').map((t) => t.text).join(' | '),
  }))
  const sheet = XLSX.utils.json_to_sheet(data)
  sheet['!cols'] = Object.keys(data[0]).map((k) => ({ wch: k === 'Current situation' || k === 'Notes' ? 40 : 16 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Consultation leads')
  XLSX.writeFile(wb, 'consultation-leads-' + new Date().toISOString().slice(0, 10) + '.xlsx')
}

export default function LeadList({ leads, today, onOpen }) {
  const [sort, setSort] = useState({ k: 'createdAt', dir: -1 })
  const rows = leads.slice().sort((a, b) => {
    const x = val(a, sort.k), y = val(b, sort.k)
    return (x < y ? -1 : x > y ? 1 : 0) * sort.dir
  })
  const by = (k) => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: 1 }))

  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/[0.07] px-5 py-3">
        <span className="text-[12.5px] text-mute">{rows.length} lead{rows.length === 1 ? '' : 's'}</span>
        <button
          type="button"
          onClick={() => exportXlsx(rows)}
          disabled={!rows.length}
          className="rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[12.5px] font-medium hover:border-hair/[0.3] disabled:opacity-40"
        >
          Export to Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-[13px] tabular-nums">
          <thead>
            <tr className="border-b border-hair/[0.07]">
              {COLS.map((c) => (
                <th
                  key={c.k}
                  aria-sort={sort.k === c.k ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}
                  className={'whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-mute ' + (c.num ? 'text-right' : '')}
                >
                  <button type="button" onClick={() => by(c.k)} className="uppercase tracking-[inherit]">
                    {c.label}{sort.k === c.k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const m = money(l)
              return (
                <tr
                  key={l.id}
                  tabIndex={0}
                  onClick={() => onOpen(l.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onOpen(l.id) }}
                  className="cursor-pointer border-b border-hair/[0.06] last:border-b-0 hover:bg-hair/[0.03]"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{l.name || 'N/A'}</div>
                    <div className="text-[12px] text-mute">{[l.person, l.phone].filter(Boolean).join(' · ') || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-2.5">{l.service || 'N/A'}</td>
                  <td className="px-4 py-2.5">{l.source || 'N/A'}</td>
                  <td className="px-4 py-2.5"><StagePill stage={l.stage} /></td>
                  <td className="px-4 py-2.5 text-right">
                    {m.v ? <>{inr(m.v)}<div className="text-[12px] text-mute">{m.kind === 'deal' ? 'deal' : 'can afford'}</div></> : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[12.5px]">{isOpen(l) ? <FollowUp l={l} today={today} /> : <span className="text-mute2">—</span>}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-mute">{pretty(l.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-mute">{pretty(l.lastAt)}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={COLS.length} className="px-4 py-10 text-center text-mute2">No leads match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
