"use client";
import { useState } from "react";
import { AlertTriangle, Check, Lock, Pencil, Send, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Draft } from "@/lib/types";
import { Btn, Empty, PageHeader, SourceChip } from "../ui";

function renderBody(body: string, sources: { id: number; title: string; url: string; quote: string }[]) {
  const parts = body.split(/(\[\[\d+\]\])/g);
  return parts.map((p, i) => {
    const m = p.match(/\[\[(\d+)\]\]/);
    if (m) {
      const src = sources.find((s) => s.id === Number(m[1]));
      return src ? <SourceChip key={i} source={src} /> : null;
    }
    return <span key={i}>{p}</span>;
  });
}

export function ApprovalsView() {
  const s = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  if (!s.drafts.length) return <Empty text="Compose outreach to fill the approval queue." />;
  const approved = s.drafts.filter((d) => d.status === "approved").length;
  const pending = s.drafts.filter((d) => d.status === "pending");
  const current: Draft = s.drafts.find((d) => d.id === selected) ?? s.drafts.find((d) => d.reviewerFlag && d.status === "pending") ?? s.drafts[0];
  const contact = s.contacts.find((c) => c.id === current.contactId)!;
  const account = s.accounts.find((a) => a.id === contact.accountId)!;

  return (
    <div>
      <PageHeader
        kicker="Module 4 · Human-in-the-loop gate"
        title="Nothing sends without you"
        lede="Approve, edit or reject each draft. The Reviewer agent fact-checks every claim against its source first."
        right={
          <>
            <Btn variant="outline" onClick={() => pending.filter((d) => !d.reviewerFlag).forEach((d) => s.updateDraft(d.id, { status: "approved" }))} disabled={!pending.length}>
              <Check size={14} /> Approve all unflagged
            </Btn>
            <Btn onClick={s.sendApproved} disabled={!approved || !!s.busy}>
              {approved ? <Send size={14} /> : <Lock size={14} />} Send {approved || ""}
            </Btn>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          {s.drafts.map((d) => {
            const c = s.contacts.find((x) => x.id === d.contactId)!;
            const a = s.accounts.find((x) => x.id === c.accountId)!;
            return (
              <button key={d.id} onClick={() => { setSelected(d.id); setEditing(null); }} className={`flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left last:border-0 ${current.id === d.id ? "bg-paper" : "hover:bg-paper/60"}`}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{c.name} <span className="font-normal text-muted">· {a.name}</span></div>
                  <div className="truncate text-[11.5px] text-muted">{d.variant} · {d.channel}</div>
                </div>
                {d.reviewerFlag && d.status === "pending" && <AlertTriangle size={14} className="text-accent" />}
                <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-medium ${d.status === "approved" ? "bg-tiera/15 text-tiera" : d.status === "rejected" ? "bg-line text-muted line-through" : d.status === "sent" ? "bg-ink text-paper" : "bg-accent-soft text-accent"}`}>{d.status}</span>
              </button>
            );
          })}
        </div>
        <div className="rounded-lg border border-line bg-panel p-5">
          {current.reviewerFlag && current.status === "pending" && (
            <div className="mb-4 flex gap-2 rounded-md bg-accent-soft p-3 text-[13px] text-accent">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div><b>@Reviewer:</b> {current.reviewerFlag}</div>
            </div>
          )}
          <div className="text-[12px] text-muted">To <b className="text-ink">{contact.name}</b> &lt;{contact.email}&gt; · {contact.title}, {account.name}</div>
          {current.subject && <div className="mt-2 font-serif text-[20px]">{current.subject}</div>}
          {editing === current.id ? (
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={11} className="mt-3 w-full rounded border border-line bg-paper p-3 text-[14px] leading-relaxed outline-none" />
          ) : (
            <div className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed">{renderBody(current.body, account.sources)}</div>
          )}
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
            {editing === current.id ? (
              <Btn onClick={() => { s.updateDraft(current.id, { body: text, reviewerFlag: undefined }); setEditing(null); }}><Check size={14} /> Save edit</Btn>
            ) : (
              <>
                <Btn onClick={() => s.updateDraft(current.id, { status: "approved" })} disabled={current.status !== "pending"}><Check size={14} /> Approve</Btn>
                <Btn variant="outline" onClick={() => { setEditing(current.id); setText(current.body); }} disabled={current.status !== "pending"}><Pencil size={13} /> Edit</Btn>
                <Btn variant="ghost" onClick={() => s.updateDraft(current.id, { status: "rejected" })} disabled={current.status !== "pending"}><X size={14} /> Reject</Btn>
              </>
            )}
            <span className="ml-auto text-[11.5px] text-muted">Variant: {current.variant}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
