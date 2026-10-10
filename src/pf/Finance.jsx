import { PageHeader, Seg } from '../ws/ui'
import Overview from './Overview'
import Expenses from './Expenses'
import Assets from './Assets'
import Goals from './Goals'
import Loans from './Loans'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'assets', label: 'Savings & investments' },
  { value: 'goals', label: 'Goals & emergency fund' },
  { value: 'loans', label: 'Loans & EMIs' },
]

export default function Finance({ pf }) {
  const { state: s, actions: a } = pf
  return (
    <div>
      <PageHeader title="Personal finance" subtitle="Your own money, kept separate from your businesses." />
      <div className="mb-6">
        <Seg value={s.tab} onChange={a.setTab} options={TABS} />
      </div>
      {s.tab === 'overview' && <Overview pf={pf} />}
      {s.tab === 'expenses' && <Expenses pf={pf} />}
      {s.tab === 'assets' && <Assets pf={pf} />}
      {s.tab === 'goals' && <Goals pf={pf} />}
      {s.tab === 'loans' && <Loans pf={pf} />}
    </div>
  )
}
