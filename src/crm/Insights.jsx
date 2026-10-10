import { OPEN, SOURCES, SERVICES, LOST_REASONS, stageLabel, shortInr } from './lib'

export default function Insights({ leads, sum }) {
  const total = leads.length || 1
  const pct = (n) => Math.round((n / total) * 100)
  const funnel = OPEN.map((k, i) => {
    const n = leads.filter((l) => (l.reached || 0) >= i).length
    return { label: stageLabel(k), n, text: `${n} · ${pct(n)}%` }
  }).concat([{ label: 'Won', n: sum.won.length, w: sum.won.length, text: `${sum.won.length} · ${pct(sum.won.length)}%` }])

  const group = (list, key) => list
    .map((x) => {
      const all = leads.filter((l) => l[key] === x)
      const w = all.filter((l) => l.stage === 'won').length
      return { label: x, n: all.length, w, text: all.length + (w ? ` · ${w} won` : '') }
    })
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n)

  const reasons = LOST_REASONS
    .map((r) => ({ label: r, n: sum.lost.filter((l) => l.lostReason === r).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Win rate" value={sum.rate === null ? '—' : sum.rate + '%'} sub={`${sum.won.length} won · ${sum.lost.length} lost`} />
        <Tile label="Average days to close" value={sum.avgDays === null ? '—' : sum.avgDays} sub="From first enquiry to won" />
        <Tile label="Average deal size" value={sum.avgDeal === null ? '—' : shortInr(sum.avgDeal)} sub="Across won clients" />
        <Tile label="Leads in view" value={leads.length} sub="The filters above apply here" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Conversion funnel" lede="How many leads reached each stage."><Bars rows={funnel} /></Card>
        <Card title="Where leads come from" lede="Leads per source, and how many became clients.">
          <Bars rows={group(SOURCES, 'source')} />
          <Legend />
        </Card>
        <Card title="Service needed" lede="What consultation clients are asking for."><Bars rows={group(SERVICES, 'service')} /></Card>
        <Card title="Why leads are lost" lede="Reasons picked when closing a lead as lost."><Bars rows={reasons} /></Card>
      </div>
    </div>
  )
}

function Tile({ label, value, sub }) {
  return (
    <div className="stat px-5 py-4">
      <div className="text-[12px] font-medium text-mute">{label}</div>
      <div className="mt-1 font-head text-[24px] font-bold leading-tight">{value}</div>
      <div className="mt-1 text-[12px] text-mute2">{sub}</div>
    </div>
  )
}

function Card({ title, lede, children }) {
  return (
    <section className="panel min-w-0 px-5 py-4">
      <h3 className="font-head text-[15px] font-semibold">{title}</h3>
      <p className="mb-4 mt-0.5 text-[12.5px] text-mute">{lede}</p>
      {children}
    </section>
  )
}

function Bars({ rows }) {
  if (!rows.length) return <p className="text-[12.5px] text-mute2">Nothing to show for these filters yet.</p>
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[96px_1fr_70px] items-center gap-3 text-[13px] sm:grid-cols-[140px_1fr_96px]">
          <span className="truncate" title={r.label}>{r.label}</span>
          <span className="relative h-2.5 overflow-hidden rounded-full bg-hair/[0.07]">
            <span className="absolute inset-y-0 left-0 rounded-full bg-teal" style={{ width: (r.n / max) * 100 + '%' }} />
            {r.w ? <span className="absolute inset-y-0 left-0 rounded-full bg-green" style={{ width: (r.w / max) * 100 + '%' }} /> : null}
          </span>
          <span className="text-right text-[12px] tabular-nums text-mute">{r.text || r.n}</span>
        </div>
      ))}
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-3 flex gap-4 text-[12px] text-mute">
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal" />All leads</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green" />Won</span>
    </div>
  )
}
