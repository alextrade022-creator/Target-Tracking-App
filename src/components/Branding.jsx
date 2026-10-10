import { useState } from 'react'
import { cn } from '../lib/helpers'
import { PALETTE } from '../lib/constants'

export default function Branding({ vals, actions }) {
  const { bdraft, brandingStats: st, branding, brandTags, tagDraft, brandFilter, brandFormats, brandCounts } = vals

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
          <div className="text-[19px] font-head font-semibold tracking-[-0.01em]">Write new content</div>
          <div className="mt-1 text-[13px] text-mute">
            Draft the three parts of your post and pick the format. It appears as a card in the gallery below.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3.5 px-[22px] py-5 md:grid-cols-3">
          <WriteBox label="HOOK" placeholder="The scroll-stopping opener…" value={bdraft.hook} onChange={(e) => actions.setB({ hook: e.target.value })} />
          <WriteBox label="BODY" placeholder="The main value / story…" value={bdraft.body} onChange={(e) => actions.setB({ body: e.target.value })} />
          <WriteBox label="CTA" placeholder="The call to action…" value={bdraft.cta} onChange={(e) => actions.setB({ cta: e.target.value })} />
        </div>
        <div className="flex flex-wrap items-end gap-4 px-[22px] pb-5">
          <div>
            <div className="mono mb-[7px] text-[11px] tracking-[0.16em] text-mute2">FORMAT</div>
            <select className="select w-auto min-w-[170px]" value={bdraft.format} onChange={(e) => actions.setB({ format: e.target.value })}>
              {brandFormats.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
            </select>
          </div>
          <button type="button" onClick={actions.addBranding} className="rounded-lg bg-teal px-[26px] py-3 text-[14px] font-bold text-onaccent">
            + Add content
          </button>
        </div>
      </div>

      {/* Format filter */}
      <div className="mt-[22px] flex flex-wrap items-center gap-2">
        <span className="mono mr-1 text-[11px] tracking-[0.14em] text-mute2">SHOW</span>
        <FilterPill on={brandFilter === 'all'} onClick={() => actions.setBrandFilter('all')} label={`All (${brandCounts.all})`} />
        {brandFormats.map((f) => (
          <FilterPill key={f.k} on={brandFilter === f.k} onClick={() => actions.setBrandFilter(f.k)} label={`${f.label} (${brandCounts[f.k]})`} />
        ))}
      </div>

      {/* Content gallery — 1 / 2 / 3 columns by width */}
      <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(branding ?? []).map((c) => (
          <ContentCard key={c.id} c={c} formats={brandFormats} />
        ))}
        {(!branding || branding.length === 0) && (
          <div className="panel col-span-full px-[22px] py-8 text-center text-[13px] text-mute2">
            {brandCounts.all === 0 ? 'No content yet — write your first hook, body and CTA above.' : 'No content in this format.'}
          </div>
        )}
      </div>

      {/* Tag manager — compact; add/manage revealed on demand */}
      <TagManager brandTags={brandTags} tagDraft={tagDraft} actions={actions} />
    </div>
  )
}

function FilterPill({ on, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
        on ? 'border-teal bg-teal text-onaccent' : 'border-hair/[0.14] text-mute hover:text-fg',
      )}
    >
      {label}
    </button>
  )
}

function TagManager({ brandTags, tagDraft, actions }) {
  const [showForm, setShowForm] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const tags = brandTags ?? []
  const add = () => {
    if (!tagDraft.name.trim()) return
    actions.addBrandTag()
  }
  return (
    <div className="panel mt-[22px]">
      <div className="flex flex-wrap items-center gap-3 px-[22px] py-4">
        <div className="font-head text-[15px] font-semibold">Content tags</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t.id} className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color: t.color, background: t.color + '22', border: '1px solid ' + t.color }}>
              {t.name || 'Tag'}
            </span>
          ))}
          {tags.length === 0 && <span className="text-[12px] text-mute2">No tags yet — add one to label your content.</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {tags.length > 0 && (
            <button type="button" onClick={() => setShowManage((v) => !v)} className="mono rounded-lg border border-hair/[0.14] px-3 py-1.5 text-[11px] tracking-[0.1em] text-mute hover:text-fg">
              {showManage ? 'DONE' : 'MANAGE'}
            </button>
          )}
          <button type="button" onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-teal px-3.5 py-1.5 text-[12.5px] font-bold text-onaccent">
            {showForm ? 'Close' : '+ New tag'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="border-t border-hair/[0.08] px-[22px] py-4">
          <div className="mono mb-2 text-[11px] tracking-[0.16em] text-mute2">NEW TAG</div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="field w-auto min-w-[180px] flex-1 px-3 py-2.5 text-[13.5px]"
              placeholder="Tag name — e.g. Finance, Personal story…"
              value={tagDraft.name}
              onChange={(e) => actions.setTagDraft({ name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') add() }}
            />
            <Swatches value={tagDraft.color} onPick={(c) => actions.setTagDraft({ color: c })} />
            <button type="button" onClick={add} className="whitespace-nowrap rounded-lg bg-teal px-5 py-2.5 text-[13.5px] font-bold text-onaccent">
              + Add tag
            </button>
          </div>
        </div>
      )}

      {showManage && tags.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-hair/[0.08] px-[22px] py-4">
          {tags.map((t) => <TagRow key={t.id} t={t} />)}
        </div>
      )}
    </div>
  )
}

function ContentCard({ c, formats }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const statusColor = c.complete ? '#16A34A' : c.stageDone > 0 ? '#C6871B' : 'var(--mute)'
  return (
    <div className={cn('panel flex flex-col p-4', c.complete && 'border-green/40')}>
      {/* Format + status + remove */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md px-2 py-0.5 text-[10.5px] font-semibold" style={{ color: c.formatColor, background: c.formatColor + '22', border: '1px solid ' + c.formatColor }}>
            {c.formatLabel}
          </span>
          <span
            className="mono rounded-md px-2 py-0.5 text-[10px] tracking-[0.1em]"
            style={{ color: statusColor, background: c.complete ? 'rgba(22,163,74,.14)' : 'rgb(var(--hair-rgb) / .06)' }}
          >
            {c.statusLabel}
          </span>
        </div>
        <button type="button" onClick={c.remove} className="px-0.5 text-[16px] leading-none text-mute2 hover:text-fg" aria-label="Remove content">×</button>
      </div>

      {/* HOOK — the identifier: what the video is about */}
      <div className="mt-3 font-head text-[15px] font-semibold leading-[1.35]" style={{ textWrap: 'pretty' }}>
        {c.hasHook ? c.hook : <span className="font-sans text-[13px] font-normal text-mute2">No hook written</span>}
      </div>

      {/* Assigned tags */}
      {c.assignedTags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {c.assignedTags.map((t) => (
            <span key={t.id} className="rounded px-2 py-0.5 text-[10.5px] font-semibold" style={{ color: t.color, background: t.color + '22', border: '1px solid ' + t.color }}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      {/* Shoot / Edit / Post — quick status, at a glance */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {c.stages.map((s) => <StagePill key={s.k} on={s.on} color={s.color} onClick={s.toggle} label={s.label} />)}
      </div>

      {/* View details toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mono mt-3 self-start text-[11px] tracking-[0.1em] text-teal hover:text-teal-lt"
      >
        {open ? 'HIDE DETAILS ▴' : 'VIEW DETAILS ▾'}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t border-hair/[0.08] pt-3">
          {/* Body + CTA (read-only or editable) */}
          <div className="flex items-center justify-between">
            <span className="mono text-[10.5px] tracking-[0.14em] text-mute2">CONTENT</span>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={cn('mono rounded-md border px-2 py-1 text-[10px] tracking-[0.12em] transition-colors', editing ? 'border-teal bg-teal text-onaccent' : 'border-hair/[0.14] text-mute hover:text-fg')}
            >
              {editing ? 'DONE' : 'EDIT'}
            </button>
          </div>
          {editing ? (
            <div className="flex flex-col gap-2.5">
              <EditBox label="HOOK" value={c.hookRaw} onChange={(e) => c.patch({ hook: e.target.value })} />
              <EditBox label="BODY" value={c.bodyRaw} onChange={(e) => c.patch({ body: e.target.value })} />
              <EditBox label="CTA" value={c.ctaRaw} onChange={(e) => c.patch({ cta: e.target.value })} />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <Part label="BODY" text={c.body} />
              <Part label="CTA" text={c.cta} />
            </div>
          )}

          {/* Format */}
          <div>
            <div className="mono mb-1.5 text-[10px] tracking-[0.14em] text-mute2">FORMAT</div>
            <select className="select w-auto min-w-[160px] py-2 text-[13px]" value={c.format} onChange={(e) => c.patch({ format: e.target.value })}>
              {(formats ?? []).map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
            </select>
          </div>

          {/* Platforms */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mono mr-1 text-[10px] tracking-[0.14em] text-mute2">POSTED ON</span>
            {c.platformChips.map((p) => <StagePill key={p.k} on={p.on} color={p.color} onClick={p.toggle} label={p.label} />)}
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] tracking-[0.14em] text-mute2">DATE</span>
            <input type="date" className="field w-auto px-2.5 py-1.5 text-[13px] text-soft" value={c.postedDate} onChange={c.setDate} />
          </div>

          {/* Tags assignment */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mono mr-1 text-[10px] tracking-[0.14em] text-mute2">TAGS</span>
            {c.tagChips.length === 0 ? (
              <span className="text-[12px] text-mute2">Add tags in the “Content tags” panel below.</span>
            ) : (
              c.tagChips.map((t) => <StagePill key={t.id} on={t.on} color={t.color} onClick={t.toggle} label={t.name} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StagePill({ on, color, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors',
        !on && 'border-hair/[0.14] bg-transparent text-mute hover:text-fg',
      )}
      style={on ? { color, background: color + '22', borderColor: color } : undefined}
    >
      {on ? '✓ ' : ''}{label}
    </button>
  )
}

function TagRow({ t }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-hair/[0.07] bg-hair/[0.035] px-3.5 py-2.5">
      <span
        className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
        style={{ color: t.color, background: t.color + '22', border: '1px solid ' + t.color }}
      >
        {t.name || 'Tag'}
      </span>
      <input
        className="field w-auto min-w-[140px] flex-1 px-2.5 py-2 text-[13px]"
        value={t.name}
        placeholder="Tag name"
        onChange={(e) => t.edit({ name: e.target.value })}
      />
      <Swatches value={t.color} onPick={(c) => t.edit({ color: c })} />
      <button type="button" onClick={t.remove} className="px-1 text-[16px] leading-none text-mute2 hover:text-fg" aria-label="Remove tag">
        ×
      </button>
    </div>
  )
}

function Swatches({ value, onPick }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          aria-label={'Colour ' + c}
          className="h-[20px] w-[20px] cursor-pointer rounded-full"
          style={{ background: c, border: value === c ? '2px solid var(--ring)' : '1px solid rgb(var(--hair-rgb) / .25)' }}
        />
      ))}
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

function EditBox({ label, value, onChange }) {
  return (
    <div>
      <div className="mono mb-1.5 text-[10px] tracking-[0.16em] text-mute2">{label}</div>
      <textarea className="field min-h-[88px] resize-y leading-[1.5]" value={value} onChange={onChange} />
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

