import type { Account, Competitor, GraphEdge, GraphNode } from "./types";

// Builds the knowledge-graph view from discovered accounts and competitors.
// The founder→advisor relationship is demo data (it would come from the
// founder's own network import); everything else comes from discovery.
export function buildGraph(accounts: Account[], competitors: Competitor[]) {
  const top = accounts.filter((a) => !a.excluded).slice(0, 3);
  const comps = competitors.filter((c) => c.category !== "Alternative").slice(0, 2);
  const [a1, a2, a3] = top;
  const nodes: GraphNode[] = [
    { id: "flexprice", label: "Flexprice", type: "Product", x: 90, y: 230 },
    { id: "founder", label: "You (Founder)", type: "Person", x: 90, y: 80 },
    { id: "advisor", label: "Advisor (your network)", type: "Person", x: 290, y: 60 },
  ];
  const edges: GraphEdge[] = [{ from: "founder", to: "advisor", label: "knows" }];
  if (a1) {
    nodes.push(
      { id: a1.id, label: a1.name, type: "Company", x: 500, y: 110 },
      { id: `${a1.id}-c0`, label: `CTO, ${a1.name}`, type: "Person", x: 700, y: 60 },
      { id: `${a1.id}-c1`, label: `Finance lead, ${a1.name}`, type: "Person", x: 720, y: 170 },
      { id: "sig1", label: a1.signal, type: "Signal", x: 520, y: 250 },
    );
    edges.push(
      { from: "advisor", to: a1.id, label: "previously_employed_at" },
      { from: `${a1.id}-c0`, to: a1.id, label: "works_at" },
      { from: `${a1.id}-c1`, to: a1.id, label: "works_at" },
      { from: "sig1", to: a1.id, label: "signal_of" },
      { from: "flexprice", to: a1.id, label: "matched_to" },
    );
  }
  if (a2) {
    nodes.push({ id: a2.id, label: a2.name, type: "Company", x: 380, y: 330 }, { id: "sig2", label: a2.signal, type: "Signal", x: 590, y: 360 });
    edges.push({ from: "flexprice", to: a2.id, label: "matched_to" }, { from: "sig2", to: a2.id, label: "signal_of" });
  }
  if (a3) {
    nodes.push({ id: a3.id, label: a3.name, type: "Company", x: 220, y: 380 });
    edges.push({ from: "flexprice", to: a3.id, label: "matched_to" });
  }
  comps.forEach((c, i) => {
    nodes.push({ id: c.id, label: c.name, type: "Competitor", x: i ? 120 : 300, y: i ? 330 : 220 });
    edges.push({ from: c.id, to: "flexprice", label: "competes_with" });
  });
  if (a2 && comps[1]) edges.push({ from: a2.id, to: comps[1].id, label: "evaluating" });
  return { nodes, edges, warmPath: a1 ? ["founder", "advisor", a1.id, `${a1.id}-c0`] : [] };
}
