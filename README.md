# 4WeekStartup GTM

Describe your product in a paragraph. The engine finds who should buy it, proves why with sources, and books the meeting, with you approving every word.

Built for HackWithBay: an AI GTM engine covering five modules:

1. **Product intake & ICP**: plain-language intake, structured ICP with field-level confidence (0.00–1.00), expansion segments you accept or dismiss.
2. **Buyer & competitor discovery**: accounts with mandatory inline source citations, negative-signal filtering, competitor positioning map.
3. **Knowledge graph**: Company / Person / Product / Competitor / Signal nodes; multi-hop warm-intro paths.
4. **Enrichment & outreach**: verified email + LinkedIn, signal-personalized drafts, mandatory human-in-the-loop approval gate.
5. **Pipeline dashboard**: Kanban (Matched → Contacted → Replied → Meeting Booked → Closed/Lost), AI vs rep attribution, audit log, variant analytics.

Bonus: Band-style multi-agent rail (Planner, Builder, Reviewer, Security) and Flexprice usage metering with a credit gate.

## Status

| Piece | State |
| --- | --- |
| UI for all 5 modules | Done (clickable prototype) |
| ICP inference, discovery, enrichment, drafting | **Mock data** (`lib/mock.ts`, fictional companies) — being replaced with live APIs |

## Run locally

```bash
npm install
cp .env.example .env.local   # add keys (optional for the mock prototype)
npm run dev                  # http://localhost:3000
```

Demo path: **Infer my ICP → Accept/Dismiss expansions → Approve & run discovery → Open graph → Enrich Tier A → Enrich Tier B & C (credit gate) → Compose outreach → fix flagged draft → Approve all unflagged → Send → Check inbox → drag a card to Meeting Booked.** The reset icon in the top bar restarts the demo.

## Structure

- `lib/store.tsx`: pipeline state and engine actions (simulated; each becomes an `/api` call)
- `lib/mock.ts`: golden-path mock data
- `components/views/*`: one screen per pipeline step
- `components/AgentRail.tsx`: Agent Thinking panel + Flexprice usage ledger
