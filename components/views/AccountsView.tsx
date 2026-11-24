"use client";
import { ArrowRight, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Btn, Empty, FitScore, PageHeader, SourceChip, TierBadge } from "../ui";

export function AccountsView() {
  const s = useStore();
  if (!s.icp?.approved) return <Empty text="Approve the ICP to run discovery." />;
  const active = s.accounts.filter((a) => !a.excluded);
  const counts = { A: active.filter((a) => a.tier === "A").length, B: active.filter((a) => a.tier === "B").length, C: active.filter((a) => a.tier === "C").length };
  return (
    <div>
      <PageHeader
        kicker="Module 2 · Buyer discovery"
        title="Accounts that match, with receipts"
        lede="Every account is grounded in a public source. Hover a number to see the exact line it came from."
        right={
          <>
            <span className="num text-[12px] text-muted">A {counts.A} · B {counts.B} · C {counts.C}</span>
            <Btn onClick={() => s.setView("graph")} disabled={s.busy === "discovery"}>
              {s.busy === "discovery" ? <Loader2 size={14} className="animate-spin" /> : null} Open graph <ArrowRight size={14} />
            </Btn>
          </>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-line bg-panel">
        <table className="grid-dense w-full text-[13px]">
          <thead>
            <tr className="text-left">
              <th>Company</th><th>Industry</th><th>Trigger signal</th><th>Fit</th><th>Tier</th><th>Sources</th>
            </tr>
          </thead>
          <tbody>
            {s.accounts.map((a) => (
              <tr key={a.id} className={`fadein ${a.excluded ? "text-muted" : ""}`}>
                <td>
                  <div className={`font-medium ${a.excluded ? "line-through" : ""}`}>{a.name}</div>
                  <div className="num text-[11px] text-muted">{a.domain}</div>
                </td>
                <td className="max-w-[160px] truncate">{a.industry}</td>
                <td>
                  {a.excluded
                    ? <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11.5px] text-accent">Excluded: {a.excluded}</span>
                    : a.signal}
                </td>
                <td>{a.excluded ? <span className="text-muted">n/a</span> : <FitScore fit={a.fit} />}</td>
                <td>{a.excluded ? null : <TierBadge tier={a.tier} />}</td>
                <td><span className="flex gap-1">{a.sources.map((src) => <SourceChip key={src.id} source={src} />)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {s.accounts.length === 0 && <div className="p-6 text-center text-[13px] text-muted">Searching…</div>}
      </div>
    </div>
  );
}
