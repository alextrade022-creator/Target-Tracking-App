import { useState } from 'react'
import { cn } from '../lib/helpers'
import { num } from './lib'
import { Label } from '../ws/ui'

export function Stat({ label, value, sub, tone = '' }) {
  return (
    <div className="stat px-5 py-4">
      <div className="text-[12px] font-medium text-mute">{label}</div>
      <div className={cn('mt-1 font-head text-[24px] font-bold leading-tight', tone)}>{value}</div>
      {sub && <div className="mt-1 text-[12px] text-mute2">{sub}</div>}
    </div>
  )
}

export function Bar({ pct, color = '#2563EB', height = 6 }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-hair/[0.07]" style={{ height }}>
      <div className="h-full rounded-full transition-[width]" style={{ width: Math.max(0, Math.min(100, pct || 0)) + '%', background: color }} />
    </div>
  )
}

const TONES = {
  green: 'bg-green/[0.1] text-green',
  amber: 'bg-yellow/[0.12] text-yellow',
  red: 'bg-pink/[0.1] text-pink',
  blue: 'bg-teal/[0.08] text-teal',
  slate: 'bg-hair/[0.06] text-mute',
}
export function Chip({ tone = 'slate', children }) {
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', TONES[tone])}>{children}</span>
}

/** Read-only row with value on the right and edit/delete on hover. */
export function ItemRow({ title, meta, value, sub, onEdit, onRemove, extra }) {
  return (
    <div className="group flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hair/[0.06] px-5 py-3.5 last:border-b-0">
      <div className="min-w-[180px] flex-1">
        <div className="text-[14px] font-medium">{title}</div>
        {meta && <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-mute">{meta}</div>}
      </div>
      {extra}
      <div className="min-w-[110px] text-right">
        <div className="text-[14.5px] font-semibold">{value}</div>
        {sub && <div className="mt-0.5 text-[12px]">{sub}</div>}
      </div>
      <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
        {onEdit && <button type="button" onClick={onEdit} className="rounded-md px-2 py-1 text-[12px] text-mute hover:bg-hair/[0.06] hover:text-fg">Edit</button>}
        {onRemove && <button type="button" onClick={onRemove} className="rounded-md px-2 py-1 text-[12px] text-mute hover:bg-pink/[0.08] hover:text-pink">Delete</button>}
      </div>
    </div>
  )
}

/**
 * Small config-driven form used for add and edit.
 * field: { k, label, type: 'text'|'number'|'date'|'select', options, required, placeholder, hint }
 */
export function RecordForm({ fields, initial = {}, onSave, onCancel, submitLabel = 'Save' }) {
  const [v, setV] = useState(() => Object.fromEntries(fields.map((f) => [f.k, initial[f.k] ?? f.default ?? ''])))
  const missing = fields.filter((f) => f.required && String(v[f.k] ?? '').trim() === '')
  const submit = () => {
    if (missing.length) return
    const out = {}
    fields.forEach((f) => { out[f.k] = f.type === 'number' ? num(v[f.k]) : typeof v[f.k] === 'string' ? v[f.k].trim() : v[f.k] })
    onSave(out)
  }
  return (
    <div className="border-b border-hair/[0.07] bg-hair/[0.02] px-5 py-4 last:border-b-0">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((f) => (
          <div key={f.k} className={f.wide ? 'sm:col-span-2' : ''}>
            <Label>{f.label}{f.required ? ' *' : ''}</Label>
            {f.type === 'select' ? (
              <select className="select" value={v[f.k]} onChange={(e) => setV({ ...v, [f.k]: e.target.value })}>
                {f.options.map((o) => {
                  const opt = typeof o === 'string' ? { value: o, label: o } : o
                  return <option key={opt.value} value={opt.value}>{opt.label}</option>
                })}
              </select>
            ) : (
              <input
                className="field"
                type={f.type === 'number' ? 'number' : f.type || 'text'}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                min={f.type === 'number' ? 0 : undefined}
                step={f.type === 'number' ? 'any' : undefined}
                placeholder={f.placeholder}
                value={v[f.k]}
                onChange={(e) => setV({ ...v, [f.k]: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              />
            )}
            {f.hint && <div className="mt-1 text-[11px] text-mute2">{f.hint}</div>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-[13px] font-medium text-mute hover:text-fg">Cancel</button>}
        <button
          type="button"
          onClick={submit}
          disabled={missing.length > 0}
          className="rounded-lg bg-teal px-4 py-2 text-[13px] font-semibold text-onaccent hover:bg-teal-lt disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

export function AddLink({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="text-[12.5px] font-medium text-teal hover:text-teal-lt">
      {children}
    </button>
  )
}
