import { pretty } from '../lib/helpers'
import { Section, Empty } from '../ws/ui'
import { Stat, Bar, Chip } from './ui'
import {
  inr, sumBy, monthKey, addMonths, monthLabel, monthTotals, categoryTotals, cashflow,
  emergencyStatus, goalProgress, nextDue, arr, loanBalance, loanStatus, loanPaidMonths,
} from './lib'

export default function Overview({ pf }) {
  const { state: s, actions: a } = pf
  const ym = monthKey()
  const cur = monthTotals(s.txns, ym)
  const prev = monthTotals(s.txns, addMonths(ym, -1))
  const savingsTotal = sumBy(s.savings, 'balance')
  const invCurrent = sumBy(s.investments, 'current')
  const debt = arr(s.loans).reduce((t, l) => t + loanBalance(l, s.txns).balance, 0)
  const netWorth = savingsTotal + invCurrent - debt
  const commitments = sumBy(s.loans, 'emi') + sumBy(s.investments, 'monthlySip')
  const ef = emergencyStatus(s)
  const cats = categoryTotals(s.txns, ym).slice(0, 6)
  const flow = cashflow(s.txns, 6)
  const maxFlow = Math.max(1, ...flow.map((f) => Math.max(f.income, f.spend)))
  const isEmpty = [s.txns, s.savings, s.investments, s.loans, s.goals].every((x) => arr(x).length === 0)

  if (isEmpty) {
    return (
      <section className="panel p-6">
        <h2 className="font-head text-[17px] font-semibold">Set up your finances</h2>
        <p className="mt-1 text-[13.5px] text-mute">Four quick steps. Everything here is private to you.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Step n="1" title="Import a bank statement" text="CSV or Excel export from your bank or credit card." onClick={() => a.setTab('expenses')} />
          <Step n="2" title="Add savings & investments" text="Bank balances, mutual funds, stocks, FDs, PPF…" onClick={() => a.setTab('assets')} />
          <Step n="3" title="Add loans & EMIs" text="Home, car, personal loans and credit cards." onClick={() => a.setTab('loans')} />
          <Step n="4" title="Set goals & emergency fund" text="Target amounts with dates, plus a safety cushion." onClick={() => a.setTab('goals')} />
        </div>
      </section>
    )
  }

  const spendDelta = prev.spend > 0 ? ((cur.spend - prev.spend) / prev.spend) * 100 : null
  const goals = arr(s.goals).map((g) => ({ g, p: goalProgress(g, s.savings, s.investments) }))
  const efTone = ef.status === 'healthy' ? 'text-green' : ef.status === 'low' ? 'text-pink' : ''

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Net worth" value={inr(netWorth)} sub={`${inr(savingsTotal + invCurrent)} assets − ${inr(debt)} loans`} />
        <Stat
          label={`Spent so far · ${monthLabel(ym)}`}
          value={inr(cur.spend)}
          sub={spendDelta === null ? `Income ${inr(cur.income)}` : `${spendDelta >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(spendDelta))}% vs last month`}
        />
        <Stat label="Monthly commitments" value={inr(commitments)} sub="EMIs + SIPs" />
        <Stat
          label="Emergency fund"
          value={ef.coverage === null ? '—' : `${ef.coverage.toFixed(1)} mo`}
          tone={efTone}
          sub={ef.monthly ? `Target ${ef.months} months · ${inr(ef.total)} set aside` : 'Add expenses to calculate'}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Section title="Cash flow · last 6 months">
            <div className="flex h-[170px] items-end gap-3 px-5 pt-5">
              {flow.map((f) => (
                <div key={f.ym} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-[124px] w-full items-end justify-center gap-1">
                    <div className="w-1/3 max-w-[16px] rounded-t bg-green" style={{ height: (f.income / maxFlow) * 100 + '%' }} title={'Income ' + inr(f.income)} />
                    <div className="w-1/3 max-w-[16px] rounded-t bg-orange" style={{ height: (f.spend / maxFlow) * 100 + '%' }} title={'Spent ' + inr(f.spend)} />
                  </div>
                  <div className="text-[11px] text-mute2">{monthLabel(f.ym, true)}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 px-5 pb-4 pt-2 text-[12px] text-mute">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green" />Income</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange" />Spent</span>
            </div>
          </Section>
        </div>

        <div className="xl:col-span-2">
          <Section title={`Top spending · ${monthLabel(ym)}`}>
            {cats.length === 0 && <Empty>No expenses recorded this month.</Empty>}
            <div className="flex flex-col gap-3 px-5 py-4">
              {cats.map((c) => (
                <div key={c.k}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span>{c.label}</span>
                    <span className="font-medium">{inr(c.total)}</span>
                  </div>
                  <Bar pct={(c.total / (cats[0]?.total || 1)) * 100} color={c.color} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Goals">
          {goals.length === 0 && <Empty>No goals yet.</Empty>}
          {goals.map(({ g, p }) => (
            <div key={g.id} className="border-b border-hair/[0.06] px-5 py-3.5 last:border-b-0">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-[14px] font-medium">{g.name || 'N/A'}</span>
                <span className="text-[12.5px] text-mute">{inr(p.current)} / {inr(p.target)}</span>
              </div>
              <Bar pct={p.progress} color={p.status === 'done' ? '#16A34A' : '#2563EB'} />
            </div>
          ))}
        </Section>

        <Section title="EMIs this month">
          {arr(s.loans).length === 0 && <Empty>No loans added.</Empty>}
          {arr(s.loans).map((l) => {
            const st = loanStatus(l, s.txns, ym)
            const paid = st.status === 'paid'
            return (
              <div key={l.id} className="flex items-center justify-between gap-3 border-b border-hair/[0.06] px-5 py-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium">{l.name || 'N/A'}</div>
                  <div className="mt-0.5 text-[12px] text-mute">
                    {paid ? 'Paid' : st.status === 'part' ? `Part paid ${inr(st.paid)}` : 'Due ' + pretty(nextDue(l, new Date(), loanPaidMonths(l, s.txns)))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold">{inr(l.emi)}</span>
                  <Chip tone={paid ? 'green' : 'amber'}>{paid ? 'Paid' : st.status === 'part' ? 'Part paid' : 'Pending'}</Chip>
                </div>
              </div>
            )
          })}
        </Section>
      </div>
    </div>
  )
}

function Step({ n, title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-start gap-3 rounded-xl border border-hair/[0.08] p-4 text-left transition-colors hover:border-teal/40 hover:bg-teal/[0.03]">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-teal/[0.1] text-[13px] font-semibold text-teal">{n}</span>
      <span>
        <span className="block text-[14px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[12.5px] text-mute">{text}</span>
      </span>
    </button>
  )
}
