// Module 4a: contact enrichment via Hunter.io domain search. Picks one
// technical and one economic buyer per account, with verification status.
import { NextResponse } from "next/server";
import { cached } from "@/lib/server/cache";

export const maxDuration = 60;

interface HunterEmail {
  value: string; first_name: string | null; last_name: string | null; position: string | null;
  linkedin: string | null; confidence: number; verification?: { status: string | null } | null;
}

const TECH = /(cto|chief technology|engineering|technology|technical|platform|infrastructure)/i;
const ECON = /(cfo|finance|revenue|pricing|billing|monetization|coo|operations|ceo|founder)/i;

function pick(emails: HunterEmail[], re: RegExp, not?: string) {
  return emails.filter((e) => e.value !== not && e.first_name && re.test(e.position ?? "")).sort((a, b) => b.confidence - a.confidence)[0];
}

function toContact(e: HunterEmail | undefined) {
  if (!e) return null;
  const v = e.verification?.status;
  const status = v === "valid" || (!v && e.confidence >= 90) ? "verified" : v === "invalid" ? "invalid" : "risky";
  return {
    name: [e.first_name, e.last_name].filter(Boolean).join(" "),
    title: e.position ?? "",
    email: e.value,
    emailStatus: status,
    linkedin: e.linkedin ? e.linkedin.replace(/^https?:\/\/(www\.)?/, "") : undefined,
  };
}

export async function POST(req: Request) {
  const { domains } = (await req.json()) as { domains: { accountId: string; domain: string }[] };
  const key = process.env.HUNTER_API_KEY;
  if (!key) return NextResponse.json({ error: "HUNTER_API_KEY missing" }, { status: 500 });
  const out = await Promise.all(domains.map(async ({ accountId, domain }) => {
    try {
      const { data } = await cached("hunter", domain, async () => {
        const res = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${key}`);
        if (!res.ok) throw new Error(`Hunter ${res.status}`);
        return ((await res.json()) as { data: { emails: HunterEmail[] } }).data.emails ?? [];
      });
      const tech = pick(data, TECH);
      const econ = pick(data, ECON, tech?.value);
      return { accountId, technical: toContact(tech), economic: toContact(econ) };
    } catch (e) {
      return { accountId, technical: null, economic: null, error: (e as Error).message };
    }
  }));
  return NextResponse.json({ results: out });
}
