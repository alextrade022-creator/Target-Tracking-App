import { cn } from '../lib/helpers'
import { PLATFORMS, PALETTE } from '../lib/constants'

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : [])
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const shortDate = (k) => { if (!k) return ''; const [, m, d] = k.split('-').map(Number); return `${d} ${MON[m - 1]}` }

const countWords = (t) => (String(t || '').trim().match(/\S+/g) || []).length
/** Rough spoken length of the script, at about 150 words a minute. */
export const spokenSeconds = (b) => Math.round((countWords(b?.hook) + countWords(b?.body) + countWords(b?.cta)) / 2.5)

/** Whole days a post has sat in its current step. */
export function waitingDays(b) {
  const t = b?.stageAt || b?.createdAt
  return t ? Math.max(0, Math.floor((Date.now() - t) / 864e5)) : 0
}

export function FormatChip({ format }) {
  return format === 'long'
    ? <span className="rounded-full bg-teal/[0.09] px-2 py-0.5 text-[11px] font-semibold text-teal">Long video</span>
    : <span className="rounded-full bg-purple/[0.1] px-2 py-0.5 text-[11px] font-semibold text-purple">Short form</span>
}

export function PlatformDots({ list }) {
  const on = PLATFORMS.filter((p) => arr(list).includes(p.k))
  if (!on.length) return null
  return (
    <span className="inline-flex gap-1">
      {on.map((p) => (
        <span key={p.k} title={p.label} className="grid h-[18px] w-[18px] place-items-center rounded-[5px] text-[9px] font-bold text-white" style={{ background: p.color }}>
          {{ instagram: 'IG', youtube: 'YT', facebook: 'FB' }[p.k]}
        </span>
      ))}
    </span>
  )
}

export function TagChip({ tag }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: tag.color, background: tag.color + '1f' }}>{tag.name}</span>
  )
}

export function Swatches({ value, onPick }) {
  return (
    <span className="flex gap-1">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          aria-label={`Colour ${c}`}
          aria-pressed={value === c}
          className={cn('h-5 w-5 rounded-full border-2', value === c ? 'border-fg' : 'border-transparent')}
          style={{ background: c }}
        />
      ))}
    </span>
  )
}
