"use client";
import { useState } from "react";
import {
  Bot, Coins, GitBranch, Inbox, KanbanSquare, MessageSquareText, PanelRightClose, PanelRightOpen, RotateCcw, Send, Swords, Table2, Target,
} from "lucide-react";
import { STARTING_CREDITS, useStore } from "@/lib/store";
import type { View } from "@/lib/types";
import { AgentRail } from "./AgentRail";
import { IntakeView } from "./views/IntakeView";
import { IcpView } from "./views/IcpView";
import { AccountsView } from "./views/AccountsView";
import { CompetitorsView } from "./views/CompetitorsView";
import { GraphView } from "./views/GraphView";
import { OutreachView } from "./views/OutreachView";
import { ApprovalsView } from "./views/ApprovalsView";
import { PipelineView } from "./views/PipelineView";
import { CreditGate } from "./CreditGate";

const NAV: { id: View; label: string; icon: React.ElementType; module: string }[] = [
  { id: "intake", label: "Product intake", icon: MessageSquareText, module: "1" },
  { id: "icp", label: "ICP", icon: Target, module: "1" },
  { id: "accounts", label: "Accounts", icon: Table2, module: "2" },
  { id: "competitors", label: "Competitors", icon: Swords, module: "2" },
  { id: "graph", label: "Knowledge graph", icon: GitBranch, module: "3" },
  { id: "outreach", label: "Enrich & compose", icon: Send, module: "4" },
  { id: "approvals", label: "Approvals", icon: Inbox, module: "4" },
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare, module: "5" },
];

export function Shell() {
  const s = useStore();
  const [railOpen, setRailOpen] = useState(true);
  const pendingApprovals = s.drafts.filter((d) => d.status === "pending").length;
  const pct = (s.credits / STARTING_CREDITS) * 100;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-5">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-[22px] font-semibold tracking-tight">4WeekStartup <span className="italic text-accent">GTM</span></span>
          <span className="hidden text-[12px] text-muted md:inline">Product description → booked meeting, a human approves every word</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-md border border-line px-3 py-1" title="Flexprice usage metering">
            <Coins size={14} className="text-accent" />
            <span className="text-[11px] uppercase tracking-wider text-muted">Flexprice</span>
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
            </span>
            <span className="num text-[13px] font-semibold">{s.credits}</span>
            <span className="text-[11px] text-muted">credits</span>
          </div>
          <button onClick={s.reset} className="text-muted hover:text-ink" title="Reset demo"><RotateCcw size={15} /></button>
          <button onClick={() => setRailOpen((o) => !o)} className="text-muted hover:text-ink" title="Agent Thinking">
            {railOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="w-52 shrink-0 border-r border-line bg-paper px-3 py-4">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = s.view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => s.setView(n.id)}
                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13.5px] ${active ? "bg-ink text-paper" : "text-ink/80 hover:bg-line/60"}`}
              >
                <Icon size={15} />
                <span className="flex-1">{n.label}</span>
                {n.id === "approvals" && pendingApprovals > 0 && (
                  <span className="num rounded bg-accent px-1.5 text-[10.5px] text-white">{pendingApprovals}</span>
                )}
                <span className={`num text-[10px] ${active ? "text-paper/60" : "text-muted/70"}`}>M{n.module}</span>
              </button>
            );
          })}
          <div className="mt-6 rounded-md border border-line bg-panel p-3 text-[11.5px] text-muted">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-ink"><Bot size={13} /> Band agents</div>
            Planner · Builder · Reviewer · Security
          </div>
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
          {s.view === "intake" && <IntakeView />}
          {s.view === "icp" && <IcpView />}
          {s.view === "accounts" && <AccountsView />}
          {s.view === "competitors" && <CompetitorsView />}
          {s.view === "graph" && <GraphView />}
          {s.view === "outreach" && <OutreachView />}
          {s.view === "approvals" && <ApprovalsView />}
          {s.view === "pipeline" && <PipelineView />}
        </main>

        {railOpen && <AgentRail />}
      </div>
      <CreditGate />
    </div>
  );
}
