import { cn } from '../lib/helpers'

/* Month dropdown (Sep 2026 → Mar 2027) */
export function MonthSelect({ value, onChange, className }) {
  return (
    <select className={cn('select', className)} value={value} onChange={onChange}>
      <option value="0">September 2026</option>
      <option value="1">October 2026</option>
      <option value="2">November 2026</option>
      <option value="3">December 2026</option>
      <option value="4">January 2027</option>
      <option value="5">February 2027</option>
      <option value="6">March 2027</option>
    </select>
  )
}

/* Placement dropdown (monthly milestone or a specific week) */
export function WeekSelect({ value, onChange, className }) {
  return (
    <select className={cn('select', className)} value={value} onChange={onChange}>
      <option value="ms">Monthly milestone</option>
      <option value="0">Week 1</option>
      <option value="1">Week 2</option>
      <option value="2">Week 3</option>
      <option value="3">Week 4</option>
    </select>
  )
}

/* Company / target dropdown, built from the live goal list */
export function GoalSelect({ value, onChange, options, className }) {
  return (
    <select className={cn('select', className)} value={value} onChange={onChange}>
      {options.map((g) => (
        <option key={g.k} value={g.k}>
          {g.name}
        </option>
      ))}
    </select>
  )
}

/* Checkable tick box. Colors are data-driven, so they stay inline. */
export function TickBox({ item, size = 15, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-none items-center justify-center rounded font-bold text-ink"
      style={{
        width: size,
        height: size,
        fontSize: size >= 15 ? 10 : size >= 14 ? 9 : 9,
        border: '1.5px solid ' + item.boxBorder,
        background: item.boxBg,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {item.tick}
    </div>
  )
}

/* Thin progress bar. `color` optional; width is a 0–100 percentage. */
export function Bar({ pct, color, track = 'rgba(255,255,255,.09)', height = 5, className }) {
  return (
    <div className={cn('overflow-hidden rounded', className)} style={{ height, background: track }}>
      <div
        className="h-full rounded"
        style={{ width: (pct || 0) + '%', background: color || '#4ECDC4' }}
      />
    </div>
  )
}
