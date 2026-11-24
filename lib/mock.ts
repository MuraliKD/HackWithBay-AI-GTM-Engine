// Golden-path mock data for the clickable prototype.
// Company and person names here are FICTIONAL placeholders. Stage 3 replaces
// them with live ICP inference (LLM) and live discovery (Tavily) results.
import type {
  Account,
  Competitor,
  Contact,
  Draft,
  GraphEdge,
  GraphNode,
  Icp,
  Source,
} from "./types";

export const PRODUCT_DESCRIPTION = `Flexprice is open-source usage-based billing and metering infrastructure for AI and API companies. Teams meter any event (tokens, API calls, GPU minutes), set up credits, prepaid wallets and hybrid plans, and invoice customers without building billing in-house.

Best customers today: AI and API-first startups, Series A to B, 20–200 people, moving from flat seats to usage or credit pricing. Typical contract $500–$5k per month.`;

const src = (id: number, title: string, url: string, quote: string): Source => ({ id, title, url, quote });

export const MOCK_ICP: Icp = {
  summary:
    "AI and API-first software companies (Series A–B, 20–200 employees) that are moving to usage, credit or hybrid pricing and lack an in-house billing team.",
  approved: false,
  fields: [
    { key: "industries", label: "Target industries", values: ["NAICS 5415 Computer systems design", "NAICS 5182 Data processing & hosting", "AI infrastructure / LLM APIs"], confidence: 0.92 },
    { key: "size", label: "Company size", values: ["20–200 employees", "$2M–$30M ARR", "Series A–B"], confidence: 0.88 },
    { key: "personas", label: "Buyer personas", values: ["CTO / VP Engineering", "Head of Finance / RevOps", "Head of Pricing / Product"], confidence: 0.81 },
    { key: "triggers", label: "Trigger events", values: ["Launched usage or credit pricing", "Hiring a billing / payments engineer", "Raised Series A or B in last 6 months", "Stripe Billing limits mentioned in docs"], confidence: 0.76 },
    { key: "geo", label: "Regions", values: ["North America", "Western Europe", "India"], confidence: 0.7 },
    { key: "negative", label: "Negative signals", values: ["Hiring freeze or layoffs", "Pure seat-based pricing with no usage component", "Under 10 employees"], confidence: 0.84 },
  ],
  expansions: [
    {
      id: "exp1",
      segment: "Vertical SaaS adding AI add-ons",
      reasoning: "Vertical SaaS vendors bolting on AI features are introducing per-generation or credit pricing alongside seats, which is the hybrid model Flexprice supports.",
      sources: [src(1, "Example: vertical SaaS pricing page", "https://example.com/pricing", "AI Assist: 500 credits included, then $0.02 per generation")],
      status: "pending",
    },
    {
      id: "exp2",
      segment: "Developer-tool companies with metered CI / compute",
      reasoning: "Dev-tool companies already meter build minutes and compute; consolidating metering and invoicing is a recurring pain in their engineering blogs.",
      sources: [src(1, "Example: engineering blog", "https://example.com/blog/billing", "We spent two quarters rebuilding our metering pipeline")],
      status: "pending",
    },
    {
      id: "exp3",
      segment: "Telecom MVNOs",
      reasoning: "Usage-heavy, but sales cycles and compliance requirements are far outside the current ICP.",
      sources: [src(1, "Example: industry report", "https://example.com/report", "MVNO billing stacks are typically procured via 12-month RFPs")],
      status: "pending",
    },
  ],
};

const acc = (
  id: string, name: string, domain: string, industry: string, headcount: string, hq: string,
  signal: string, fit: number, sources: Source[], excluded?: string,
): Account => ({
  id, name, domain, industry, headcount, hq, signal, fit,
  tier: fit >= 80 ? "A" : fit >= 60 ? "B" : "C",
  sources, excluded,
});

export const MOCK_ACCOUNTS: Account[] = [
  acc("a1", "Lumora AI", "lumora.example", "LLM inference API", "85", "San Francisco, CA", "Launched credit-based pricing (Oct)", 94, [
    src(1, "Lumora AI pricing page", "https://lumora.example/pricing", "Pay as you go: 1,000 free credits, then $0.40 per 1k tokens"),
    src(2, "Lumora AI careers", "https://lumora.example/careers/billing", "Senior Engineer, Billing & Metering"),
  ]),
  acc("a2", "Vectorly", "vectorly.example", "Vector database (managed)", "120", "New York, NY", "Hiring billing engineer", 91, [
    src(1, "Vectorly careers", "https://vectorly.example/jobs/42", "Own our usage metering and invoicing pipeline"),
    src(2, "Press: Vectorly Series B", "https://news.example/vectorly-series-b", "Vectorly raises $28M Series B"),
  ]),
  acc("a3", "Speakwise", "speakwise.example", "Voice AI API", "60", "Austin, TX", "Raised Series A ($14M)", 88, [
    src(1, "Press: Speakwise Series A", "https://news.example/speakwise", "Speakwise closes $14M Series A to scale its voice API"),
  ]),
  acc("a4", "Graphwell", "graphwell.example", "Data pipeline platform", "140", "London, UK", "Moving seats → usage (docs)", 85, [
    src(1, "Graphwell docs: billing", "https://graphwell.example/docs/billing", "From Jan 1, plans are priced per processed row"),
  ]),
  acc("a5", "Promptbase Labs", "promptbase.example", "AI agent platform", "45", "Toronto, ON", "Stripe Billing limits in changelog", 83, [
    src(1, "Promptbase changelog", "https://promptbase.example/changelog", "Temporarily pausing overage invoices while we migrate billing"),
  ]),
  acc("a6", "Kitestack", "kitestack.example", "GPU cloud", "190", "Bengaluru, IN", "New GPU-minute pricing", 81, [
    src(1, "Kitestack pricing", "https://kitestack.example/pricing", "Billed per GPU-minute, prepaid wallets available"),
  ]),
  acc("a7", "Docuflow", "docuflow.example", "Document AI API", "70", "Seattle, WA", "Raised seed extension", 74, [
    src(1, "Press: Docuflow", "https://news.example/docuflow", "Docuflow adds $6M to seed round"),
  ]),
  acc("a8", "Relaymail", "relaymail.example", "Email API", "110", "Berlin, DE", "Per-message pricing", 69, [
    src(1, "Relaymail pricing", "https://relaymail.example/pricing", "$0.0008 per message after 50k"),
  ]),
  acc("a9", "Tabular AI", "tabular.example", "Spreadsheet AI copilot", "35", "Boston, MA", "Added AI credits to seats", 66, [
    src(1, "Tabular pricing", "https://tabular.example/pricing", "Pro: $20/seat + 200 AI credits"),
  ]),
  acc("a10", "Mapline", "mapline.example", "Geospatial API", "55", "Denver, CO", "Usage tiers on pricing page", 62, [
    src(1, "Mapline pricing", "https://mapline.example/pricing", "First 100k requests free"),
  ]),
  acc("a11", "Codeharbor", "codeharbor.example", "CI / build platform", "90", "Amsterdam, NL", "Metered build minutes", 58, [
    src(1, "Codeharbor pricing", "https://codeharbor.example/pricing", "$0.006 per build minute"),
  ]),
  acc("a12", "Formsy", "formsy.example", "Form builder", "25", "Austin, TX", "Seat pricing only", 44, [
    src(1, "Formsy pricing", "https://formsy.example/pricing", "$15 per user per month"),
  ]),
  acc("a13", "Nimbus Notes", "nimbus.example", "Productivity app", "18", "Portland, OR", "No usage component", 38, [
    src(1, "Nimbus pricing", "https://nimbus.example/pricing", "One plan, $8 per user"),
  ]),
  acc("a14", "Orbitly", "orbitly.example", "Observability API", "160", "Chicago, IL", "Per-GB ingest pricing", 0, [
    src(1, "Press: Orbitly", "https://news.example/orbitly-layoffs", "Orbitly cuts 30% of staff, pauses hiring"),
  ], "Hiring freeze and layoffs"),
  acc("a15", "Sensora", "sensora.example", "IoT data API", "75", "São Paulo, BR", "Per-device pricing", 0, [
    src(1, "Sensora about", "https://sensora.example/about", "Serving customers across Latin America"),
  ], "Non-target region"),
];

const FIRST = ["Maya", "Arjun", "Elena", "Sam", "Priya", "Jonas", "Lena", "Marcus", "Aisha", "Tom", "Wei", "Sofia", "Diego", "Hannah", "Ravi", "Chloe", "Noah", "Isha", "Leo", "Nora", "Omar", "Grace", "Ken", "Zara", "Ben", "Mia"];
const LAST = ["Chen", "Patel", "Rossi", "Okafor", "Iyer", "Berg", "Fischer", "Reyes", "Khan", "Walsh", "Zhang", "Moreau", "Silva", "Novak", "Menon", "Dubois", "Kim", "Rao", "Costa", "Lind", "Haddad", "Park", "Sato", "Ali", "Cohen", "Lopez"];

export const MOCK_CONTACTS: Contact[] = MOCK_ACCOUNTS.filter((a) => !a.excluded).flatMap((a, i) => {
  const base = i * 2;
  const mk = (k: number, title: string, persona: string): Contact => {
    const first = FIRST[(base + k) % FIRST.length];
    const last = LAST[(base + k * 7) % LAST.length];
    return {
      id: `${a.id}-c${k}`,
      accountId: a.id,
      name: `${first} ${last}`,
      title,
      persona,
      emailStatus: "none",
      enriched: false,
      email: `${first.toLowerCase()}@${a.domain}`,
      linkedin: `linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}`,
    };
  };
  return [mk(0, i % 2 ? "VP Engineering" : "CTO", "Technical buyer"), mk(1, i % 3 ? "Head of Finance" : "Head of Pricing", "Economic buyer")];
});

export const MOCK_COMPETITORS: Competitor[] = [
  { id: "k1", name: "Orb", category: "Direct", positioning: "Usage-based billing for modern SaaS", pricing: "Custom; platform fee + % of billings", differentiator: "Mature SQL-based metrics", x: 72, y: 88, sources: [src(1, "Orb pricing", "https://www.withorb.com/pricing", "Contact sales")] },
  { id: "k2", name: "Metronome", category: "Direct", positioning: "Usage billing for AI and infra at scale", pricing: "Enterprise contracts", differentiator: "Large-enterprise deployments", x: 90, y: 92, sources: [src(1, "Metronome", "https://metronome.com", "Usage-based billing platform")] },
  { id: "k3", name: "Lago", category: "Direct", positioning: "Open-source metering and billing", pricing: "Free OSS; paid cloud tiers", differentiator: "Open source, self-host", x: 35, y: 80, sources: [src(1, "Lago pricing", "https://www.getlago.com/pricing", "Open source, free forever")] },
  { id: "k4", name: "Stripe Billing", category: "Indirect", positioning: "Billing inside the payments stack", pricing: "0.7% of billing volume", differentiator: "Bundled with Stripe payments", x: 40, y: 45, sources: [src(1, "Stripe Billing pricing", "https://stripe.com/billing/pricing", "0.7% of billing volume")] },
  { id: "k5", name: "Chargebee", category: "Indirect", positioning: "Subscription management", pricing: "Tiered by billing volume", differentiator: "Subscription workflows, RevOps", x: 60, y: 30, sources: [src(1, "Chargebee pricing", "https://www.chargebee.com/pricing", "Plans by billing volume")] },
  { id: "k6", name: "In-house build", category: "Alternative", positioning: "Engineers build metering + invoicing", pricing: "1–3 engineers ongoing", differentiator: "Full control, high maintenance", x: 20, y: 60, sources: [src(1, "Example: engineering blog", "https://example.com/blog/billing", "Two quarters rebuilding metering")] },
];

// Fixed layout for the knowledge-graph view. Warm intro: Founder → Advisor
// (previously_employed_at Lumora AI) → Lumora AI ← works_at ← CTO.
export const MOCK_GRAPH: { nodes: GraphNode[]; edges: GraphEdge[]; warmPath: string[] } = {
  nodes: [
    { id: "flexprice", label: "Flexprice", type: "Product", x: 90, y: 230 },
    { id: "founder", label: "You (Founder)", type: "Person", x: 90, y: 80 },
    { id: "advisor", label: "Advisor: R. Menon", type: "Person", x: 290, y: 60 },
    { id: "a1", label: "Lumora AI", type: "Company", x: 500, y: 110 },
    { id: "a1-c0", label: "CTO, Lumora", type: "Person", x: 700, y: 60 },
    { id: "a1-c1", label: "Head of Finance, Lumora", type: "Person", x: 720, y: 170 },
    { id: "sig1", label: "Launched credit pricing", type: "Signal", x: 520, y: 250 },
    { id: "a2", label: "Vectorly", type: "Company", x: 380, y: 330 },
    { id: "sig2", label: "Hiring billing engineer", type: "Signal", x: 590, y: 360 },
    { id: "a3", label: "Speakwise", type: "Company", x: 220, y: 380 },
    { id: "k1", label: "Orb", type: "Competitor", x: 300, y: 220 },
    { id: "k4", label: "Stripe Billing", type: "Competitor", x: 120, y: 330 },
  ],
  edges: [
    { from: "founder", to: "advisor", label: "knows" },
    { from: "advisor", to: "a1", label: "previously_employed_at" },
    { from: "a1-c0", to: "a1", label: "works_at" },
    { from: "a1-c1", to: "a1", label: "works_at" },
    { from: "sig1", to: "a1", label: "signal_of" },
    { from: "flexprice", to: "a1", label: "matched_to" },
    { from: "flexprice", to: "a2", label: "matched_to" },
    { from: "flexprice", to: "a3", label: "matched_to" },
    { from: "sig2", to: "a2", label: "signal_of" },
    { from: "k1", to: "flexprice", label: "competes_with" },
    { from: "k4", to: "flexprice", label: "competes_with" },
    { from: "a2", to: "k4", label: "uses" },
  ],
  warmPath: ["founder", "advisor", "a1", "a1-c0"],
};

export function mockDraftsFor(contacts: Contact[], accounts: Account[]): Draft[] {
  return contacts.flatMap((c, i) => {
    const a = accounts.find((x) => x.id === c.accountId)!;
    const first = c.name.split(" ")[0];
    const signalLed = i % 2 === 0;
    const email: Draft = {
      id: `d-${c.id}-e`,
      contactId: c.id,
      channel: "Email",
      variant: signalLed ? "Signal-led" : "Value-led",
      subject: signalLed ? `${a.signal.split("(")[0].trim()} at ${a.name}` : `Ship usage pricing without a billing team`,
      body: signalLed
        ? `Hi ${first},\n\nSaw that ${a.name} ${a.signal.charAt(0).toLowerCase() + a.signal.slice(1)} [[1]]. Most teams at your stage end up with an engineer owning metering and invoices for a year.\n\nFlexprice meters any event (tokens, API calls, GPU minutes) and handles credits, wallets and invoicing out of the box, open source.\n\nWorth a 20-minute look next week?\n\nKrishna`
        : `Hi ${first},\n\nTeams like ${a.name} usually hit the limits of seat-based billing once usage takes off [[1]].\n\nFlexprice gives you metering, credits and hybrid plans in days instead of quarters, and it's open source.\n\nOpen to a quick call?\n\nKrishna`,
      status: "pending",
    };
    return [email];
  }).map((d, i) =>
    i === 4
      ? { ...d, body: d.body.replace("Saw that", "Congrats on the Series B, and saw that"), reviewerFlag: "Claims a Series B round, but none of the cited sources mention one. Please verify before approving." }
      : d,
  );
}
