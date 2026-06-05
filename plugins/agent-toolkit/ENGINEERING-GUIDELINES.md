# Agent Toolkit Engineering Guidelines

Standards for building and extending the TomTom Maps SDK agent plugin — a headless agent between a language model, a live `TomTomMap`, TomTom services, and MapLibre state.

The main goal is reliability, achieved through composable workflows, ergonomic tool contracts, and strict state management. Treat the model as capable but lossy: it follows clear contracts well and misuses vague interfaces.

This plugin is an agent-building substrate. Capabilities should be easy to discover, compose, inspect, and predict. The bar is not just "can a single agent use this tool" but "can another agent discover it, compose it into a workflow, and recover when part fails."

## User Profiles

Tools are designed for two end-user personas. Every tool contract should make sense from their perspective.

### End-users

**Navigator** — planning trips. Resolve places, set waypoints, calculate routes, ask follow-ups, adjust. Typical prompts: "route from Amsterdam to Utrecht", "add a stop at a gas station", "are there tolls?", "how long is the route?". Workflow: resolve → plan → display → question → adjust.

**Analyst** — investigating spatial data. Search and fetch data, visualize on the map, inspect results, draw conclusions — sometimes mixing with 3rd party data sources. Typical prompts: "show EV charging stations near the highway", "what traffic incidents are on this route?", "compare the two routes". Workflow: search → visualize → inspect → conclude.

## 1. Design Tools for Agent Tasks, Not SDK Parity

Tool boundaries should follow user-task semantics, not backend families. Do not wrap every SDK/MapLibre primitive. A model is more reliable choosing between task-oriented tools than assembling everything from primitives.

- Prefer a location-focus workflow over raw camera primitives.
- Prefer route workflows that preserve summaries, indexes, and waypoints in state.

## 2. Tool Descriptions: Minimal and Precise

Every word in a tool description must fight for its spot. Descriptions are operational contracts — not documentation, not tutorials.

**What to include (only when relevant to the tool):**
- Coordinate order: `[longitude, latitude]`; bbox: `[minLng, minLat, maxLng, maxLat]`
- Whether the tool reads state vs. requires fresh input
- Whether it mutates the map, fetches data, or only inspects
- What the summarized output contains
- Terminal conditions: what success/failure look like, when not to retry
- What happens on empty results and what the next valid action is

**What to cut ruthlessly:**
- Anything derivable from the schema itself
- Redundant restatements of parameter names/types
- Generic advice ("this tool is useful for...")
- Verbose error descriptions — prefer `"status": "not_found"` over prose

**Parameter design:**
- Precise names: `routeIndex`, `placeQuery`, `styleId` — not `index`, `query`, `style`
- Enums over free-form strings when values are known
- Sensible defaults, documented
- Encode format expectations in the schema (ISO 8601, GeoJSON order, units)

**Avoid overlapping descriptions.** When two tools could handle the same request, the model will misroute. First consider whether they should be merged or one removed. If both must exist, state what each does that the other does not.

## 3. Use Stable, Meaningful References

Prefer `routeIndex`, waypoint indexes, semantic layer names, human-readable style IDs over opaque identifiers. The plugin spans service history, rendered state, and MapLibre layers — cryptic references cause confusion.

**Entry IDs are the cross-tool currency.** Every entry-owning slice (`places`, `routing`, `ranges`, `customGeometries`, `byod`, `trafficAreaAnalytics`, `trafficIncidents`) issues stable, prefixed ids like `places-3`, `routes-1`, `byod-0`. Every recall / display / `analyseData` / `processData` tool accepts those ids via the matching `*EntryIDs` field. New entry-owning slices and new tools that read from existing slices should follow the same convention — a new naming scheme forces the model to learn a special case.

## 4. Tool Outputs: Structured Errors, Never Throws

Every tool `execute` must catch its own failures and return a structured error shape — typically `{ error: string }`, or a discriminated `{ status: 'not_found' | 'unauthorized' | … }` when the model needs to branch. Throwing escapes the AI SDK boundary and surfaces as an opaque step failure that the model cannot reason about or recover from.

**Error messages are part of the contract.** Name the missing entity and the next valid action: `"No routes available — call setRoute first."` beats `"Not found."` Vague errors are the single biggest driver of retry loops.

**Distinguish input errors from external errors.** A missing precondition (no route yet, unknown entry id) is an input error — the model needs to call something else first. A 5xx from a service is external — the model can sensibly retry once. The error string should make the difference obvious; if it doesn't, the model will pick the wrong recovery.

## 5. Scale Tools With Builders, Not Branching

Use a static `ToolEntry` when the description and input shape are constant. Use a `ToolEntryBuilder<Scope>` when either changes per agent (e.g. behind a feature flag, narrowed by `dataEntries`) or per turn (per-tool scope emitted by the classifier).

A scopable tool declares a `scopeSchema` + `scopePrompt`. The classifier emits a value per turn; `prepareStep` validates it and re-invokes the builder so the model sees only the relevant subset of the schema. This is how `analyseData` and `processData` cover six entry kinds without paying the full surface cost every turn.

Builders are the **only** mechanism for per-turn rebuilding — a static `ToolEntry` carrying a `scopeSchema` is silently never rebuilt because there is no factory to call. When adding scope-aware behavior, the entry must come from a builder; otherwise the schema you put in front of the model is the full surface, regardless of the scope the classifier emitted.

## 6. Map Mutations Are Sequential

Map state — `show()`, `hide()`, `clear()` on per-entry modules and the slice-level shown sets — has hidden ordering constraints with MapLibre. Awaiting these in parallel via `Promise.all` causes races: a freshly added layer can be removed before its source registers, an entry can be hidden mid-show, MapLibre style mutations can land out of order. Drive every map change one after another with `await`, even when the entries belong to different slices.

Pure data work — geocoding, routing, search, place-by-id lookups — can still parallelise freely. The serial-only surface is the map-mutation surface (`PlacesModule`, `RoutingModule`, `GeometriesModule`, `CustomGeoJSONModule`, …). When in doubt, sequentialise: the cost of a few extra ms is trivial next to the cost of a non-deterministic render.

## 7. Keep Heavy Data in State, Return Summaries

Geospatial payloads destroy reasoning quality. Full geometries, GeoJSON collections, incident sets, and style dumps stay in plugin state.

Return to the model: counts, names, indexes, labels, status, summaries. Keep full objects internally for follow-up rendering or inspection. Expose inspection tools so the model pulls context on demand — do not keep full map state in the system prompt.

**Tool results are not retained in conversation history.** The agent cannot recall previous tool outputs from its context window. Any follow-up question about prior data — "what was that place?", "how long was the route?" — must trigger a state retrieval tool. This is the primary reason state retrieval tools exist and why they must be reliable, easy to select, and unambiguous.

## 8. Plugin State Design

Maintain structured internal state for: service response history, last place/route results, waypoint history, currently shown entities, and any data omitted from tool responses.

**Shape state by user workflow, not backend provenance.** Users say "that place", "the first result", "the route we just made" — they don't care whether data came from search, geocode, or reverse geocode.

- Shared place store across tools that yield places
- Shared route store across tools that yield routes
- Separate stores only when distinct behavior depends on the distinction
- Stable references are entry IDs (`places-3`, `routes-1`, `byod-0`, `ranges-0`) that name the entry the slice produced — every recall / display / `analyseData` / `processData` tool accepts them via the matching `*EntryIDs` field

The model should retrieve prior results from state via inspection tools, not reconstruct them from chat history.

**No read-then-pass.** Tools must never require the agent to read data from one tool and pass it as input to another. This pattern invites hallucination. Tools that need prior results should read directly from shared plugin state.

## 9. System Prompt Design

The system prompt is the agent's operating specification, not a style guide.

- Structure with clear headers and sections: role, context, tool-usage logic, constraints, fallback policy
- Frame instructions positively ("call `recallState` first") over negatively ("do not call the service tool when...")
- Include an explicit "when unsure" policy: ask for clarification, use the safest tool, or surface a structured limitation response
- Use concrete examples for behaviors that rules can't capture cleanly
- Keep it lean — anything derivable from tool schemas or state at runtime should not be in the prompt

## 10. Prevent Tool-Call Loops

Loops happen when a tool fails ambiguously and the model retries indefinitely. Mitigate at the contract level:

- Define terminal conditions in every tool description
- State when not to retry (identical args = identical result)
- Return unambiguous status signals (`"status": "not_found"`)
- Recovery policy: after two failed attempts, surface the issue to the user

## 11. Evals

Develop against realistic evals, not happy-path demos. Eval cases live in each example's `e2e-tests/eval/eval-cases.ts`.

**Eval prompts should sound like real users:**
- Good: "Find the central station." / "Route from Amsterdam to Utrecht and show traffic."
- Bad: "I'm looking at the map near Amsterdam, find the central station." (coaches the model)

**Evals should exercise compound workflows** — retrieval + state + rendering + verification, not isolated actions.

**Use eval failures to improve contracts:** when a pattern recurs (wrong coordinate order, wrong index, calling low-level tools when high-level ones exist), fix the schema/description/validation — don't just adjust prompts.

## 12. Scenario tests

Alongside the eval suite, the plugin runs `@langwatch/scenario` per-tool tests under `src/tests/scenarios/<tool-name>.test.ts`. Coverage is a curated subset of `DEFAULT_TOOLS` — new tools are not auto-covered; expand the suite when a tool needs scenario-level assertion. Each covered file has two parts:

- **Canonical scenarios** (`it()` calls) — hand-picked, hand-stabilised prompts. Always run. CI default.
- **Registry fanout** (`it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)`) — every entry in the tool's `examplePrompts` from `tool-registry.ts`, via `getExamplePrompts('<toolName>')`. Gated on `SCENARIOS_FULL=1`.

Two commands:

- `pnpm test:scenarios` — canonical only, ~23 tests, ~40s (parallel), ~$0.50 in LLM cost. **CI default.**
- `pnpm test:scenarios:full` — canonical + registry fanout, ~121 tests, ~5–15 min, ~$5. Run before merging tool description / classifier-prompt changes; otherwise nightly.

**Single source of truth.** The `examplePrompts` array in the registry IS the broad-coverage test corpus — no parallel list. Edit the registry, the full suite's coverage updates on the next run.

**Therefore: keep registry and tests in lockstep.** When you:
- add a tool → create `src/tests/scenarios/<tool-name>.test.ts` with one canonical `it()` + the standard `it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)` block, and seed `examplePrompts` in the registry.
- rename a tool → rename the scenario file AND update its `getExamplePrompts('<newName>')` argument (it's a type error otherwise).
- remove a tool → delete the scenario file.
- change a tool's `examplePrompts` → run `pnpm test:scenarios:full` locally before pushing.
- change a tool's `description` / `classificationPrompt` → run `pnpm test:scenarios:full` for at least the affected tool and any sibling tool whose `examplePrompts` overlap thematically (e.g. tweaking `discoverPlaces.description` can pull the classifier away from `locatePlace`).

See [`AGENTS.md` § "Scenario tests"](./AGENTS.md#scenario-tests) for the full checklist.

## Design Checklist

When adding or changing tools:
- Task-oriented over low-level
- Summarized over raw
- Discoverable and composable over hidden and coupled
- Schema-constrained over guess-driven
- Structured errors over thrown exceptions
- Builder + scope over a static megaschema (when the surface varies per turn)
- Sequential `await` over `Promise.all` for map mutations
- Entry-id references (`places-3`, `routes-1`) over invented names
- Terminal-state-legible over loop-prone
- Eval-verified over plausible-looking
