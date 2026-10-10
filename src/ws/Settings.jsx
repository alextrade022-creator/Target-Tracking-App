import { useState } from 'react'
import { cn } from '../lib/helpers'
import { BIZ_COLORS } from './lib'
import { PageHeader, Label } from './ui'

export default function Settings({ ws }) {
  const { sel, actions: a } = ws
  const [name, setName] = useState('')
  const add = () => { a.addBusiness(name); setName('') }

  return (
    <div>
      <PageHeader
        title="Businesses & departments"
        subtitle="Mark the departments you run yourself. Departments you don't run count as 'waiting on the team' when you assign them work."
      />

      <div className="flex flex-col gap-5">
        {sel.businesses.map((b) => <BusinessCard key={b.id} b={b} a={a} />)}

        <section className="panel flex flex-wrap items-center gap-3 px-5 py-4">
          <input
            className="field min-w-[220px] flex-1"
            placeholder="New business name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          />
          <button type="button" onClick={add} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">
            + Add business
          </button>
        </section>
      </div>
    </div>
  )
}

function BusinessCard({ b, a }) {
  const [dept, setDept] = useState('')
  const [mine, setMine] = useState(true)
  const addDept = () => { a.addDept(b.id, dept, mine); setDept('') }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-3 w-3 flex-none rounded-full" style={{ background: b.color }} />
        <input
          className="min-w-[180px] flex-1 bg-transparent font-head text-[17px] font-semibold outline-none"
          value={b.name || ''}
          onChange={(e) => a.patchBusiness(b.id, { name: e.target.value })}
        />
        <div className="flex items-center gap-1.5">
          {BIZ_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => a.patchBusiness(b.id, { color: c })}
              aria-label={'Colour ' + c}
              className="h-[18px] w-[18px] rounded-full"
              style={{ background: c, border: b.color === c ? '2px solid var(--ring)' : '1px solid rgb(var(--hair-rgb) / .2)' }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => { if (window.confirm(`Delete ${b.name}? Its tasks and meetings are deleted too.`)) a.removeBusiness(b.id) }}
          className="text-[12.5px] font-medium text-mute hover:text-pink"
        >
          Delete
        </button>
      </div>

      <div className="mt-4">
        <Label>Departments</Label>
        <div className="flex flex-col gap-2">
          {(b.departments || []).map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-hair/[0.07] px-3 py-2">
              <input
                className="min-w-[140px] flex-1 bg-transparent text-[13.5px] outline-none"
                value={d.name || ''}
                onChange={(e) => a.patchDept(b.id, d.id, { name: e.target.value })}
              />
              <button
                type="button"
                onClick={() => a.patchDept(b.id, d.id, { mine: !d.mine })}
                className={cn(
                  'rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors',
                  d.mine ? 'bg-teal/[0.12] text-teal' : 'bg-hair/[0.07] text-mute',
                )}
              >
                {d.mine ? 'I run this' : 'I watch this'}
              </button>
              <button type="button" onClick={() => a.removeDept(b.id, d.id)} aria-label="Remove department" className="px-1 text-[16px] leading-none text-mute2 hover:text-fg">×</button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className="field w-auto min-w-[180px] flex-1"
            placeholder="Add department…"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addDept() }}
          />
          <select className="select w-auto" value={mine ? 'mine' : 'watch'} onChange={(e) => setMine(e.target.value === 'mine')}>
            <option value="mine">I run this</option>
            <option value="watch">I watch this</option>
          </select>
          <button type="button" onClick={addDept} className="rounded-lg border border-hair/[0.14] px-4 py-2.5 text-[13px] font-medium text-soft hover:text-fg">Add</button>
        </div>
      </div>
    </section>
  )
}
