"use client";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import type { AgentName } from "@/lib/types";

const AGENT_COLOR: Record<AgentName, string> = {
  Planner: "#4c5fd5",
  Builder: "#1f7a4d",
  Reviewer: "#b7791f",
  Security: "#c2255c",
};

export function AgentRail() {
  const { events, usage, busy } = useStore();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [events.length]);

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="font-serif text-[17px]">Agent Thinking</div>
        <span className={`flex items-center gap-1.5 text-[11px] ${busy ? "text-accent" : "text-muted"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${busy ? "animate-pulse bg-accent" : "bg-line"}`} />
          {busy ? "working" : "idle"}
        </span>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {events.length === 0 && <div className="text-[12.5px] text-muted">Reasoning steps, graph traversals and validation logs stream here once the pipeline runs.</div>}
        {events.map((e) => (
          <div key={e.id} className={`fadein text-[12.5px] leading-snug ${e.kind === "mention" || e.kind === "flag" ? "rounded-md bg-accent-soft p-2" : ""}`}>
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-[11px] font-semibold" style={{ color: AGENT_COLOR[e.agent] }}>@{e.agent}</span>
              <span className="num text-[10px] text-muted">{e.ts}</span>
              {e.kind === "graph" && <span className="rounded bg-line px-1 text-[9.5px] uppercase text-muted">graph</span>}
              {e.kind === "validate" && <span className="rounded bg-line px-1 text-[9.5px] uppercase text-muted">check</span>}
            </div>
            <div className={e.kind === "graph" ? "num text-[11.5px] text-ink/80" : "text-ink/90"}>{e.text}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="border-t border-line px-4 py-3">
        <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted">Flexprice usage ledger</div>
        <div className="max-h-28 space-y-1 overflow-y-auto">
          {usage.length === 0 && <div className="text-[11.5px] text-muted">No metered events yet.</div>}
          {usage.slice(0, 8).map((u) => (
            <div key={u.id} className="flex justify-between text-[11.5px]">
              <span className="num text-muted">{u.meter}</span>
              <span className="num">{u.credits ? `−${u.credits}` : "0"}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
