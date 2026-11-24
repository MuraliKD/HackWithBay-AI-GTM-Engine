// Module 1: plain-language product brief → structured ICP with field-level
// confidence, plus evidence-backed expansion segments (Tavily citations).
import { NextResponse } from "next/server";
import { cached } from "@/lib/server/cache";
import { claudeJson } from "@/lib/server/claude";
import { tavilySearch } from "@/lib/server/tavily";
import type { Icp } from "@/lib/types";

export const maxDuration = 60;

const str = { type: "string" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "fields", "expansions"],
  properties: {
    summary: str,
    fields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "values", "confidence"],
        properties: { key: str, label: str, values: { type: "array", items: str }, confidence: { type: "number" } },
      },
    },
    expansions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["segment", "reasoning", "search_query"],
        properties: { segment: str, reasoning: str, search_query: str },
      },
    },
  },
};

const SYSTEM = `You are the ICP engine inside a go-to-market tool. From a founder's product brief, infer a structured Ideal Customer Profile.
Return exactly these six fields, in order, with these keys and labels:
industries "Target industries" (include NAICS codes), size "Company size" (headcount tier, revenue band, stage), personas "Buyer personas" (functional titles + seniority), triggers "Trigger events" (observable public signals such as pricing changes, job posts, funding, exec hires), geo "Regions", negative "Negative signals" (reasons to exclude an account).
Each field has 2–4 short values and a confidence from 0.00 to 1.00: high when the brief states it, lower when you inferred it.
Also propose exactly 3 expansion segments: two credible adjacent segments and one tempting but poor fit (say why in the reasoning). Each has a web search query that would find public evidence for it.
summary: one sentence describing the ICP.`;

export async function POST(req: Request) {
  const { product } = (await req.json()) as { product: string };
  try {
    const { data, cached: hit } = await cached("icp", product, async () => {
      const out = await claudeJson<{ summary: string; fields: Icp["fields"]; expansions: { segment: string; reasoning: string; search_query: string }[] }>(
        SYSTEM, product, SCHEMA,
      );
      const expansions = await Promise.all(out.expansions.map(async (e, i) => {
        const results = await tavilySearch(e.search_query, 2).catch(() => []);
        return {
          id: `exp${i + 1}`, segment: e.segment, reasoning: e.reasoning, status: "pending" as const,
          sources: results.map((r, j) => ({ id: j + 1, title: r.title, url: r.url, quote: r.content.slice(0, 180) })),
        };
      }));
      const icp: Icp = {
        summary: out.summary,
        approved: false,
        fields: out.fields.map((f) => ({ ...f, confidence: Math.max(0, Math.min(1, Math.round(f.confidence * 100) / 100)) })),
        expansions,
      };
      return icp;
    });
    return NextResponse.json({ icp: data, cached: hit });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
