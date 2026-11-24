"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import type { GraphNode } from "@/lib/types";
import { Btn, Empty, PageHeader } from "../ui";

const TYPE_STYLE: Record<GraphNode["type"], { fill: string; r: number }> = {
  Product: { fill: "#17161a", r: 16 },
  Company: { fill: "#1f7a4d", r: 14 },
  Person: { fill: "#4c5fd5", r: 10 },
  Competitor: { fill: "#d9480f", r: 12 },
  Signal: { fill: "#b7791f", r: 8 },
};

export function GraphView() {
  const s = useStore();
  const [showPath, setShowPath] = useState(true);
  if (!s.accounts.length) return <Empty text="The graph is built during discovery." />;
  const { nodes, edges, warmPath } = s.graph;
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const onPath = (a: string, b: string) => {
    const i = warmPath.indexOf(a), j = warmPath.indexOf(b);
    return showPath && i >= 0 && j >= 0 && Math.abs(i - j) === 1;
  };
  return (
    <div>
      <PageHeader
        kicker="Module 3 · Knowledge graph"
        title="A warm path into Lumora AI"
        lede="Companies, people, products, competitors and signals in one graph. Multi-hop queries find introductions a spreadsheet can't."
        right={
          <>
            <Btn variant="outline" onClick={() => setShowPath((p) => !p)}>{showPath ? "Hide" : "Show"} warm-intro path</Btn>
            <Btn onClick={() => s.setView("outreach")}>Enrich contacts <ArrowRight size={14} /></Btn>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-line bg-panel p-3">
          <svg viewBox="0 0 820 430" className="w-full">
            {edges.map((e, i) => {
              const a = pos[e.from], b = pos[e.to];
              const hot = onPath(e.from, e.to);
              return (
                <g key={i}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot ? "#d9480f" : "#d8d3c8"} strokeWidth={hot ? 2.5 : 1.2} className={hot ? "warm-edge" : ""} />
                  <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontSize="9.5" fill={hot ? "#d9480f" : "#9a96a0"} fontFamily="var(--font-jbmono)">{e.label}</text>
                </g>
              );
            })}
            {nodes.map((n) => {
              const st = TYPE_STYLE[n.type];
              const hot = showPath && warmPath.includes(n.id);
              return (
                <g key={n.id}>
                  {hot && <circle cx={n.x} cy={n.y} r={st.r + 5} fill="none" stroke="#d9480f" strokeWidth="2" />}
                  <circle cx={n.x} cy={n.y} r={st.r} fill={st.fill} />
                  <text x={n.x} y={n.y + st.r + 13} textAnchor="middle" fontSize="11" fill="#17161a">{n.label}</text>
                </g>
              );
            })}
          </svg>
          <div className="mt-1 flex flex-wrap gap-4 px-2 text-[11.5px] text-muted">
            {Object.entries(TYPE_STYLE).map(([k, v]) => <span key={k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: v.fill }} />{k}</span>)}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-accent bg-accent-soft p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">Warm intro found · 3 hops</div>
            <ol className="mt-2 space-y-1 text-[13px]">
              <li>You → <b>R. Menon</b> (advisor)</li>
              <li>R. Menon → <span className="num text-[11.5px]">previously_employed_at</span> → <b>Lumora AI</b></li>
              <li>Lumora AI ← <span className="num text-[11.5px]">works_at</span> ← <b>CTO</b></li>
            </ol>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Query</div>
            <pre className="num mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-ink/80">{`MATCH p = shortestPath(
  (me:Person {id:'founder'})-[*..4]-
  (buyer:Person)-[:works_at]->(c:Company)
)
WHERE c.tier = 'A'
RETURN p ORDER BY length(p) LIMIT 5`}</pre>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4 text-[12.5px] text-muted">
            <b className="text-ink">Displacement watch:</b> Vectorly uses Stripe Billing and is hiring a billing engineer, a likely switch window.
          </div>
        </div>
      </div>
    </div>
  );
}
