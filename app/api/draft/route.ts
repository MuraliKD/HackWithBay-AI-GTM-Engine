// Module 4b: signal-personalized outreach (Builder) followed by an
// independent fact-check of every draft against its cited sources (Reviewer).
import { NextResponse } from "next/server";
import { cached } from "@/lib/server/cache";
import { claudeJson } from "@/lib/server/claude";
import type { Account, Contact, Draft } from "@/lib/types";

export const maxDuration = 120;

const str = { type: "string" };
const DRAFT_SCHEMA = {
  type: "object", additionalProperties: false, required: ["drafts"],
  properties: {
    drafts: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["contact_id", "variant", "subject", "body"],
        properties: { contact_id: str, variant: { type: "string", enum: ["Signal-led", "Value-led"] }, subject: str, body: str },
      },
    },
  },
};
const REVIEW_SCHEMA = {
  type: "object", additionalProperties: false, required: ["flags"],
  properties: {
    flags: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["contact_id", "issue"], properties: { contact_id: str, issue: str } },
    },
  },
};

const DRAFT_SYSTEM = `You write cold outbound email for a founder. One email per contact.
- Alternate variants: even-indexed contacts "Signal-led" (open with the account's specific trigger signal), odd-indexed "Value-led" (open with the pain and outcome).
- Under 110 words. Plain text, no links, no emojis. One clear CTA (a 20-minute call).
- Tone by persona: technical buyers get implementation specifics; economic buyers get cost and time saved.
- When you state a fact about the prospect, put its citation marker right after it, like [[1]], using the source numbers given for that account. Only state facts that the sources support.
- Sign off with the founder's first name: Krishna.`;

const REVIEW_SYSTEM = `You are a strict fact-checking reviewer. For each email, compare every claim about the prospect company against that account's sources.
Flag a draft only if it states something the sources do not support (wrong numbers, wrong funding stage, invented customers, overclaims). Quote the problem briefly and say what the source says. Return an empty list if every draft is clean.`;

export async function POST(req: Request) {
  const { contacts, accounts } = (await req.json()) as { contacts: Contact[]; accounts: Account[] };
  try {
    const input = contacts.map((c, i) => {
      const a = accounts.find((x) => x.id === c.accountId)!;
      return {
        index: i, contact_id: c.id, name: c.name, title: c.title, persona: c.persona,
        company: a.name, industry: a.industry, signal: a.signal,
        sources: a.sources.map((s) => ({ n: s.id, title: s.title, text: s.quote })),
      };
    });
    const { data, cached: hit } = await cached("draft", input, async () => {
      const product = "Flexprice: open-source usage-based billing and metering for AI and API companies (meter any event, credits and prepaid wallets, hybrid plans, invoicing).";
      const drafted = await claudeJson<{ drafts: { contact_id: string; variant: Draft["variant"]; subject: string; body: string }[] }>(
        DRAFT_SYSTEM, `Product: ${product}\n\nContacts:\n${JSON.stringify(input, null, 1)}`, DRAFT_SCHEMA,
      );
      const review = await claudeJson<{ flags: { contact_id: string; issue: string }[] }>(
        REVIEW_SYSTEM,
        JSON.stringify(drafted.drafts.map((d) => ({ ...d, sources: input.find((x) => x.contact_id === d.contact_id)?.sources ?? [] }))),
        REVIEW_SCHEMA,
      );
      const drafts: Draft[] = drafted.drafts.map((d) => ({
        id: `d-${d.contact_id}-e`, contactId: d.contact_id, channel: "Email", variant: d.variant,
        subject: d.subject, body: d.body, status: "pending",
        reviewerFlag: review.flags.find((f) => f.contact_id === d.contact_id)?.issue,
      }));
      return drafts;
    });
    return NextResponse.json({ drafts: data, cached: hit });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
