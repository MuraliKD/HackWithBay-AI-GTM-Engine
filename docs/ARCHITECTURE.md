# 4WeekStartup GTM: system design

One closed loop from a plain-language product description to a tracked pipeline, with a human approving every outbound message.

```
 Founder ──► [M1 Intake & ICP] ──► [M2 Discovery] ──► [M3 Graph] ──► [M4 Enrich ─► Draft ─► Review ─► HITL gate] ──► [M5 Pipeline]
                 Claude              Tavily + Claude     in-app graph     Hunter      Claude    Claude      human          Kanban + audit
                    │                     │                                  │           │         │
                    └──────────── every metered step ──► Flexprice events + in-app credit gate ◄──┘
                                  every step ──► Agent Thinking rail (Planner · Builder · Reviewer · Security)
```

## Stack

| Tier | Choice | Where |
| --- | --- | --- |
| Frontend | Next.js 15 (App Router), React 19, Tailwind 4 | `app/`, `components/` |
| Reasoning | Claude (`claude-opus-5-5`), structured JSON output, low effort for latency | `lib/server/claude.ts` |
| Discovery | Tavily search API | `lib/server/tavily.ts` |
| Enrichment | Hunter.io domain search | `app/api/enrich` |
| Billing | Flexprice usage events | `app/api/meter` |
| State | Client store (React context); server routes are stateless | `lib/store.tsx` |
| Replay cache | Content-hashed JSON files (`.cache/`) | `lib/server/cache.ts` |

## Modules and reasoning loops

**M1 Product intake & ICP** (`POST /api/icp`). One Claude call turns the brief into six fixed fields (industries with NAICS, size, personas, triggers, regions, negative signals), each with a 0.00–1.00 confidence: high when stated in the brief, lower when inferred. It also proposes three expansion segments (two adjacent, one deliberately poor fit), each with a search query. Tavily runs those queries so each suggestion carries evidence. The founder accepts or dismisses each one.

**M2 Discovery** (`POST /api/discover`).
1. Queries are built from the approved ICP: industry × top trigger events, a hiring-signal query, plus one per accepted expansion segment, and a competitor query.
2. Tavily runs them in parallel; results are de-duplicated by URL and numbered.
3. Claude extracts accounts that are *explicitly named in the results* and competitors, citing result numbers, with a verbatim quote, a 0–100 fit score and an exclusion reason when a negative signal appears.
4. **Anti-hallucination check (server-side):** each cited number must map to a real result; the quote must appear in that result's text (otherwise the real snippet is shown instead); accounts left with no valid source are dropped. Tier A ≥ 80, B 60–79, C < 60.

**M3 Knowledge graph.** Ontology: nodes `Company`, `Person`, `Product`, `Competitor`, `Signal`; edges `works_at`, `previously_employed_at`, `competes_with`, `matched_to`, `signal_of`, `contacted_via`, `replied_to`. The graph is assembled from discovery output (`lib/graph.ts`). Warm-intro reasoning is a shortest-path query from the founder to a Tier A buyer:

```cypher
MATCH p = shortestPath((me:Person {id:'founder'})-[*..4]-(buyer:Person)-[:works_at]->(c:Company))
WHERE c.tier = 'A'
RETURN p ORDER BY length(p) LIMIT 5
```

In this prototype the graph lives in memory, and the founder's own network (the advisor edge) is demo data. The production path is Neo4j or Kùzu with a LinkedIn/CRM network import feeding `previously_employed_at`.

**M4 Enrichment & outreach.**
- `POST /api/enrich`: Hunter domain search per account; picks the highest-confidence technical buyer (CTO / engineering) and economic buyer (finance / revenue / CEO). Verification maps to `verified` (MX valid), `risky` (catch-all) or `invalid`.
- `POST /api/draft`: **Builder** pass writes one email per contact, alternating Signal-led and Value-led variants, persona-specific tone, citation markers `[[n]]` after every prospect fact. **Reviewer** pass is a separate Claude call that checks every claim against that account's sources and returns flags.
- **HITL gate:** drafts start `pending`; Send stays locked until a human approves. Reps can approve, edit or reject; flagged drafts are excluded from bulk approve.

**M5 Pipeline.** Kanban `Matched → Contacted → Replied → Meeting Booked → Closed/Lost`. Sends move cards automatically (`AI`); drags are attributed to `Rep`. Every action is written to an audit log with a timestamp. Analytics: stage-to-stage conversion and reply rate by message variant.

## Bonus integrations

- **Multi-agent (Band-style roles):** Planner (plans and hands off), Builder (API calls, graph writes, drafting), Reviewer (citation validation, fact-check, @mentions the founder), Security (credit gate, outbound content scan). Their steps stream into the Agent Thinking rail.
- **Flexprice:** metered events `icp_inference`, `discovery_search`, `lead_enriched`, `outreach_sent`, `graph_query` are forwarded to Flexprice `/events` with the customer ID. Credits are enforced before high-cost enrichment runs, and the gate blocks a run that would overdraw the balance.

## Reliability for the live demo

Every live route falls back to bundled demo data (clearly fictional companies) if a key is missing or a call fails, and the Agent Thinking rail says so. Top-bar badges show which modules ran live. Successful live results are cached by input hash, so a rehearsed run replays instantly.
