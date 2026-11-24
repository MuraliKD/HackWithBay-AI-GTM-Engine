"use client";
import { useStore } from "@/lib/store";
import { Empty, PageHeader, SourceChip } from "../ui";

const CAT_COLOR = { Direct: "#d9480f", Indirect: "#4c5fd5", Alternative: "#7a7680" } as const;

export function CompetitorsView() {
  const s = useStore();
  if (!s.competitors.length) return <Empty text="Competitors are mapped during discovery." />;
  return (
    <div>
      <PageHeader kicker="Module 2 · Competitive landscape" title="Where Flexprice wins" lede="Direct, indirect and alternative competitors, positioned by buyer and by billing model, with public pricing." />
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-line bg-panel p-4">
          <svg viewBox="0 0 400 320" className="w-full">
            <line x1="40" y1="290" x2="390" y2="290" stroke="#e6e2d9" />
            <line x1="40" y1="10" x2="40" y2="290" stroke="#e6e2d9" />
            <line x1="215" y1="10" x2="215" y2="290" stroke="#e6e2d9" strokeDasharray="3 3" />
            <line x1="40" y1="150" x2="390" y2="150" stroke="#e6e2d9" strokeDasharray="3 3" />
            <text x="215" y="310" textAnchor="middle" fontSize="10.5" fill="#6b6870">Self-serve → Enterprise</text>
            <text x="14" y="150" textAnchor="middle" fontSize="10.5" fill="#6b6870" transform="rotate(-90 14 150)">Flat → Usage-native</text>
            {s.competitors.map((c) => {
              const x = 40 + (c.x / 100) * 350, y = 290 - (c.y / 100) * 280;
              return (
                <g key={c.id}>
                  <circle cx={x} cy={y} r="6" fill={CAT_COLOR[c.category]} />
                  <text x={x + 9} y={y + 4} fontSize="11.5" fill="#17161a">{c.name}</text>
                </g>
              );
            })}
            <g>
              <circle cx={40 + 0.3 * 350} cy={290 - 0.9 * 280} r="8" fill="none" stroke="#17161a" strokeWidth="2" />
              <text x={40 + 0.3 * 350 + 11} y={290 - 0.9 * 280 + 4} fontSize="12" fontWeight="600" fill="#17161a">Flexprice</text>
            </g>
          </svg>
          <div className="mt-2 flex gap-4 text-[11.5px] text-muted">
            {Object.entries(CAT_COLOR).map(([k, v]) => <span key={k} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: v }} />{k}</span>)}
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-line bg-panel">
          <table className="grid-dense w-full text-[13px]">
            <thead><tr className="text-left"><th>Competitor</th><th>Type</th><th>Positioning</th><th>Public pricing</th><th>Their edge</th><th>Src</th></tr></thead>
            <tbody>
              {s.competitors.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td><span className="text-[12px]" style={{ color: CAT_COLOR[c.category] }}>{c.category}</span></td>
                  <td className="whitespace-normal">{c.positioning}</td>
                  <td className="whitespace-normal">{c.pricing}</td>
                  <td className="whitespace-normal text-muted">{c.differentiator}</td>
                  <td>{c.sources.map((src) => <SourceChip key={src.id} source={src} />)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
