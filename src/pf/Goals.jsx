import { useState } from 'react'
import { pretty } from '../lib/helpers'
import { Section, Empty, Label } from '../ws/ui'
import { Bar, Chip, RecordForm, AddLink } from './ui'
import { inr, num, arr, emergencyStatus, goalProgress } from './lib'

const STATUS = {
  done: { tone: 'green', label: 'Achieved' },
  'on-track': { tone: 'green', label: 'On track' },
  behind: { tone: 'amber', label: 'Needs more' },
  overdue: { tone: 'red', label: 'Past target date' },
}
const EF_STATUS = {
  healthy: { tone: 'green', label: 'Healthy' },
  building: { tone: 'amber', label: 'Building' },
  low: { tone: 'red', label: 'Low' },
  unknown: { tone: 'slate', label: 'Not set up' },
}

export default function Goals({ pf }) {
  const { state: s, actions: a } = pf
  const [edit, setEdit] = useState('')
  const ef = emergencyStatus(s)
  const efs = EF_STATUS[ef.status]

  const goalFields = [
    { k: 'name', label: 'Goal', required: true, placeholder: 'e.g. Child education, New car, Home down payment', wide: true },
    { k: 'target', label: 'Target amount (₹)', type: 'number', required: true },
    { k: 'targetDate', label: 'Target date', type: 'date' },
    { k: 'extraSaved', label: 'Saved elsewhere (₹)', type: 'number', hint: 'Money not tracked in your accounts here' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Emergency fund */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-head text-[17px] font-semibold">Emergency fund</h2>
            <Chip tone={efs.tone}>{efs.label}</Chip>
          </div>
          <div className="text-[13px] text-mute">
            <span className="font-head text-[20px] font-bold text-fg">{inr(ef.total)}</span>
            {ef.target > 0 && <> of {inr(ef.target)}</>}
          </div>
        </div>
        <div className="mt-3"><Bar pct={ef.progress} color={ef.status === 'healthy' ? '#16A34A' : ef.status === 'low' ? '#DC4A63' : '#C6871B'} height={8} /></div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Fact label="Covers" value={ef.coverage === null ? '—' : `${ef.coverage.toFixed(1)} months`} sub={`of expenses (target ${ef.months})`} />
          <Fact label="Monthly expenses" value={ef.monthly ? inr(ef.monthly) : '—'} sub={ef.manual ? 'Entered manually' : ef.auto ? 'Average of the last 3 months' : 'No expense history yet'} />
          <Fact label="Still to build" value={inr(ef.gap)} sub={ef.sources ? `${ef.sources} account(s) set aside` : 'Nothing set aside yet'} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-hair/[0.07] pt-4 sm:grid-cols-3">
          <div>
            <Label>Target (months of expenses)</Label>
            <select className="select" value={ef.months} onChange={(e) => a.setSettings({ emergencyMonths: Number(e.target.value) })}>
              {[3, 6, 9, 12].map((m) => <option key={m} value={m}>{m} months</option>)}
            </select>
          </div>
          <div>
            <Label>Monthly expenses (optional)</Label>
            <input
              className="field" type="number" min="0" step="any" inputMode="decimal"
              placeholder={ef.auto ? `Auto: ${inr(ef.auto)}` : 'e.g. 60000'}
              value={num(s.settings?.expenseOverride) || ''}
              onChange={(e) => a.setSettings({ expenseOverride: num(e.target.value) })}
            />
          </div>
          <div className="flex items-end text-[12.5px] text-mute">
            <span>
              Mark savings accounts or liquid funds as <b className="font-medium text-soft">Emergency fund</b> in{' '}
              <button type="button" className="font-medium text-teal hover:text-teal-lt" onClick={() => a.setTab('assets')}>Savings & investments</button>.
            </span>
          </div>
        </div>
      </section>

      {/* Goals */}
      <Section title="Goal-based savings" right={edit !== 'new' && <AddLink onClick={() => setEdit('new')}>+ Add goal</AddLink>}>
        {edit === 'new' && (
          <RecordForm fields={goalFields} submitLabel="Add goal"
            onSave={(v) => { a.add('goals', v); setEdit('') }} onCancel={() => setEdit('')} />
        )}
        {arr(s.goals).length === 0 && edit !== 'new' && <Empty>No goals yet. Add one, then set accounts or investments aside for it.</Empty>}
        {arr(s.goals).map((g) => {
          if (edit === g.id) {
            return <RecordForm key={g.id} fields={goalFields} initial={g}
              onSave={(v) => { a.patch('goals', g.id, v); setEdit('') }} onCancel={() => setEdit('')} />
          }
          const p = goalProgress(g, s.savings, s.investments)
          const st = STATUS[p.status]
          return (
            <div key={g.id} className="group border-b border-hair/[0.06] px-5 py-4 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">{g.name || 'N/A'}</span>
                    <Chip tone={st.tone}>{st.label}</Chip>
                  </div>
                  <div className="mt-1 text-[12.5px] text-mute">
                    {g.targetDate ? `By ${pretty(g.targetDate)}${p.left !== null && p.left > 0 ? ` · ${p.left} months left` : ''}` : 'No target date'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-semibold">{inr(p.current)} <span className="text-[12.5px] font-normal text-mute">/ {inr(p.target)}</span></div>
                  <div className="mt-0.5 text-[12px] text-mute">{Math.round(p.progress)}%</div>
                </div>
              </div>
              <div className="mt-3"><Bar pct={p.progress} color={p.status === 'done' ? '#16A34A' : '#2563EB'} /></div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-mute">
                <span>
                  {p.need > 0
                    ? <>Needs <b className="font-medium text-soft">{inr(p.perMonth)}/month</b>{p.sip > 0 && <> · linked SIPs {inr(p.sip)}/month</>}</>
                    : 'Fully funded'}
                  {p.sources > 0 && <> · {p.sources} account(s) linked</>}
                </span>
                <span className="flex gap-1 opacity-60 group-hover:opacity-100">
                  <button type="button" onClick={() => setEdit(g.id)} className="rounded-md px-2 py-1 hover:bg-hair/[0.06] hover:text-fg">Edit</button>
                  <button type="button" onClick={() => { if (window.confirm(`Delete goal "${g.name}"?`)) a.remove('goals', g.id) }} className="rounded-md px-2 py-1 hover:bg-pink/[0.08] hover:text-pink">Delete</button>
                </span>
              </div>
            </div>
          )
        })}
      </Section>
    </div>
  )
}

function Fact({ label, value, sub }) {
  return (
    <div>
      <div className="text-[12px] font-medium text-mute">{label}</div>
      <div className="mt-0.5 font-head text-[18px] font-bold">{value}</div>
      <div className="text-[12px] text-mute2">{sub}</div>
    </div>
  )
}
