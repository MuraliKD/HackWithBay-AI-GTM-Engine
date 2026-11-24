export type Tier = "A" | "B" | "C";
export type AgentName = "Planner" | "Builder" | "Reviewer" | "Security";

export interface Source {
  id: number;
  title: string;
  url: string;
  quote: string;
}

export interface IcpField {
  key: string;
  label: string;
  values: string[];
  confidence: number; // 0.00 – 1.00
}

export interface Expansion {
  id: string;
  segment: string;
  reasoning: string;
  sources: Source[];
  status: "pending" | "accepted" | "dismissed";
}

export interface Icp {
  summary: string;
  fields: IcpField[];
  expansions: Expansion[];
  approved: boolean;
}

export interface Account {
  id: string;
  name: string;
  domain: string;
  industry: string;
  headcount: string;
  hq: string;
  signal: string;
  fit: number; // 0–100
  tier: Tier;
  sources: Source[];
  excluded?: string; // reason, e.g. negative signal
}

export type EnrichStatus = "none" | "verified" | "risky" | "invalid";

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  title: string;
  persona: string;
  email?: string;
  emailStatus: EnrichStatus;
  linkedin?: string;
  enriched: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  category: "Direct" | "Indirect" | "Alternative";
  positioning: string;
  pricing: string;
  differentiator: string;
  // positioning map coordinates 0–100
  x: number; // self-serve (0) → enterprise (100)
  y: number; // flat billing (0) → usage-native (100)
  sources: Source[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "Company" | "Person" | "Product" | "Competitor" | "Signal";
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export type DraftStatus = "pending" | "approved" | "rejected" | "sent";

export interface Draft {
  id: string;
  contactId: string;
  channel: "Email" | "LinkedIn";
  variant: "Signal-led" | "Value-led";
  subject?: string;
  body: string; // [[n]] markers reference sources on the account
  status: DraftStatus;
  reviewerFlag?: string;
}

export type Stage = "Matched" | "Contacted" | "Replied" | "Meeting Booked" | "Closed/Lost";
export const STAGES: Stage[] = ["Matched", "Contacted", "Replied", "Meeting Booked", "Closed/Lost"];

export interface Lead {
  id: string;
  contactId: string;
  accountId: string;
  stage: Stage;
  movedBy: "AI" | "Rep";
  updatedAt: string;
}

export interface AgentEvent {
  id: string;
  agent: AgentName;
  text: string;
  kind: "step" | "graph" | "validate" | "flag" | "mention";
  ts: string;
}

export interface AuditEntry {
  id: string;
  ts: string;
  actor: "AI" | "Rep";
  action: string;
  target: string;
}

export interface UsageEvent {
  id: string;
  ts: string;
  meter: "icp_inference" | "discovery_search" | "lead_enriched" | "outreach_sent" | "graph_query";
  credits: number;
  note: string;
}

export type View =
  | "intake"
  | "icp"
  | "accounts"
  | "competitors"
  | "graph"
  | "outreach"
  | "approvals"
  | "pipeline";
