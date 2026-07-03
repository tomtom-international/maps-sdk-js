# TomTom Maps SDK Agent Toolkit — Site Selection Agent

A conversational **site-selection co-pilot** built on the TomTom Maps SDK Agent Toolkit plugin. It helps decide where to open, relocate, or close a physical retail/service location, drawing every analysis straight onto a live map and into rich side panels. It pairs bespoke domain tools (profile, rank, whitespace, cannibalization, report) with the toolkit's generic map/data/sandbox tools, a per-turn intent classifier, and a scoped system prompt.

## Setup

1. Create a `.env` in the `examples/` directory (copy from `.env.example`) and set your TomTom key:
   ```
   API_KEY_EXAMPLES=your_tomtom_api_key
   ```
2. Set your Azure OpenAI credentials in the same file:
   ```
   AZURE_RESOURCE_NAME=your-resource
   AZURE_API_KEY=your-azure-api-key
   AZURE_DEPLOYMENT_ID=gpt-4o
   ```
   (Or a comma-separated picker, which takes precedence: `AZURE_MODEL_IDS=gpt-4o,gpt-4o-mini`.)
3. Install and run:
   ```bash
   pnpm install
   pnpm develop
   # → http://localhost:5173/
   ```

## What it can do

- **Profile a site** — "Profile Marnixstraat 250 for a coffee shop" → catchment, competitors, parking, area make-up.
- **Rank a shortlist** — "Rank these three addresses for a gym, weight competition highest" → a glass-box 4-factor score.
- **Find whitespace** — "Where in De Pijp is there demand but no gym within a 10-minute walk?"
- **Check cannibalization** — "Would a store at Damrak 70 overlap my existing branches?"
- **Compile a report** — assembles the analyses into a styled HTML report.

### Flexible, state-driven, and bring-your-own-data

The agent is not limited to fixed parameters or TomTom data:

- **Session preferences** — catchment size, travel mode, scoring weights, and demand anchors live in shared agent state. Say "from now on use a 12-minute drive" or "always weight competition highest" and later analyses inherit it (`updateSitePreferences`); any single request can still override.
- **Bring-your-own-data (BYOD)** — load your own GeoJSON layer by URL (`addByodSource`; this demo accepts any http(s) URL — a production app can restrict hosts via `MapAgentOptions.byod.validateSourceUrl`), then feed it into the analyses:
  - rank the **features of a BYOD layer** as candidate sites (points as-is, polygons/lines by centroid),
  - score the **Spend-power factor** from a BYOD demand/demographics layer,
  - scan whitespace against **your own demand points**,
  - check cannibalization against **your own store network**.
- **Escape hatch** — the toolkit's generic sandbox tools (`analyseData`, `processData`, `recallState`) are available for ad-hoc analysis over loaded data and for authoring derived/agent-generated layers the fixed tools don't cover.

## How it works

- **TomTom Maps SDK** renders the map and its layers (places, ranges, geometries, custom GeoJSON, …).
- **TomTom Services SDK** powers geocoding, search, routing/isochrones, and area analytics.
- **Agent Toolkit** exposes those as tools over a shared `ToolState` (extended here with a `siteSelection` preferences slice and BYOD layers), with a per-turn intent classifier choosing which tools are active.
- **Vercel AI SDK + Azure OpenAI** drive the multi-step, tool-calling conversation.

The headless agent configuration lives in `src/agent/site-agent.ts` — the single source of truth shared by the React app and the tool-selection scenario tests.
