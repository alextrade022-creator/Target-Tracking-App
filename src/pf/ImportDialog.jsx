import { useMemo, useState } from 'react'
import { cn, pretty } from '../lib/helpers'
import { Label } from '../ws/ui'
import { Chip } from './ui'
import { readRows, findHeader, guessMapping, buildImport, cells } from './csv'
import { inr, catDef } from './lib'

export default function ImportDialog({ pf, onClose }) {
  const { state: s, actions: a } = pf
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState(null)
  const [cfg, setCfg] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [done, setDone] = useState(null)

  const load = async (f) => {
    if (!f) return
    setErr(''); setBusy(true)
    try {
      const r = await readRows(f)
      if (!r.length) throw new Error('empty')
      const headerRow = findHeader(r)
      setRows(r); setFile(f)
      setCfg({ headerRow, ...guessMapping(r[headerRow]) })
    } catch (e) {
      setErr('Could not read this file. Please use a CSV or Excel (.xlsx / .xls) export from your bank or card.')
    } finally {
      setBusy(false)
    }
  }

  const header = rows && cfg && cfg.headerRow >= 0 ? cells(rows[cfg.headerRow]) : []
  const width = rows ? Math.max(0, ...rows.slice(0, 60).map((r) => cells(r).length)) : 0
  const colOpts = [{ value: -1, label: '— none —' }].concat(
    Array.from({ length: width }, (_, i) => ({ value: i, label: `Column ${i + 1}${header[i] ? ' · ' + String(header[i]).slice(0, 30) : ''}` })),
  )
  const result = useMemo(() => (rows && cfg ? buildImport(rows, cfg, s.txns) : null), [rows, cfg, s.txns])
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }))
  const setHeaderRow = (n) => setCfg((c) => ({ ...c, headerRow: n, ...guessMapping(n >= 0 ? rows[n] : []), order: c.order }))

  const doImport = () => {
    if (!result?.fresh.length) return
    a.importTxns(result.fresh, file?.name)
    setDone({ count: result.fresh.length, dupes: result.dupes, skipped: result.skipped })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-[920px] rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-hair/[0.08] px-6 py-4">
          <div>
            <h2 className="font-head text-[17px] font-semibold">Import bank statement</h2>
            <div className="mt-0.5 text-[12.5px] text-mute">{file ? file.name : 'CSV or Excel export from your bank or credit card'}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-[20px] leading-none text-mute hover:text-fg" aria-label="Close">×</button>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="font-head text-[22px] font-bold text-green">{done.count} transactions imported</div>
            <div className="mt-2 text-[13px] text-mute">
              {done.dupes > 0 && `${done.dupes} duplicates skipped · `}{done.skipped > 0 ? `${done.skipped} non-transaction rows ignored · ` : ''}categories filled in automatically.
            </div>
            <div className="mt-1 text-[12.5px] text-mute2">You can change any category in the list, or undo this import from “Recent imports”.</div>
            <button type="button" onClick={onClose} className="mt-6 rounded-lg bg-teal px-5 py-2.5 text-[13px] font-semibold text-onaccent">Done</button>
          </div>
        ) : !rows ? (
          <div className="p-6">
            <label
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]) }}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors',
                drag ? 'border-teal bg-teal/[0.05]' : 'border-hair/[0.15] hover:border-teal/50',
              )}
            >
              <div className="text-[15px] font-medium">{busy ? 'Reading file…' : 'Drop your statement here, or click to choose'}</div>
              <div className="mt-1.5 text-[12.5px] text-mute">.csv, .xlsx or .xls · works with HDFC, SBI, ICICI, Axis, Federal, Kotak and card statements</div>
              <input type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
            </label>
            {err && <div className="mt-3 rounded-lg bg-pink/[0.08] px-4 py-3 text-[13px] text-pink">{err}</div>}
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-1 text-[13.5px] font-medium">1. Check the columns</div>
            <div className="mb-4 text-[12.5px] text-mute">We guessed these from the file. Change any that look wrong.</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Pick label="Header row" value={cfg.headerRow} onChange={setHeaderRow}
                options={[{ value: -1, label: 'No header row' }].concat(rows.slice(0, 30).map((r, i) => ({
                  value: i, label: `Row ${i + 1}: ${cells(r).filter((c) => String(c).trim()).slice(0, 3).join(' · ').slice(0, 40) || '(empty)'}`,
                })))} />
              <Pick label="Date column" value={cfg.date} onChange={(v) => set('date', v)} options={colOpts} />
              <Pick label="Date format" value={cfg.order} onChange={(v) => set('order', v)} raw
                options={[{ value: 'dmy', label: 'DD/MM/YYYY (India)' }, { value: 'mdy', label: 'MM/DD/YYYY' }]} />
              <Pick label="Description column" value={cfg.desc} onChange={(v) => set('desc', v)} options={colOpts} />
              <Pick label="Amounts are in" value={cfg.mode} onChange={(v) => set('mode', v)} raw
                options={[
                  { value: 'split', label: 'Separate debit & credit columns' },
                  { value: 'sign', label: 'One amount column' },
                  { value: 'type', label: 'One amount + a Dr/Cr column' },
                ]} />
              {cfg.mode === 'split' ? (
                <>
                  <Pick label="Debit / withdrawal column" value={cfg.debit} onChange={(v) => set('debit', v)} options={colOpts} />
                  <Pick label="Credit / deposit column" value={cfg.credit} onChange={(v) => set('credit', v)} options={colOpts} />
                </>
              ) : (
                <>
                  <Pick label="Amount column" value={cfg.amount} onChange={(v) => set('amount', v)} options={colOpts} />
                  {cfg.mode === 'type' ? (
                    <Pick label="Dr/Cr column" value={cfg.typeCol} onChange={(v) => set('typeCol', v)} options={colOpts} />
                  ) : (
                    <Pick label="How to read amounts" value={cfg.rule} onChange={(v) => set('rule', v)} raw
                      options={[
                        { value: 'sign', label: 'Negative = expense, positive = income' },
                        { value: 'allExpense', label: 'All are expenses (credit-card statement)' },
                      ]} />
                  )}
                </>
              )}
            </div>

            <div className="mb-2 mt-6 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[13.5px] font-medium">2. Preview</div>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="green">{result?.fresh.length || 0} new</Chip>
                {result?.dupes > 0 && <Chip tone="amber">{result.dupes} already imported</Chip>}
                {result?.skipped > 0 && <Chip>{result.skipped} rows ignored</Chip>}
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-hair/[0.08]">
              <table className="w-full min-w-[620px] text-left text-[12.5px]">
                <thead className="bg-hair/[0.03] text-mute">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(result?.fresh || []).slice(0, 8).map((t, i) => (
                    <tr key={i} className="border-t border-hair/[0.06]">
                      <td className="whitespace-nowrap px-3 py-2">{pretty(t.date)}</td>
                      <td className="max-w-[320px] truncate px-3 py-2" title={t.desc}>{t.desc}</td>
                      <td className="px-3 py-2" style={{ color: catDef(t.category).color }}>{catDef(t.category).label}</td>
                      <td className={cn('whitespace-nowrap px-3 py-2 text-right font-medium', t.type === 'income' && 'text-green')}>
                        {t.type === 'income' ? '+' : '−'}{inr(t.amount)}
                      </td>
                    </tr>
                  ))}
                  {!result?.fresh.length && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-mute2">
                      {result?.dupes > 0
                        ? 'Everything in this file has already been imported.'
                        : 'No transactions found with these settings. Check the date and amount columns.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => { setRows(null); setCfg(null); setFile(null) }} className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-mute hover:text-fg">
                Choose another file
              </button>
              <button
                type="button"
                onClick={doImport}
                disabled={!result?.fresh.length}
                className="rounded-lg bg-teal px-5 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt disabled:opacity-40"
              >
                Import {result?.fresh.length || 0} transactions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Pick({ label, value, onChange, options, raw = false }) {
  return (
    <div>
      <Label>{label}</Label>
      <select className="select" value={value} onChange={(e) => onChange(raw ? e.target.value : Number(e.target.value))}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
