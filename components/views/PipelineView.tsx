"use client";
import { useState } from "react";
import { Bot, MailOpen, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { STAGES, type Stage } from "@/lib/types";
import { Btn, Empty, PageHeader, TierBadge } from "../ui";

export function PipelineView() {
  const s = useStore();
  const [drag, setDrag] = useState<string | null>(null);
  if (!s.leads.length) return <Empty text="Matched leads land here after discovery." />;

  const count = (st: Stage) => s.leads.filter((l) => l.stage === st).length;
  const reached = (i: number) => s.leads.filter((l) => STAGES.indexOf(l.stage) >= i).length;
  const sent = s.drafts.filter((d) => d.status === "sent");
  const replied = s.leads.filter((l) => STAGES.indexOf(l.stage) >= 2);
  const variantRate = (v: string) => {
    const ids = sent.filter((d) => d.variant === v).map((d) => d.contactId);
    const r = replied.filter((l) => ids.includes(l.contactId)).length;
    return ids.length ? Math.round((r / ids.length) * 100) : 0;
  };

  return (
    <div>
      <PageHeader
        kicker="Module 5 · Pipeline"
        title="The pipeline updates itself"
        lede="Replies move cards automatically. Every move is attributed to the AI or to a rep and logged."
        right={<Btn variant="outline" onClick={s.simulateReply} disabled={!count("Contacted")}><MailOpen size={14} /> Check inbox</Btn>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {STAGES.map((st, i) => (
          <div key={st} className="rounded-lg border border-line bg-panel px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-muted">{st}</div>
            <div className="num mt-1 text-[24px] font-semibold">{count(st)}</div>
            <div className="num text-[11px] text-muted">{i === 0 ? "of pipeline" : `${reached(i - 1) ? Math.round((reached(i) / reached(i - 1)) * 100) : 0}% from prev`}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-3">
        {STAGES.map((st) => (
          <div
            key={st}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (drag) s.moveLead(drag, st, "Rep"); setDrag(null); }}
            className="min-h-[260px] rounded-lg border border-line bg-line/30 p-2"
          >
            <div className="mb-2 px-1 text-[12px] font-semibold">{st}</div>
            <div className="space-y-2">
              {s.leads.filter((l) => l.stage === st).map((l) => {
                const c = s.contacts.find((x) => x.id === l.contactId)!;
                const a = s.accounts.find((x) => x.id === l.accountId)!;
                return (
                  <div key={l.id} draggable onDragStart={() => setDrag(l.id)} className="fadein cursor-grab rounded-md border border-line bg-panel p-2.5 shadow-sm active:cursor-grabbing">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[12.5px] font-medium">{a.name}</span>
                      <TierBadge tier={a.tier} />
                    </div>
                    <div className="truncate text-[11.5px] text-muted">{c.name} · {c.title}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium ${l.movedBy === "AI" ? "bg-[#4c5fd5]/12 text-[#4c5fd5]" : "bg-accent-soft text-accent"}`}>
                        {l.movedBy === "AI" ? <Bot size={11} /> : <User size={11} />} {l.movedBy}
                      </span>
                      <span className="num text-[10px] text-muted">{l.updatedAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="mb-3 font-serif text-[18px]">Message variants</div>
          {["Signal-led", "Value-led"].map((v) => (
            <div key={v} className="mb-2 flex items-center gap-3 text-[13px]">
              <span className="w-24">{v}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-ink transition-all" style={{ width: `${variantRate(v)}%` }} /></span>
              <span className="num w-20 text-right">{variantRate(v)}% reply</span>
            </div>
          ))}
          <div className="mt-2 text-[11.5px] text-muted">Reply rate by opener style across {sent.length} sent emails.</div>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="mb-3 font-serif text-[18px]">Audit log</div>
          <div className="max-h-44 space-y-1 overflow-y-auto">
            {s.audit.map((e) => (
              <div key={e.id} className="flex gap-3 text-[12px]">
                <span className="num text-muted">{e.ts}</span>
                <span className={`w-8 font-medium ${e.actor === "AI" ? "text-[#4c5fd5]" : "text-accent"}`}>{e.actor}</span>
                <span className="flex-1 truncate">{e.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
