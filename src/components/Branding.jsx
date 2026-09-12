import { cn } from '../lib/helpers'

export default function Branding({ vals, actions }) {
  const { bdraft, brandingStats: st, branding } = vals

  return (
    <div className="mt-7">
      {/* Counters */}
      <div className="flex flex-wrap gap-3 sm:gap-3.5">
        <Stat label="TOTAL CONTENT" value={st.total} />
        <Stat label="SHOOT DONE" value={st.shoot} valueClass="text-orange" />
        <Stat label="EDIT DONE" value={st.edit} valueClass="text-yellow" />
        <Stat label="POST DONE" value={st.post} valueClass="text-green" />
        <Stat label="COMPLETED" value={st.complete} valueClass="text-teal" />
      </div>

      {/* Content writer */}
      <div className="panel mt-[22px]">
        <div className="border-b border-hair/[0.08] px-[22px] py-[18px]">
          <div className="text-[19px] font-semibold tracking-[-0.01em]">Write new content</div>
          <div className="mt-1 text-[13px] text-mute">
            Draft the three parts of your post. Adding it drops a new content card below and bumps your total.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3.5 px-[22px] py-5 md:grid-cols-3">
          <WriteBox label="HOOK" placeholder="The scroll-stopping opener…" value={bdraft.hook} onChange={(e) => actions.setB({ hook: e.target.value })} />
          <WriteBox label="BODY" placeholder="The main value / story…" value={bdraft.body} onChange={(e) => actions.setB({ body: e.target.value })} />
          <WriteBox label="CTA" placeholder="The call to action…" value={bdraft.cta} onChange={(e) => actions.setB({ cta: e.target.value })} />
        </div>
        <div className="px-[22px] pb-5">
          <button type="button" onClick={actions.addBranding} className="rounded-lg bg-teal px-[26px] py-3 text-[14px] font-bold text-onaccent">
            + Add content
          </button>
        </div>
      </div>

      {/* Content list */}
      <div className="mt-[22px] flex flex-col gap-4">
        {(branding ?? []).map((c) => (
          <ContentCard key={c.id} c={c} />
        ))}
        {(!branding || branding.length === 0) && (
          <div className="panel px-[22px] py-8 text-center text-[13px] text-mute2">
            No content yet — write your first hook, body and CTA above.
          </div>
        )}
      </div>
    </div>
  )
}

function ContentCard({ c }) {
  const statusColor = c.complete ? '#7BC96F' : c.stageDone > 0 ? '#F4D35E' : 'var(--mute)'
  return (
    <div className={cn('panel px-[22px] py-5', c.complete && 'border-green/40')}>
      {/* Status + remove */}
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <span
          className="mono rounded-md px-2.5 py-1 text-[10.5px] tracking-[0.12em]"
          style={{ color: statusColor, background: c.complete ? 'rgba(123,201,111,.14)' : 'rgb(var(--hair-rgb) / .06)' }}
        >
          {c.statusLabel}
        </span>
        <button type="button" onClick={c.remove} className="px-1 text-[16px] leading-none text-mute2 hover:text-fg" aria-label="Remove content">
          ×
        </button>
      </div>

      {/* Hook / Body / CTA */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <Part label="HOOK" text={c.hook} />
        <Part label="BODY" text={c.body} />
        <Part label="CTA" text={c.cta} />
      </div>

      {/* Production checklist */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mono mr-1 text-[10.5px] tracking-[0.14em] text-mute2">CHECKLIST</span>
        {c.stages.map((s) => (
          <Toggle key={s.k} on={s.on} color={s.color} onClick={s.toggle} label={s.label} />
        ))}
      </div>

      {/* Platforms + posted date */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mono mr-1 text-[10.5px] tracking-[0.14em] text-mute2">POSTED ON</span>
        {c.platformChips.map((p) => (
          <Toggle key={p.k} on={p.on} color={p.color} onClick={p.toggle} label={p.label} />
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="mono text-[10.5px] tracking-[0.14em] text-mute2">DATE</span>
          <input
            type="date"
            className="field w-auto px-2.5 py-2 text-[13px] text-soft"
            value={c.postedDate}
            onChange={c.setDate}
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, valueClass }) {
  return (
    <div className="stat min-w-[104px] flex-1 px-[22px] py-4 sm:flex-none">
      <div className="mono text-[11px] tracking-[0.16em] text-mute2">{label}</div>
      <div className={cn('mono text-[34px] font-semibold leading-[1.2]', valueClass)}>{value}</div>
    </div>
  )
}

function WriteBox({ label, placeholder, value, onChange }) {
  return (
    <div>
      <div className="mono mb-[7px] text-[11px] tracking-[0.16em] text-mute2">{label}</div>
      <textarea className="field min-h-[96px] resize-y leading-[1.5]" placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  )
}

function Part({ label, text }) {
  return (
    <div className="rounded-xl border border-hair/[0.07] bg-hair/[0.03] px-3.5 py-3">
      <div className="mono mb-1.5 text-[10px] tracking-[0.16em] text-mute2">{label}</div>
      <div className="text-[13px] leading-[1.5] text-soft" style={{ textWrap: 'pretty' }}>{text}</div>
    </div>
  )
}

function Toggle({ on, color, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
        !on && 'border-hair/[0.14] bg-transparent text-mute hover:text-fg',
      )}
      style={on ? { color, background: color + '22', borderColor: color } : undefined}
    >
      {on ? '✓ ' : ''}{label}
    </button>
  )
}
