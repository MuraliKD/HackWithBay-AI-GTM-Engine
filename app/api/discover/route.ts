// Module 2: approved ICP → live web discovery (Tavily) → Claude extracts
// accounts and competitors that are explicitly named in the search results.
// Every citation is re-checked server-side against the real result text.
import { NextResponse } from "next/server";
import { cached } from "@/lib/server/cache";
import { claudeJson } from "@/lib/server/claude";
import { tavilySearch, type SearchResult } from "@/lib/server/tavily";
import type { Account, Competitor, Icp, Source } from "@/lib/types";

export const maxDuration = 120;

const str = { type: "string" };
const num = { type: "number" };
const ids = { type: "array", items: { type: "integer" } };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["accounts", "competitors"],
  properties: {
    accounts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "domain", "industry", "headcount", "hq", "signal", "fit", "source_ids", "quote", "excluded_reason"],
        properties: {
          name: str, domain: str, industry: str, headcount: str, hq: str, signal: str, fit: num,
          source_ids: ids, quote: str, excluded_reason: { type: ["string", "null"] },
        },
      },
    },
    competitors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "positioning", "pricing", "differentiator", "x", "y", "source_ids"],
        properties: {
          name: str, category: { type: "string", enum: ["Direct", "Indirect", "Alternative"] },
          positioning: str, pricing: str, differentiator: str, x: num, y: num, source_ids: ids,
        },
      },
    },
  },
};

const SYSTEM = `You are the discovery engine in a go-to-market tool. You receive an ICP and a numbered list of live web search results.
ACCOUNTS: list 10–15 prospective customer companies that are explicitly named in the results. Never invent a company or a fact.
- signal: the concrete buying trigger from the result (e.g. "Launched usage-based pricing", "Hiring billing engineer"), max 6 words.
- quote: copy a short phrase (under 25 words) VERBATIM from the cited result's text.
- source_ids: the result numbers that support it. headcount/hq: from the results, else "unknown".
- fit: 0–100 against the ICP (80+ strong, 60–79 medium, below 60 weak).
- excluded_reason: set it when a result shows a negative signal from the ICP (layoffs, hiring freeze, off-region, too small); otherwise null. Include 1–3 excluded accounts if the results support it.
- Do not list the seller itself, competitors, investors, media sites or blogs as accounts.
COMPETITORS: 4–7 vendors competing with the seller's product (Direct, Indirect, or Alternative such as building in-house), with public pricing if stated, else "Not public". Place each on x = self-serve (0) → enterprise (100), y = flat/subscription billing (0) → usage-native (100).`;

function buildQueries(icp: Icp, product: string): { accounts: string[]; competitors: string } {
  const field = (k: string) => icp.fields.find((f) => f.key === k)?.values ?? [];
  const industry = (field("industries")[2] ?? field("industries")[0] ?? "").replace(/NAICS\s*\d+\s*/i, "");
  const triggers = field("triggers").slice(0, 3);
  const accepted = icp.expansions.filter((e) => e.status === "accepted").map((e) => e.segment);
  return {
    accounts: [
      ...triggers.map((t) => `${industry} startup ${t} 2026`),
      `${industry} startup hiring billing engineer usage-based pricing`,
      ...accepted.map((s) => `${s} launches usage-based pricing`),
    ].slice(0, 6),
    competitors: `${product.split(/[.\n]/)[0]} alternatives pricing comparison`,
  };
}

function sources(idsIn: number[], results: SearchResult[], quote?: string): Source[] {
  const out: Source[] = [];
  for (const id of idsIn) {
    const r = results[id - 1];
    if (!r || out.some((s) => s.url === r.url)) continue;
    const verbatim = quote && r.content.toLowerCase().includes(quote.toLowerCase().slice(0, 60));
    out.push({ id: out.length + 1, title: r.title, url: r.url, quote: verbatim ? quote! : r.content.slice(0, 180) });
  }
  return out;
}

export async function POST(req: Request) {
  const { icp, product } = (await req.json()) as { icp: Icp; product: string };
  try {
    const { data, cached: hit } = await cached("discover", { icp, product }, async () => {
      const q = buildQueries(icp, product);
      const batches = await Promise.all([...q.accounts, q.competitors].map((query) => tavilySearch(query, 6).catch(() => [])));
      const seen = new Set<string>();
      const results = batches.flat().filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
      const list = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`).join("\n\n");
      const out = await claudeJson<{
        accounts: { name: string; domain: string; industry: string; headcount: string; hq: string; signal: string; fit: number; source_ids: number[]; quote: string; excluded_reason: string | null }[];
        competitors: { name: string; category: Competitor["category"]; positioning: string; pricing: string; differentiator: string; x: number; y: number; source_ids: number[] }[];
      }>(SYSTEM, `ICP:\n${JSON.stringify({ summary: icp.summary, fields: icp.fields })}\n\nSeller product:\n${product}\n\nSearch results:\n${list}`, SCHEMA);

      const accounts: Account[] = out.accounts.map((a, i): Account => {
        const fit = a.excluded_reason ? 0 : Math.max(0, Math.min(100, Math.round(a.fit)));
        return {
          id: `a${i + 1}`, name: a.name, domain: a.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
          industry: a.industry, headcount: a.headcount, hq: a.hq, signal: a.signal, fit,
          tier: fit >= 80 ? "A" : fit >= 60 ? "B" : "C",
          sources: sources(a.source_ids, results, a.quote),
          excluded: a.excluded_reason ?? undefined,
        };
      }).filter((a) => a.sources.length > 0)
        .sort((x, y) => (x.excluded ? 1 : 0) - (y.excluded ? 1 : 0) || y.fit - x.fit);

      const competitors: Competitor[] = out.competitors.map((c, i) => ({
        id: `k${i + 1}`, ...c, x: Math.max(0, Math.min(100, c.x)), y: Math.max(0, Math.min(100, c.y)),
        sources: sources(c.source_ids, results),
      }));
      return { accounts, competitors, queries: [...q.accounts, q.competitors], resultCount: results.length };
    });
    return NextResponse.json({ ...data, cached: hit });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
