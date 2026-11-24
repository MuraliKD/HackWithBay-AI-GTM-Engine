"use client";
// Client-side pipeline state. Every "engine" action below is currently a
// scripted simulation over lib/mock.ts. Stage 3 swaps each one for a call to
// an /api route (LLM, Tavily, Hunter, Flexprice) without changing the UI.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { buildGraph } from "./graph";
import {
  MOCK_ACCOUNTS, MOCK_COMPETITORS, MOCK_CONTACTS, MOCK_GRAPH, MOCK_ICP, PRODUCT_DESCRIPTION, mockDraftsFor,
} from "./mock";
import type {
  Account, AgentEvent, AgentName, AuditEntry, Competitor, Contact, Draft, Icp, Lead, Stage, UsageEvent, View,
} from "./types";

export const STARTING_CREDITS = 60;
export const COST = { icp_inference: 1, discovery_search: 5, lead_enriched: 3, outreach_sent: 0, graph_query: 0 } as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
let seq = 0;
const uid = (p: string) => `${p}-${++seq}-${Math.random().toString(36).slice(2, 6)}`;

interface ChatMsg { role: "user" | "assistant"; text: string }

interface Store {
  view: View;
  setView: (v: View) => void;
  busy: string | null;
  product: string;
  setProduct: (s: string) => void;
  chat: ChatMsg[];
  icp: Icp | null;
  accounts: Account[];
  competitors: Competitor[];
  contacts: Contact[];
  drafts: Draft[];
  leads: Lead[];
  events: AgentEvent[];
  audit: AuditEntry[];
  usage: UsageEvent[];
  credits: number;
  creditGate: { needed: number; label: string } | null;
  closeCreditGate: () => void;
  graph: typeof MOCK_GRAPH;
  live: { icp: boolean; discovery: boolean; enrich: boolean };
  runIcp: () => Promise<void>;
  setExpansion: (id: string, status: "accepted" | "dismissed") => void;
  approveIcp: () => Promise<void>;
  enrich: (tiers: ("A" | "B" | "C")[]) => Promise<void>;
  composeDrafts: () => Promise<void>;
  updateDraft: (id: string, patch: Partial<Draft>) => void;
  sendApproved: () => Promise<void>;
  moveLead: (id: string, stage: Stage, by: "AI" | "Rep") => void;
  simulateReply: () => Promise<void>;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>("intake");
  const [busy, setBusy] = useState<string | null>(null);
  const [product, setProduct] = useState(PRODUCT_DESCRIPTION);
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "assistant", text: "Tell me about your product in plain English: what it does, who already buys it, and how you price it. I'll turn it into an ICP." },
  ]);
  const [icp, setIcp] = useState<Icp | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [usage, setUsage] = useState<UsageEvent[]>([]);
  const [graph, setGraph] = useState(MOCK_GRAPH);
  const [live, setLive] = useState<{ icp: boolean; discovery: boolean; enrich: boolean }>({ icp: false, discovery: false, enrich: false });
  const [creditGate, setCreditGate] = useState<{ needed: number; label: string } | null>(null);
  const creditsRef = useRef(STARTING_CREDITS);
  const [credits, setCredits] = useState(STARTING_CREDITS);

  const log = useCallback(async (agent: AgentName, text: string, kind: AgentEvent["kind"] = "step", delay = 350) => {
    setEvents((e) => [...e, { id: uid("ev"), agent, text, kind, ts: now() }]);
    await sleep(delay);
  }, []);

  const addAudit = useCallback((actor: "AI" | "Rep", action: string, target: string) => {
    setAudit((a) => [{ id: uid("au"), ts: now(), actor, action, target }, ...a]);
  }, []);

  const meter = useCallback((m: UsageEvent["meter"], units: number, note: string): boolean => {
    const cost = COST[m] * units;
    if (cost > creditsRef.current) return false;
    creditsRef.current -= cost;
    setCredits(creditsRef.current);
    setUsage((u) => [{ id: uid("us"), ts: now(), meter: m, credits: cost, note }, ...u]);
    return true;
  }, []);

  const runIcp = useCallback(async () => {
    setBusy("icp");
    setChat((c) => [...c, { role: "user", text: product }]);
    await log("Planner", "Received product brief. Plan: extract → infer ICP → score confidence → propose expansions.");
    meter("icp_inference", 1, "ICP inference");
    await log("Builder", "Extracting features, pricing model, reference customers with Claude…", "step", 100);
    let result: Icp = structuredClone(MOCK_ICP);
    try {
      const res = await fetch("/api/icp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      result = json.icp;
      setLive((l) => ({ ...l, icp: true }));
      await log("Builder", `Mapped industries, size bands, personas and triggers${json.cached ? " (cached run)" : ""}.`);
    } catch (e) {
      await log("Security", `Live ICP call unavailable (${(e as Error).message}). Using cached demo ICP.`, "flag");
    }
    const low = [...result.fields].sort((a, b) => a.confidence - b.confidence)[0];
    await log("Reviewer", `Scored field-level confidence. Lowest: ${low.label.toLowerCase()} (${low.confidence.toFixed(2)}).`, "validate");
    await log("Planner", `Found ${result.expansions.length} expansion segments with web evidence. Holding for founder accept/dismiss.`, "mention");
    setIcp(result);
    setChat((c) => [...c, { role: "assistant", text: "Here's the ICP I inferred, with a confidence score on each field. I also found three adjacent segments; accept or dismiss each one." }]);
    setBusy(null);
    setView("icp");
  }, [product, log, meter]);

  const setExpansion = useCallback((id: string, status: "accepted" | "dismissed") => {
    setIcp((i) => i && { ...i, expansions: i.expansions.map((e) => (e.id === id ? { ...e, status } : e)) });
    addAudit("Rep", status === "accepted" ? "Accepted expansion" : "Dismissed expansion", id);
  }, [addAudit]);

  const approveIcp = useCallback(async () => {
    if (!icp) return;
    const approved = { ...icp, approved: true };
    setIcp(approved);
    addAudit("Rep", "Approved ICP", "ICP v1");
    setBusy("discovery");
    setView("accounts");
    await log("Planner", "ICP approved. Dispatching discovery across company sites, press, filings and job posts.");
    meter("discovery_search", 1, "Discovery run");
    let found: Account[] = MOCK_ACCOUNTS;
    let comps: Competitor[] = MOCK_COMPETITORS;
    let isLive = false;
    try {
      const res = await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ icp: approved, product }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (!json.accounts?.length) throw new Error("no accounts returned");
      for (const q of (json.queries as string[]).slice(0, 4)) await log("Builder", `Tavily: "${q}"`, "step", 120);
      await log("Builder", `${json.resultCount} unique results read${json.cached ? " (cached run)" : ""}.`);
      found = json.accounts; comps = json.competitors; isLive = true;
      setLive((l) => ({ ...l, discovery: true }));
    } catch (e) {
      await log("Security", `Live discovery unavailable (${(e as Error).message}). Using cached demo accounts.`, "flag");
    }
    for (const a of found) {
      setAccounts((prev) => [...prev, a]);
      await sleep(120);
    }
    const cites = found.reduce((n, a) => n + a.sources.length, 0);
    await log("Reviewer", `Validated ${cites} citations against source text. Accounts without a source were dropped.`, "validate");
    const excluded = found.filter((a) => a.excluded);
    if (excluded.length) await log("Reviewer", `Excluded ${excluded.map((a) => `${a.name} (${a.excluded})`).join(", ")}.`, "flag");
    setCompetitors(comps);
    await log("Builder", `Mapped ${comps.length} competitors.`);
    const g = isLive ? buildGraph(found, comps) : MOCK_GRAPH;
    setGraph(g);
    meter("graph_query", 1, "Warm-intro path search");
    const active = found.filter((a) => !a.excluded);
    await log("Builder", `Graph: MERGE ${active.length} Company, ${active.length * 2} Person, ${comps.length} Competitor, ${active.length} Signal nodes.`, "graph");
    if (g.warmPath.length) await log("Builder", `Graph: shortest warm path Founder → Advisor → ${active[0]?.name} → CTO (3 hops).`, "graph");
    const people: Contact[] = isLive
      ? active.flatMap((a) => [
          { id: `${a.id}-c0`, accountId: a.id, name: "CTO", title: "CTO / VP Engineering", persona: "Technical buyer", emailStatus: "none" as const, enriched: false },
          { id: `${a.id}-c1`, accountId: a.id, name: "Finance lead", title: "Head of Finance", persona: "Economic buyer", emailStatus: "none" as const, enriched: false },
        ])
      : MOCK_CONTACTS;
    setContacts(people);
    const tierA = people.filter((c) => found.find((a) => a.id === c.accountId)!.tier === "A");
    setLeads(tierA.map((c) => ({ id: uid("ld"), contactId: c.id, accountId: c.accountId, stage: "Matched" as const, movedBy: "AI" as const, updatedAt: now() })));
    addAudit("AI", `Matched ${tierA.length} Tier A contacts`, "Pipeline");
    setBusy(null);
  }, [icp, product, addAudit, log, meter]);

  const enrich = useCallback(async (tiers: ("A" | "B" | "C")[]) => {
    const targets = contacts.filter((c) => !c.enriched && tiers.includes(accounts.find((a) => a.id === c.accountId)?.tier ?? "C"));
    const needed = targets.length * COST.lead_enriched;
    if (needed > creditsRef.current) {
      setCreditGate({ needed, label: `Tier ${tiers.join(" & ")}` });
      await log("Security", `Credit gate: run needs ${needed} credits, ${creditsRef.current} remain. Blocked.`, "flag");
      return;
    }
    setBusy("enrich");
    await log("Planner", `Enriching ${targets.length} contacts (Tier ${tiers.join(", ")}).`);
    for (const [i, t] of targets.entries()) {
      meter("lead_enriched", 1, `Enriched ${t.name}`);
      const status = i === 5 ? "risky" : "verified";
      setContacts((cs) => cs.map((c) => (c.id === t.id ? { ...c, enriched: true, emailStatus: status } : c)));
      await sleep(160);
    }
    await log("Builder", "Hunter: 11 deliverable (MX valid), 1 catch-all flagged risky.", "validate");
    addAudit("AI", `Enriched ${targets.length} contacts`, `Tier ${tiers.join(", ")}`);
    setBusy(null);
  }, [accounts, contacts, log, meter, addAudit]);

  const composeDrafts = useCallback(async () => {
    setBusy("compose");
    const ready = contacts.filter((c) => c.enriched && c.emailStatus === "verified");
    await log("Planner", `Composing outreach for ${ready.length} verified contacts. Variants: signal-led vs value-led.`);
    await log("Builder", "Weaving trigger signals + cited sources into copy. Persona tone: technical (CTO), ROI (Finance).");
    const ds = mockDraftsFor(ready, accounts);
    setDrafts(ds);
    await log("Reviewer", "Fact-checking every claim against its source…", "validate", 600);
    const flagged = ds.find((d) => d.reviewerFlag);
    if (flagged) {
      const c = contacts.find((x) => x.id === flagged.contactId)!;
      await log("Reviewer", `@Founder draft for ${c.name}: ${flagged.reviewerFlag}`, "mention");
    }
    await log("Security", "Scanned outbound links: 0 unsafe. No PII beyond business email.", "validate");
    setBusy(null);
    setView("approvals");
  }, [accounts, contacts, log]);

  const updateDraft = useCallback((id: string, patch: Partial<Draft>) => {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    if (patch.status) addAudit("Rep", `${patch.status === "approved" ? "Approved" : patch.status === "rejected" ? "Rejected" : "Edited"} draft`, id);
  }, [addAudit]);

  const sendApproved = useCallback(async () => {
    const approved = drafts.filter((d) => d.status === "approved");
    if (!approved.length) return;
    setBusy("send");
    await log("Planner", `HITL gate passed for ${approved.length} drafts. Queuing via SendGrid.`);
    for (const d of approved) meter("outreach_sent", 1, `Sent to ${d.contactId}`);
    setDrafts((ds) => ds.map((d) => (d.status === "approved" ? { ...d, status: "sent" } : d)));
    const sentIds = new Set(approved.map((d) => d.contactId));
    setLeads((ls) => ls.map((l) => (sentIds.has(l.contactId) ? { ...l, stage: "Contacted", movedBy: "AI", updatedAt: now() } : l)));
    addAudit("AI", `Sent ${approved.length} emails`, "SendGrid");
    await log("Builder", `Delivered ${approved.length}/${approved.length}. Webhooks armed for replies.`);
    setBusy(null);
    setView("pipeline");
  }, [drafts, log, meter, addAudit]);

  const moveLead = useCallback((id: string, stage: Stage, by: "AI" | "Rep") => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage, movedBy: by, updatedAt: now() } : l)));
    addAudit(by, `Moved to ${stage}`, id);
  }, [addAudit]);

  const simulateReply = useCallback(async () => {
    const target = leads.find((l) => l.stage === "Contacted");
    if (!target) return;
    const c = contacts.find((x) => x.id === target.contactId)!;
    await log("Builder", `Inbound webhook: reply from ${c.name}. Sentiment: positive, asks for a time.`);
    moveLead(target.id, "Replied", "AI");
  }, [leads, contacts, log, moveLead]);

  const reset = useCallback(() => {
    creditsRef.current = STARTING_CREDITS;
    setCredits(STARTING_CREDITS);
    setIcp(null); setAccounts([]); setCompetitors([]); setContacts([]); setDrafts([]); setLeads([]);
    setEvents([]); setAudit([]); setGraph(MOCK_GRAPH); setLive({ icp: false, discovery: false, enrich: false }); setUsage([]); setCreditGate(null); setBusy(null);
    setChat((c) => c.slice(0, 1)); setView("intake");
  }, []);

  const value = useMemo<Store>(() => ({
    view, setView, busy, product, setProduct, chat, icp, accounts, competitors, contacts, drafts, leads, events, audit, usage,
    credits, creditGate, closeCreditGate: () => setCreditGate(null), graph, live,
    runIcp, setExpansion, approveIcp, enrich, composeDrafts, updateDraft, sendApproved, moveLead, simulateReply, reset,
  }), [view, busy, product, chat, icp, accounts, competitors, contacts, drafts, leads, events, audit, usage, credits, creditGate, graph, live,
    runIcp, setExpansion, approveIcp, enrich, composeDrafts, updateDraft, sendApproved, moveLead, simulateReply, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
