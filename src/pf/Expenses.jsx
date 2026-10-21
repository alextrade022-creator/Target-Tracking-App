import { useEffect, useState } from 'react'
import { cn, iso, pretty } from '../lib/helpers'
import { Section, Empty, Label } from '../ws/ui'
import { Stat, Bar, Chip } from './ui'
import ImportDialog from './ImportDialog'
import { AccountPicker, InvestmentPicker, TransferDialog } from './Accounts'
import { Modal } from '../crm/bits'
import { inr, num, arr, monthLabel, monthTotals, categoryTotals, catDef, catsFor, autoCategory, matchLoan, endpointName, EXPENSE_CATS, INCOME_CATS } from './lib'

export default function Expenses({ pf }) {
  const { state: s, actions: a } = pf
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState(() => new Set()) // selected transaction ids
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [editing, setEditing] = useState(null) // transaction being edited
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

  // Imports whose transactions have all been deleted aren't worth showing.
  const imports = arr(s.settings?.imports).filter((b) => arr(s.txns).some((t) => t.batch === b.id))

  // 20 per page; a new month, search or filter starts again at page 1 with nothing selected.
  const PER_PAGE = 20
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const pg = Math.min(page, pages)
  const rows = list.slice((pg - 1) * PER_PAGE, pg * PER_PAGE)
  useEffect(() => { setPage(1); setSel(new Set()); setConfirmBulk(false) }, [ym, needle, type, cat])
  const chosen = list.filter((t) => sel.has(t.id))
  const pageAll = rows.length > 0 && rows.every((t) => sel.has(t.id))
  const toggle = (id) => setSel((old) => { const n = new Set(old); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const togglePage = () => setSel((old) => { const n = new Set(old); rows.forEach((t) => (pageAll ? n.delete(t.id) : n.add(t.id))); return n })
  const goPage = (n) => { setPage(n); setConfirmBulk(false); document.getElementById('txn-list')?.scrollIntoView({ block: 'start', behavior: 'smooth' }) }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => a.shiftMonth(-1)} className="rounded-lg border border-hair/[0.14] px-3 py-2 text-[13px] text-mute hover:text-fg" aria-label="Previous month">‹</button>
          <div className="min-w-[150px] text-center font-head text-[15px] font-semibold">{monthLabel(ym)}</div>
          <button type="button" onClick={() => a.shiftMonth(1)} className="rounded-lg border border-hair/[0.14] px-3 py-2 text-[13px] text-mute hover:text-fg" aria-label="Next month">›</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowTransfer(true)} className="rounded-lg border border-hair/[0.14] px-4 py-2.5 text-[13px] font-medium hover:border-hair/[0.3]">
            ⇄ Transfer money
          </button>
          <button type="button" onClick={() => setShowImport(true)} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">
            Import statement (CSV / Excel)
          </button>
        </div>
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

      <AddTransaction loans={s.loans} accounts={s.savings} investments={s.investments} lastAccount={s.settings?.lastAccount} onAdd={(t) => a.add('txns', t)} defaultDate={ym === iso(new Date()).slice(0, 7) ? iso(new Date()) : ym + '-01'} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <section id="txn-list" className="panel min-w-0 scroll-mt-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-hair/[0.07] px-5 py-3">
            <input className="field min-w-[180px] flex-1 py-2" placeholder="Search description or note…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select w-auto py-2" value={type} onChange={(e) => { setType(e.target.value); setCat('all') }}>
              <option value="all">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
              <option value="transfer">Transfers</option>
            </select>
            <select className="select w-auto py-2" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {(type === 'income' ? INCOME_CATS : type === 'expense' ? EXPENSE_CATS : EXPENSE_CATS.concat(INCOME_CATS)).map((c) => (
                <option key={c.k} value={c.k}>{c.label}</option>
              ))}
            </select>
          </div>
          {list.length > 0 && (
            <div className={cn('flex min-h-[46px] flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-hair/[0.07] px-5 py-2 text-[12.5px]', chosen.length && 'bg-teal/[0.05]')}>
              <label className="flex cursor-pointer items-center gap-2 font-medium">
                <input type="checkbox" checked={pageAll} onChange={togglePage} aria-label="Select all on this page" />
                {chosen.length ? `${chosen.length} selected` : 'Select all on this page'}
              </label>
              {chosen.length > 0 && chosen.length < list.length && (
                <button type="button" onClick={() => setSel(new Set(list.map((t) => t.id)))} className="font-semibold text-teal">Select all {list.length}</button>
              )}
              {chosen.length > 0 && (
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  {confirmBulk ? (
                    <>
                      <span>Delete {chosen.length} transaction{chosen.length === 1 ? '' : 's'}? This can't be undone.</span>
                      <button type="button" onClick={() => { a.removeMany('txns', chosen.map((t) => t.id)); setSel(new Set()); setConfirmBulk(false) }} className="rounded-lg bg-pink px-3 py-1 font-semibold text-onaccent">Delete</button>
                      <button type="button" onClick={() => setConfirmBulk(false)} className="font-medium text-mute hover:text-fg">Keep</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setSel(new Set())} className="font-medium text-mute hover:text-fg">Clear</button>
                      <button type="button" onClick={() => setConfirmBulk(true)} className="rounded-lg border border-pink/50 px-3 py-1 font-semibold text-pink hover:bg-pink/[0.07]">Delete selected</button>
                    </>
                  )}
                </span>
              )}
            </div>
          )}
          {list.length === 0 && <Empty>No transactions for {monthLabel(ym)}. Add one above or import a statement.</Empty>}
          {rows.map((t) => (t.type === 'transfer'
            ? <TransferRow key={t.id} t={t} a={a} s={s} onEdit={() => setEditing(t)} selected={sel.has(t.id)} onSelect={() => toggle(t.id)} />
            : <TxnRow key={t.id} t={t} a={a} loans={s.loans} accounts={s.savings} investments={s.investments} onEdit={() => setEditing(t)} selected={sel.has(t.id)} onSelect={() => toggle(t.id)} />))}
          {list.length > PER_PAGE && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[12.5px] text-mute">
              <span>Showing {(pg - 1) * PER_PAGE + 1}–{(pg - 1) * PER_PAGE + rows.length} of {list.length}</span>
              <Pager page={pg} pages={pages} onPage={goPage} />
            </div>
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
      {showTransfer && <TransferDialog pf={pf} onClose={() => setShowTransfer(false)} />}
      {editing && (editing.type === 'transfer'
        ? <TransferDialog pf={pf} txn={editing} onClose={() => setEditing(null)} />
        : <EditTransaction pf={pf} t={editing} onClose={() => setEditing(null)} />)}
    </div>
  )
}

/* A transfer between your own accounts / investments: not income, not spending. */
function TransferRow({ t, a, s, onEdit, selected, onSelect }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="group grid grid-cols-[88px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 border-b border-hair/[0.06] px-5 py-3 last:border-b-0 xl:grid-cols-[88px_minmax(0,1fr)_200px_auto]">
      <label className="flex cursor-pointer items-start gap-2 pt-0.5 text-[12px] text-mute">
        <input type="checkbox" className="mt-0.5" checked={!!selected} onChange={onSelect} aria-label="Select transaction" />
        <span>{t.date ? pretty(t.date) : 'N/A'}</span>
      </label>
      <div className="min-w-0">
        <div className="truncate text-[13.5px]">
          <span className="mr-1.5 text-mute">⇄</span>
          {endpointName(t.from, s.savings, s.investments)} → {endpointName(t.to, s.savings, s.investments)}
        </div>
        <input
          className="mt-0.5 w-full bg-transparent text-[12px] text-mute outline-none placeholder:text-mute2/70"
          placeholder="Add a note…"
          value={t.note || ''}
          onChange={(e) => a.patch('txns', t.id, { note: e.target.value })}
        />
      </div>
      <RowEnd amount={<span className="text-mute">{inr(t.amount)}</span>} confirm={confirm} setConfirm={setConfirm} onEdit={onEdit} onDelete={() => a.remove('txns', t.id)} what="transfer" />
      <div className="col-span-2 col-start-2 xl:col-span-1 xl:col-start-3 xl:row-start-1">
        <Chip tone={t.to?.kind === 'investment' ? 'blue' : 'slate'}>{t.to?.kind === 'investment' ? 'Invested' : 'Transfer'}</Chip>
      </div>
    </div>
  )
}

/* ‹ Previous 1 2 … Next › — long lists show the first, last and nearby pages. */
function Pager({ page, pages, onPage }) {
  const nums = []
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i)
  const items = nums.flatMap((n, i) => (i && n - nums[i - 1] > 1 ? ['gap' + n, n] : [n]))
  const b = 'h-[30px] min-w-[30px] rounded-lg border px-2 text-[12.5px] disabled:opacity-40'
  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Pages">
      <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} className={cn(b, 'border-hair/[0.14] hover:border-hair/[0.3]')}>‹ Previous</button>
      {items.map((n) => (typeof n === 'string'
        ? <span key={n} className="px-1 text-mute2">…</span>
        : <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}
            className={cn(b, n === page ? 'border-teal bg-teal font-semibold text-onaccent' : 'border-hair/[0.14] hover:border-hair/[0.3]')}>{n}</button>))}
      <button type="button" disabled={page === pages} onClick={() => onPage(page + 1)} className={cn(b, 'border-hair/[0.14] hover:border-hair/[0.3]')}>Next ›</button>
    </nav>
  )
}

/* Right end of a row: amount, then source chip, edit and delete (delete asks first). */
function RowEnd({ amount, chip = null, confirm, setConfirm, onEdit, onDelete, what }) {
  return (
    <div className="flex flex-col items-end gap-1 xl:col-start-4 xl:row-start-1">
      <div className="whitespace-nowrap text-[14px] font-semibold tabular-nums">{amount}</div>
      <div className="flex flex-nowrap items-center gap-1">
        {confirm ? (
          <span className="flex gap-2 text-[12px]">
            <button type="button" onClick={onDelete} className="font-semibold text-pink">Delete</button>
            <button type="button" onClick={() => setConfirm(false)} className="text-mute">Keep</button>
          </span>
        ) : (
          <>
            {chip}
            <button type="button" onClick={onEdit} aria-label={`Edit ${what}`} title="Edit" className="rounded px-1 text-[13px] text-mute2 hover:text-teal">✎</button>
            <button type="button" onClick={() => setConfirm(true)} aria-label={`Delete ${what}`} title="Delete" className="px-1 text-[16px] leading-none text-mute2 hover:text-pink">×</button>
          </>
        )}
      </div>
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

function TxnRow({ t, a, loans, accounts, investments, onEdit, selected, onSelect }) {
  const [confirm, setConfirm] = useState(false)
  const income = t.type === 'income'
  const emi = !income && t.category === 'emi' && arr(loans).length > 0
  const invest = !income && t.category === 'investment' && arr(investments).length > 0
  return (
    <div className="group grid grid-cols-[88px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 border-b border-hair/[0.06] px-5 py-3 last:border-b-0 xl:grid-cols-[88px_minmax(0,1fr)_200px_auto]">
      <label className="flex cursor-pointer items-start gap-2 pt-0.5 text-[12px] text-mute">
        <input type="checkbox" className="mt-0.5" checked={!!selected} onChange={onSelect} aria-label="Select transaction" />
        <span>{t.date ? pretty(t.date) : 'N/A'}</span>
      </label>
      <div className="min-w-0">
        <div className="truncate text-[13.5px]" title={t.desc}>{t.desc || 'N/A'}</div>
        <input
          className="mt-0.5 w-full bg-transparent text-[12px] text-mute outline-none placeholder:text-mute2/70"
          placeholder="Add a note…"
          value={t.note || ''}
          onChange={(e) => a.patch('txns', t.id, { note: e.target.value })}
        />
      </div>
      <RowEnd
        amount={<span className={income ? 'text-green' : 'text-fg'}>{income ? '+' : '−'}{inr(t.amount)}</span>}
        chip={t.source === 'import' ? <Chip>Import</Chip> : <Chip tone="blue">Manual</Chip>}
        confirm={confirm}
        setConfirm={setConfirm}
        onEdit={onEdit}
        onDelete={() => a.remove('txns', t.id)}
        what="transaction"
      />
      <div className="col-span-2 col-start-2 grid grid-cols-1 gap-1 sm:grid-cols-2 xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:grid-cols-1">
        <select
          className="select py-1.5 text-[12px]"
          value={t.category || ''}
          onChange={(e) => a.patch('txns', t.id, e.target.value === 'emi'
            ? { category: 'emi', loanId: t.loanId || matchLoan(t, loans), investmentId: '' }
            : { category: e.target.value, loanId: '', ...(e.target.value === 'investment' ? {} : { investmentId: '' }) })}
          style={{ color: catDef(t.category).color }}
          aria-label="Category"
        >
          {catsFor(t.type).map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
        </select>
        {emi && <LoanPicker loans={loans} value={t.loanId || ''} onChange={(loanId) => a.patch('txns', t.id, { loanId })} />}
        {invest && <InvestmentPicker investments={investments} value={t.investmentId || ''} onChange={(investmentId) => a.patch('txns', t.id, { investmentId })} />}
        {arr(accounts).length > 0 && <AccountPicker accounts={accounts} type={t.type} value={t.account || ''} onChange={(account) => a.patch('txns', t.id, { account })} />}
      </div>
    </div>
  )
}

/* "Which loan?" for an EMI payment. Links it to a loan in Loans & EMIs. */
function LoanPicker({ loans, value, onChange, className = 'py-1.5 text-[12px]' }) {
  return (
    <select
      className={cn('select', className, !value && 'text-yellow')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Which loan?"
      title="Which loan is this EMI for?"
    >
      <option value="">Which loan? (not linked)</option>
      {arr(loans).map((l) => <option key={l.id} value={l.id}>↳ {l.name || 'Loan'}{l.lender ? ' · ' + l.lender : ''}</option>)}
    </select>
  )
}

function AddTransaction({ onAdd, defaultDate, loans, accounts, investments, lastAccount }) {
  const defaultAccount = arr(accounts).some((x) => x.id === lastAccount) ? lastAccount : arr(accounts)[0]?.id || ''
  const blank = { date: defaultDate, desc: '', amount: '', type: 'expense', category: 'other', note: '', loanId: '', investmentId: '', account: defaultAccount }
  const [v, setV] = useState(blank)
  const [touched, setTouched] = useState(false) // category picked by hand?
  const [loanTouched, setLoanTouched] = useState(false) // loan picked by hand?

  const set = (p) => {
    setV((prev) => {
      const next = { ...prev, ...p }
      if ('type' in p && p.type !== prev.type) next.category = autoCategory(next.desc, next.type)
      else if (!touched && 'desc' in p) next.category = autoCategory(next.desc, next.type)
      // EMI payment: suggest the loan from the amount / lender until one is picked by hand
      if (next.type === 'expense' && next.category === 'emi') {
        if (!loanTouched && !('loanId' in p)) next.loanId = matchLoan({ desc: next.desc, amount: num(next.amount) }, loans)
      } else next.loanId = ''
      if (!(next.type === 'expense' && next.category === 'investment')) next.investmentId = ''
      return next
    })
    if ('type' in p) setTouched(false)
  }
  const isEmi = v.type === 'expense' && v.category === 'emi' && arr(loans).length > 0
  const isInvest = v.type === 'expense' && v.category === 'investment' && arr(investments).length > 0
  const ok = v.desc.trim() && num(v.amount) > 0 && v.date
  const submit = () => {
    if (!ok) return
    onAdd({
      date: v.date, desc: v.desc.trim(), amount: num(v.amount), type: v.type, category: v.category, note: v.note.trim(), source: 'manual',
      loanId: isEmi ? v.loanId : '', investmentId: isInvest ? v.investmentId : '', account: v.account,
    })
    setV({ ...blank, date: v.date, type: v.type, account: v.account })
    setTouched(false)
    setLoanTouched(false)
  }
  const enter = (e) => { if (e.key === 'Enter') submit() }

  return (
    <Section title="Add a transaction">
      <div className="grid grid-cols-2 items-start gap-3 px-5 py-4 sm:grid-cols-3 lg:grid-cols-4">
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
        <div className="col-span-2 sm:col-span-1 lg:col-span-2">
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
          {isEmi && (
            <div className="mt-2">
              <LoanPicker loans={loans} value={v.loanId} className="py-2 text-[13px]" onChange={(loanId) => { setLoanTouched(true); set({ loanId }) }} />
            </div>
          )}
          {isInvest && (
            <div className="mt-2">
              <InvestmentPicker investments={investments} value={v.investmentId} className="py-2 text-[13px]" onChange={(investmentId) => set({ investmentId })} />
            </div>
          )}
        </div>
        <div>
          <Label>{v.type === 'income' ? 'Received into' : 'Paid from'}</Label>
          {arr(accounts).length ? (
            <AccountPicker accounts={accounts} type={v.type} value={v.account} className="py-2.5 text-[13.5px]" showBalance onChange={(account) => set({ account })} />
          ) : (
            <div className="rounded-lg border border-dashed border-hair/[0.18] px-3 py-2.5 text-[12px] text-mute">Add accounts in Savings &amp; investments</div>
          )}
        </div>
        <div className="col-span-2 flex items-end self-start sm:col-span-1 sm:pt-[22px]">
          <button type="button" onClick={submit} disabled={!ok} className="w-full rounded-lg bg-teal px-5 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt disabled:opacity-40">
            Add
          </button>
        </div>
      </div>
    </Section>
  )
}

/* Edit everything about an income / expense: date, type, description, amount, category, account. */
function EditTransaction({ pf, t, onClose }) {
  const { state: s, actions: a } = pf
  const [v, setV] = useState({
    date: t.date || '', type: t.type, desc: t.desc || '', amount: String(t.amount ?? ''), category: t.category || 'other',
    account: t.account || '', loanId: t.loanId || '', investmentId: t.investmentId || '', note: t.note || '',
  })
  const [err, setErr] = useState('')
  const set = (p) => {
    setV((prev) => {
      const next = { ...prev, ...p }
      if ('type' in p && p.type !== prev.type) next.category = autoCategory(next.desc, next.type)
      if (!(next.type === 'expense' && next.category === 'emi')) next.loanId = ''
      else if (!next.loanId) next.loanId = matchLoan({ desc: next.desc, amount: num(next.amount) }, s.loans)
      if (!(next.type === 'expense' && next.category === 'investment')) next.investmentId = ''
      return next
    })
    setErr('')
  }
  const amountChanged = num(v.amount) !== num(t.amount)
  const hadSplit = t.loanPrincipal != null || t.loanInterest != null
  const save = () => {
    if (!v.date) { setErr('Pick a date.'); return }
    if (!v.desc.trim()) { setErr('Add a description.'); return }
    if (!(num(v.amount) > 0)) { setErr('Enter an amount above zero.'); return }
    const change = {
      date: v.date, type: v.type, desc: v.desc.trim(), amount: num(v.amount), category: v.category,
      account: v.account, loanId: v.loanId, investmentId: v.investmentId, note: v.note.trim(),
    }
    // A loan payment's principal / interest split must add up to the amount; re-enter it if the amount changed.
    if (hadSplit && (amountChanged || v.loanId !== t.loanId)) Object.assign(change, { loanPrincipal: null, loanInterest: null })
    a.patch('txns', t.id, change)
    onClose()
  }
  const isEmi = v.type === 'expense' && v.category === 'emi' && arr(s.loans).length > 0
  const isInvest = v.type === 'expense' && v.category === 'investment' && arr(s.investments).length > 0

  return (
    <Modal title="Edit transaction" onClose={onClose} width={540}>
      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label>Date</Label><input type="date" className="field" value={v.date} onChange={(e) => set({ date: e.target.value })} /></div>
          <div>
            <Label>Type</Label>
            <select className="select" value={v.type} onChange={(e) => set({ type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="sm:col-span-2"><Label>Description</Label><input className="field" value={v.desc} onChange={(e) => set({ desc: e.target.value })} /></div>
          <div><Label>Amount (₹)</Label><input className="field" type="number" min="0" step="any" value={v.amount} onChange={(e) => set({ amount: e.target.value })} /></div>
          <div>
            <Label>Category</Label>
            <select className="select" value={v.category} onChange={(e) => set({ category: e.target.value })}>
              {catsFor(v.type).map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
            </select>
          </div>
          {isEmi && <div className="sm:col-span-2"><Label>Which loan?</Label><LoanPicker loans={s.loans} value={v.loanId} className="py-2.5 text-[13.5px]" onChange={(loanId) => set({ loanId })} /></div>}
          {isInvest && (
            <div className="sm:col-span-2">
              <Label>Which investment?</Label>
              <InvestmentPicker investments={s.investments} value={v.investmentId} className="py-2.5 text-[13.5px]" onChange={(investmentId) => set({ investmentId })} />
              {v.investmentId && v.account && <div className="mt-1 text-[11.5px] text-mute">Saved as a transfer from your account into this investment.</div>}
            </div>
          )}
          <div className="sm:col-span-2">
            <Label>{v.type === 'income' ? 'Received into' : 'Paid from'}</Label>
            <AccountPicker accounts={s.savings} type={v.type} value={v.account} className="py-2.5 text-[13.5px]" showBalance onChange={(account) => set({ account })} />
          </div>
          <div className="sm:col-span-2"><Label>Note</Label><input className="field" value={v.note} onChange={(e) => set({ note: e.target.value })} /></div>
        </div>
        {hadSplit && (amountChanged || v.loanId !== t.loanId) && (
          <p className="rounded-lg bg-yellow/[0.1] px-3 py-2 text-[12.5px]">This payment's principal / interest split will need entering again on the loan page.</p>
        )}
        {err && <p className="text-[12.5px] text-pink">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-teal px-4 py-2 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">Save</button>
        </div>
      </div>
    </Modal>
  )
}
