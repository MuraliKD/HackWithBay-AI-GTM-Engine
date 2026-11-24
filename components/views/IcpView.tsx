"use client";
import { Check, Loader2, Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Btn, Confidence, Empty, PageHeader, SourceChip } from "../ui";

export function IcpView() {
  const s = useStore();
  if (!s.icp) return <Empty text="Run product intake first to infer an ICP." />;
  const { icp } = s;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        kicker="Module 1 · Inferred ICP"
        title="Who should buy Flexprice"
        lede={icp.summary}
        right={
          <Btn onClick={s.approveIcp} disabled={icp.approved || !!s.busy}>
            {s.busy === "discovery" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {icp.approved ? "ICP approved" : "Approve & run discovery"}
          </Btn>
        }
      />
      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        {icp.fields.map((f, i) => (
          <div key={f.key} className="fadein grid grid-cols-[180px_1fr_150px] items-start gap-4 border-b border-line px-5 py-3.5 last:border-0" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-muted">{f.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {f.values.map((v) => <span key={v} className="rounded border border-line bg-paper px-2 py-0.5 text-[13px]">{v}</span>)}
            </div>
            <div className="justify-self-end"><Confidence value={f.confidence} /></div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-serif text-[22px]">Suggested expansion segments</h2>
      <p className="mb-3 text-[13px] text-muted">Adjacent segments the engine found evidence for. You decide which ones discovery should include.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {icp.expansions.map((e) => (
          <div key={e.id} className={`rounded-lg border bg-panel p-4 ${e.status === "accepted" ? "border-tiera" : e.status === "dismissed" ? "border-line opacity-50" : "border-line"}`}>
            <div className="font-medium">{e.segment}</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{e.reasoning}</p>
            <div className="mt-2 flex gap-1">{e.sources.map((src) => <SourceChip key={src.id} source={src} />)}</div>
            <div className="mt-3 flex gap-2">
              {e.status === "pending" ? (
                <>
                  <Btn variant="outline" onClick={() => s.setExpansion(e.id, "accepted")}><Check size={13} /> Accept</Btn>
                  <Btn variant="ghost" onClick={() => s.setExpansion(e.id, "dismissed")}><X size={13} /> Dismiss</Btn>
                </>
              ) : (
                <span className={`text-[12px] font-medium ${e.status === "accepted" ? "text-tiera" : "text-muted"}`}>{e.status === "accepted" ? "Added to ICP" : "Dismissed"}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
