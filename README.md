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
| UI for all 5 modules | Done |
| ICP inference (M1) | **Live**: Claude (`claude-opus-5-5`, structured output) + Tavily evidence for expansion segments |
| Discovery + competitors (M2) | **Live**: Tavily search → Claude extraction; every citation re-checked against the source text server-side |
| Knowledge graph (M3) | Built from live accounts/competitors; the founder→advisor link is demo data (would come from a network import) |
| Enrichment, drafting, sending (M4) | Mock (in progress) |
| Pipeline (M5) | Live in-app state; reply detection simulated |

If a key is missing or a live call fails, the app falls back to the cached demo data (fictional companies) and says so in the Agent Thinking panel. The top-bar badges show which modules ran live. Live results are cached in `.cache/` so a recorded demo replays the same run instantly; delete that folder for a fresh run.

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
