"use client";
import { CheckCircle2, AlertTriangle, Circle, Loader2, Sparkles, Zap } from "lucide-react";
import { COST, useStore } from "@/lib/store";
import type { EnrichStatus } from "@/lib/types";
import { Btn, Empty, PageHeader, TierBadge } from "../ui";

function Status({ s }: { s: EnrichStatus }) {
  if (s === "verified") return <span className="inline-flex items-center gap-1 text-[12px] text-tiera"><CheckCircle2 size={13} /> MX valid</span>;
  if (s === "risky") return <span className="inline-flex items-center gap-1 text-[12px] text-tierb"><AlertTriangle size={13} /> Catch-all, risky</span>;
  if (s === "invalid") return <span className="inline-flex items-center gap-1 text-[12px] text-muted line-through">No email found</span>;
  return <span className="inline-flex items-center gap-1 text-[12px] text-muted"><Circle size={11} /> Not enriched</span>;
}

export function OutreachView() {
  const s = useStore();
  if (!s.contacts.length) return <Empty text="Contacts appear after discovery." />;
  const tierOf = (accountId: string) => s.accounts.find((a) => a.id === accountId)!.tier;
  const rows = s.contacts.slice().sort((a, b) => tierOf(a.accountId).localeCompare(tierOf(b.accountId)));
  const enrichedA = s.contacts.filter((c) => c.enriched).length > 0;
  return (
    <div>
      <PageHeader
        kicker="Module 4 · Enrichment & composition"
        title="Verify, then write"
        lede={`Each enrichment is metered through Flexprice at ${COST.lead_enriched} credits per contact. Drafts cite the buyer's own signals.`}
        right={
          <>
            <Btn variant="outline" onClick={() => s.enrich(["A"])} disabled={!!s.busy || enrichedA}>
              {s.busy === "enrich" ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Enrich Tier A
            </Btn>
            <Btn variant="outline" onClick={() => s.enrich(["B", "C"])} disabled={!!s.busy}><Zap size={14} /> Enrich Tier B & C</Btn>
            <Btn onClick={s.composeDrafts} disabled={!!s.busy || !enrichedA}>
              {s.busy === "compose" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Compose outreach
            </Btn>
          </>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-line bg-panel">
        <table className="grid-dense w-full text-[13px]">
          <thead><tr className="text-left"><th>Name</th><th>Title</th><th>Company</th><th>Tier</th><th>Email</th><th>Status</th><th>LinkedIn</th></tr></thead>
          <tbody>
            {rows.map((c) => {
              const a = s.accounts.find((x) => x.id === c.accountId)!;
              return (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.title}</td>
                  <td>{a.name}</td>
                  <td><TierBadge tier={a.tier} /></td>
                  <td className="num text-[12px]">{c.enriched && c.email ? c.email : <span className="text-muted">••••••@{a.domain}</span>}</td>
                  <td><Status s={c.emailStatus} /></td>
                  <td className="num text-[12px]">{c.enriched && c.linkedin ? <span className="text-tiera">{c.linkedin}</span> : <span className="text-muted">{c.enriched ? "not found" : "pending"}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
