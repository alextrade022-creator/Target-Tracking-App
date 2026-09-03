import { MonthSelect } from './ui'

export default function Report({ vals, actions }) {
  return (
    <div>
      {/* Controls (hidden while printing) */}
      {!vals.printing && (
        <div className="mt-7 flex flex-wrap items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-surface px-5 py-4">
          <div className="mono text-[11px] tracking-[0.16em] text-mute2">REPORT MONTH</div>
          <MonthSelect className="min-w-[190px] flex-none" value={String(vals.repMonth)} onChange={(e) => actions.setRepMonth(Number(e.target.value))} />
          <div className="flex-1" />
          <div className="text-[12.5px] text-slate">Opens your browser's print dialog — choose "Save as PDF".</div>
          <button type="button" onClick={actions.exportPdf} className="rounded-lg bg-teal px-6 py-[11px] text-[14px] font-bold text-ink">
            ⤓ Export PDF
          </button>
        </div>
      )}

      {/* Printable sheet */}
      <div
        id="report-sheet"
        className="mx-auto mt-[26px] box-border w-[1000px] rounded-md bg-white px-14 py-[52px] text-[#16202B] shadow-[0_20px_60px_rgba(0,0,0,.4)] print:m-0 print:w-auto print:rounded-none print:p-0 print:shadow-none"
      >
        <div className="flex items-start justify-between border-b-2 border-[#16202B] pb-[18px]">
          <div>
            <div className="mono text-[11px] tracking-[0.2em] text-[#6B7885]">MONTHLY PROGRESS REPORT</div>
            <div className="mt-2 text-[34px] font-bold leading-[1.15] tracking-[-0.02em]">{vals.repMonthLabel}</div>
            <div className="mt-1.5 text-[14px] text-[#5C6B7B]">{vals.ownerName} · targets Sep 2026 → Mar 2027</div>
          </div>
          <div className="text-right">
            <div className="mono text-[11px] tracking-[0.14em] text-[#6B7885]">GENERATED</div>
            <div className="mono mt-[5px] text-[14px]">{vals.today}</div>
          </div>
        </div>

        {/* Stat boxes */}
        <div className="mt-[26px] grid grid-cols-4 gap-3.5">
          <StatBox label="OVERALL PROGRESS" value={vals.pct + '%'} sub={`${vals.doneCount} of ${vals.totalCount} milestones`} />
          <StatBox label="THIS MONTH" value={vals.repMonthPct} sub={`${vals.repMonthRatio} milestones`} />
          <StatBox label="WEEKLY ACTIONS" value={vals.repWeekPct} sub={`${vals.repWeekRatio} completed`} />
          <StatBox label="TODO BOARD" value={vals.todoDonePct} sub={vals.todoSummary} />
        </div>

        {/* Targets & goals */}
        <SectionTitle>Targets &amp; goals</SectionTitle>
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1.6fr .9fr .6fr .8fr' }}>
          <Th>TARGET</Th><Th>GOAL</Th><Th>DEADLINE</Th><Th>DONE</Th><Th last>STATUS</Th>
          {vals.repGoals.map((r, i) => (
            <div key={i} className="contents">
              <Td className="text-[13.5px] font-semibold">{r.name}</Td>
              <Td className="text-[13px] text-[#4A5866]">{r.target}</Td>
              <Td className="mono text-[12px] text-[#4A5866]">{r.due}</Td>
              <Td className="mono text-[12.5px]">{r.ratio}</Td>
              <Td last>
                <span className="mono rounded px-[9px] py-1 text-[10.5px] tracking-[0.08em]" style={{ color: r.statusColor, background: r.statusBg }}>{r.status}</span>
              </Td>
            </div>
          ))}
        </div>

        {/* Completed / pending */}
        <div className="mt-[34px] grid grid-cols-2 gap-[26px]">
          <div>
            <div className="border-b border-[#DCE2E8] pb-2 text-[19px] font-bold">Completed in {vals.repMonthShort}</div>
            <div className="mt-3 flex flex-col gap-[7px]">
              {vals.repDone.map((i, k) => (
                <ReportLine key={k} marker="✓" markerClass="text-[#2E9E5B] font-bold" item={i} />
              ))}
              {vals.repDoneEmpty && <div className="text-[13px] text-[#8892A0]">Nothing ticked off yet this month.</div>}
            </div>
          </div>
          <div>
            <div className="border-b border-[#DCE2E8] pb-2 text-[19px] font-bold">Still pending in {vals.repMonthShort}</div>
            <div className="mt-3 flex flex-col gap-[7px]">
              {vals.repPending.map((i, k) => (
                <ReportLine key={k} marker="•" markerClass="text-[#C46A1B] font-bold" item={i} />
              ))}
              {vals.repPendingEmpty && <div className="text-[13px] text-[#8892A0]">All clear — nothing pending this month.</div>}
            </div>
          </div>
        </div>

        {/* Todo board */}
        <SectionTitle>Todo board</SectionTitle>
        <div className="grid" style={{ gridTemplateColumns: '1fr 150px 120px 120px' }}>
          <Th>TASK</Th><Th>ASSIGNED TO</Th><Th>DEADLINE</Th><Th last>STATUS</Th>
          {vals.repTodos.map((t, i) => (
            <div key={i} className="contents">
              <Td className="text-[13px]" style={{ textWrap: 'pretty' }}>{t.title}</Td>
              <Td className="text-[12.5px] text-[#4A5866]">{t.who}</Td>
              <Td className="mono text-[12px] text-[#4A5866]">{t.due}</Td>
              <Td last>
                <span className="mono rounded px-[9px] py-1 text-[10.5px] tracking-[0.08em]" style={{ color: t.statusColor, background: t.statusBg }}>{t.status}</span>
              </Td>
            </div>
          ))}
        </div>
        {vals.repTodosEmpty && <div className="mt-3 text-[13px] text-[#8892A0]">No todos on the board.</div>}

        <div className="mono mt-[38px] flex justify-between border-t border-[#DCE2E8] pt-3.5 text-[10.5px] tracking-[0.12em] text-[#8892A0]">
          <div>{vals.ownerName} · MONTHLY PROGRESS REPORT</div>
          <div>{vals.repMonthLabel}</div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, sub }) {
  return (
    <div className="rounded-[10px] border border-[#DCE2E8] px-4 py-3.5">
      <div className="mono text-[10px] tracking-[0.14em] text-[#6B7885]">{label}</div>
      <div className="mono mt-1 text-[30px] font-semibold">{value}</div>
      <div className="text-[12px] text-[#5C6B7B]">{sub}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <div className="mt-[34px] border-b border-[#DCE2E8] pb-2 text-[19px] font-bold">{children}</div>
}

function Th({ children, last }) {
  return <div className={`mono py-2.5 text-[10px] tracking-[0.13em] text-[#6B7885] ${last ? 'pr-0' : 'pr-2'}`}>{children}</div>
}

function Td({ children, className = '', last, style }) {
  return <div className={`border-t border-[#EDF0F3] py-2.5 ${last ? 'pr-0' : 'pr-2'} ${className}`} style={style}>{children}</div>
}

function ReportLine({ marker, markerClass, item }) {
  return (
    <div className="flex items-start gap-2.5 text-[13px] leading-[1.4]">
      <div className={markerClass}>{marker}</div>
      <div style={{ textWrap: 'pretty' }}>
        <span className="mono text-[10.5px] text-[#6B7885]">{item.tag}</span> {item.text}
      </div>
    </div>
  )
}
