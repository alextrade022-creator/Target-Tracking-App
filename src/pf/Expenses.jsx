import { useState } from 'react'
import { cn, iso, pretty } from '../lib/helpers'
import { Section, Empty, Label } from '../ws/ui'
import { Stat, Bar, Chip } from './ui'
import ImportDialog from './ImportDialog'
import { inr, num, arr, monthLabel, monthTotals, categoryTotals, catDef, catsFor, autoCategory, EXPENSE_CATS, INCOME_CATS } from './lib'

export default function Expenses({ pf }) {
  const { state: s, actions: a } = pf
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [type, setType] = useState('all')
  const [limit, setLimit] = useState(100)
  const [showImport, setShowImport] = useState(false)
  const ym = s.month
  const tot = monthTotals(s.txns, ym)
  const cats = categoryTotals(s.txns, ym)

  const needle = q.trim().toLowerCase()
  const list = arr(s.txns)
    .filter((t) => t.date?.startsWith(ym))
    .filter((t) => type === 'all' || t.type === type)
    .filter((t) => cat === 'all' || t.category === cat)
    .filter((t) => !needle || String(t.desc || '').toLowerCase().includes(needle) || String(t.note || '').toLowerCase().includes(needle))
    .sort((x, y) => (y.date || '').localeCompare(x.date || '') || (y.createdAt || 0) - (x.createdAt || 0))

  const imports = arr(s.settings?.imports)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => a.shiftMonth(-1)} className="rounded-lg border border-hair/[0.14] px-3 py-2 text-[13px] text-mute hover:text-fg" aria-label="Previous month">‹</button>
          <div className="min-w-[150px] text-center font-head text-[15px] font-semibold">{monthLabel(ym)}</div>
          <button type="button" onClick={() => a.shiftMonth(1)} className="rounded-lg border border-hair/[0.14] px-3 py-2 text-[13px] text-mute hover:text-fg" aria-label="Next month">›</button>
        </div>
        <button type="button" onClick={() => setShowImport(true)} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">
          Import statement (CSV / Excel)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Income" value={inr(tot.income)} tone="text-green" />
        <Stat label="Spent" value={inr(tot.spend)} tone="text-orange" />
        <Stat label="Invested" value={inr(tot.invested)} />
        <Stat
          label="Savings rate"
          value={tot.rate === null ? '—' : Math.round(tot.rate) + '%'}
          sub={tot.income ? `${inr(tot.income - tot.spend)} kept` : 'No income recorded'}
        />
      </div>

      <AddTransaction onAdd={(t) => a.add('txns', t)} defaultDate={ym === iso(new Date()).slice(0, 7) ? iso(new Date()) : ym + '-01'} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <section className="panel min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-hair/[0.07] px-5 py-3">
            <input className="field min-w-[180px] flex-1 py-2" placeholder="Search description or note…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select w-auto py-2" value={type} onChange={(e) => { setType(e.target.value); setCat('all') }}>
              <option value="all">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
            <select className="select w-auto py-2" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {(type === 'income' ? INCOME_CATS : type === 'expense' ? EXPENSE_CATS : EXPENSE_CATS.concat(INCOME_CATS)).map((c) => (
                <option key={c.k} value={c.k}>{c.label}</option>
              ))}
            </select>
          </div>
          {list.length === 0 && <Empty>No transactions for {monthLabel(ym)}. Add one above or import a statement.</Empty>}
          {list.slice(0, limit).map((t) => <TxnRow key={t.id} t={t} a={a} />)}
          {list.length > limit && (
            <button type="button" onClick={() => setLimit(limit + 100)} className="w-full py-3 text-[13px] font-medium text-teal hover:bg-hair/[0.03]">
              Show more ({list.length - limit} left)
            </button>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <Section title="By category">
            {cats.length === 0 && <Empty>No spending yet.</Empty>}
            <div className="flex flex-col gap-3 px-5 py-4">
              {cats.map((c) => (
                <button key={c.k} type="button" onClick={() => { setType('expense'); setCat(c.k) }} className="text-left">
                  <div className="mb-1 flex justify-between text-[12.5px]">
                    <span className={cn(cat === c.k && 'font-semibold text-teal')}>{c.label}</span>
                    <span className="font-medium">{inr(c.total)}</span>
                  </div>
                  <Bar pct={(c.total / (cats[0]?.total || 1)) * 100} color={c.color} height={5} />
                </button>
              ))}
            </div>
          </Section>

          {imports.length > 0 && (
            <Section title="Recent imports">
              {imports.slice(0, 6).map((b) => <ImportRow key={b.id} b={b} pf={pf} />)}
            </Section>
          )}
        </div>
      </div>

      {showImport && <ImportDialog pf={pf} onClose={() => setShowImport(false)} />}
    </div>
  )
}

/* One past import: how many rows are expenses vs income, switch them all, or undo. */
function ImportRow({ b, pf }) {
  const { state: s, actions: a } = pf
  const [undoing, setUndoing] = useState(false)
  const mine = (s.txns || []).filter((t) => t && t.batch === b.id)
  const inc = mine.filter((t) => t.type === 'income').length
  const exp = mine.length - inc
  const link = 'text-[12px] font-medium text-teal hover:text-teal-lt'
  return (
    <div className="border-b border-hair/[0.06] px-5 py-2.5 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-medium" title={b.file}>{b.file || 'Statement'}</div>
          <div className="text-[11.5px] text-mute2">{exp} expense{exp === 1 ? '' : 's'} · {inc} income · {b.at ? pretty(b.at.slice(0, 10)) : 'N/A'}</div>
        </div>
        {!undoing && <button type="button" onClick={() => setUndoing(true)} className="text-[12px] font-medium text-mute hover:text-pink">Undo</button>}
      </div>
      {undoing ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-mute">Remove these {mine.length} transactions?</span>
          <button type="button" onClick={() => a.undoImport(b.id)} className="font-semibold text-pink">Remove</button>
          <button type="button" onClick={() => setUndoing(false)} className="text-mute hover:text-fg">Keep</button>
        </div>
      ) : (
        <div className="mt-1 flex flex-wrap gap-3">
          {inc > 0 && <button type="button" onClick={() => a.setBatchType(b.id, 'expense')} className={link}>Set all to expense</button>}
          {exp > 0 && <button type="button" onClick={() => a.setBatchType(b.id, 'income')} className={link}>Set all to income</button>}
        </div>
      )}
    </div>
  )
}

function TxnRow({ t, a }) {
  const income = t.type === 'income'
  return (
    <div className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-hair/[0.06] px-5 py-2.5 last:border-b-0">
      <div className="w-[70px] flex-none text-[12px] text-mute">{t.date ? pretty(t.date) : 'N/A'}</div>
      <div className="min-w-[160px] flex-1">
        <div className="truncate text-[13.5px]" title={t.desc}>{t.desc || 'N/A'}</div>
        <input
          className="mt-0.5 w-full bg-transparent text-[12px] text-mute outline-none placeholder:text-mute2/70"
          placeholder="Add a note…"
          value={t.note || ''}
          onChange={(e) => a.patch('txns', t.id, { note: e.target.value })}
        />
      </div>
      <select
        className="select w-[170px] flex-none py-1.5 text-[12px]"
        value={t.category || ''}
        onChange={(e) => a.patch('txns', t.id, { category: e.target.value })}
        style={{ color: catDef(t.category).color }}
      >
        {catsFor(t.type).map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
      </select>
      <button
        type="button"
        onClick={() => a.flipType(t.id)}
        title={`Click to switch to ${income ? 'expense' : 'income'}`}
        className={cn('w-[110px] flex-none rounded-md text-right text-[14px] font-semibold hover:bg-hair/[0.05]', income ? 'text-green' : 'text-fg')}
      >
        {income ? '+' : '−'}{inr(t.amount)}
      </button>
      <div className="flex w-[70px] flex-none items-center justify-end gap-1">
        {t.source === 'import' ? <Chip>Import</Chip> : <Chip tone="blue">Manual</Chip>}
        <button
          type="button"
          onClick={() => a.remove('txns', t.id)}
          aria-label="Delete transaction"
          className="px-1 text-[16px] leading-none text-mute2 opacity-0 hover:text-pink group-hover:opacity-100 focus:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function AddTransaction({ onAdd, defaultDate }) {
  const blank = { date: defaultDate, desc: '', amount: '', type: 'expense', category: 'other', note: '' }
  const [v, setV] = useState(blank)
  const [touched, setTouched] = useState(false) // category picked by hand?

  const set = (p) => {
    setV((prev) => {
      const next = { ...prev, ...p }
      if ('type' in p && p.type !== prev.type) next.category = autoCategory(next.desc, next.type)
      else if (!touched && 'desc' in p) next.category = autoCategory(next.desc, next.type)
      return next
    })
    if ('type' in p) setTouched(false)
  }
  const ok = v.desc.trim() && num(v.amount) > 0 && v.date
  const submit = () => {
    if (!ok) return
    onAdd({ date: v.date, desc: v.desc.trim(), amount: num(v.amount), type: v.type, category: v.category, note: v.note.trim(), source: 'manual' })
    setV({ ...blank, date: v.date, type: v.type })
    setTouched(false)
  }
  const enter = (e) => { if (e.key === 'Enter') submit() }

  return (
    <Section title="Add a transaction">
      <div className="grid grid-cols-2 gap-3 px-5 py-4 md:grid-cols-[140px_120px_1fr_130px_190px_auto]">
        <div>
          <Label>Date</Label>
          <input type="date" className="field" value={v.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <select className="select" value={v.type} onChange={(e) => set({ type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="col-span-2 md:col-span-1">
          <Label>Description</Label>
          <input className="field" placeholder="e.g. Swiggy dinner, Salary, Petrol" value={v.desc} onChange={(e) => set({ desc: e.target.value })} onKeyDown={enter} />
        </div>
        <div>
          <Label>Amount (₹)</Label>
          <input className="field" type="number" inputMode="decimal" min="0" step="any" value={v.amount} onChange={(e) => set({ amount: e.target.value })} onKeyDown={enter} />
        </div>
        <div>
          <Label>Category {touched ? '' : '(auto)'}</Label>
          <select className="select" value={v.category} onChange={(e) => { setTouched(true); set({ category: e.target.value }) }}>
            {catsFor(v.type).map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
          </select>
        </div>
        <div className="col-span-2 flex items-end md:col-span-1">
          <button type="button" onClick={submit} disabled={!ok} className="w-full rounded-lg bg-teal px-5 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt disabled:opacity-40">
            Add
          </button>
        </div>
      </div>
    </Section>
  )
}
