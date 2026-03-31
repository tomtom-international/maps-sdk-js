# Map Agent Engineering Guidelines

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

## 4. Keep Heavy Data in State, Return Summaries

Geospatial payloads destroy reasoning quality. Full geometries, GeoJSON collections, incident sets, and style dumps stay in plugin state.

Return to the model: counts, names, indexes, labels, status, summaries. Keep full objects internally for follow-up rendering or inspection. Expose inspection tools so the model pulls context on demand — do not keep full map state in the system prompt.

**Tool results are not retained in conversation history.** The agent cannot recall previous tool outputs from its context window. Any follow-up question about prior data — "what was that place?", "how long was the route?" — must trigger a state retrieval tool. This is the primary reason state retrieval tools exist and why they must be reliable, easy to select, and unambiguous.

## 5. Plugin State Design

Maintain structured internal state for: service response history, last place/route results, waypoint history, currently shown entities, and any data omitted from tool responses.

**Shape state by user workflow, not backend provenance.** Users say "that place", "the first result", "the route we just made" — they don't care whether data came from search, geocode, or reverse geocode.

- Shared place store across tools that yield places
- Shared route store across tools that yield routes
- Separate stores only when distinct behavior depends on the distinction
- Stable references (`placeIndex`, `routeHistoryIndex`) point into aggregated stores

The model should retrieve prior results from state via inspection tools, not reconstruct them from chat history.

**No read-then-pass.** Tools must never require the agent to read data from one tool and pass it as input to another. This pattern invites hallucination. Tools that need prior results should read directly from shared plugin state.

## 6. System Prompt Design

The system prompt is the agent's operating specification, not a style guide.

- Structure with clear headers and sections: role, context, tool-usage logic, constraints, fallback policy
- Frame instructions positively ("call `recallSessionState` first") over negatively ("do not call the service tool when...")
- Include an explicit "when unsure" policy: ask for clarification, use the safest tool, or surface a structured limitation response
- Use concrete examples for behaviors that rules can't capture cleanly
- Keep it lean — anything derivable from tool schemas or state at runtime should not be in the prompt

## 7. Prevent Tool-Call Loops

Loops happen when a tool fails ambiguously and the model retries indefinitely. Mitigate at the contract level:

- Define terminal conditions in every tool description
- State when not to retry (identical args = identical result)
- Return unambiguous status signals (`"status": "not_found"`)
- Recovery policy: after two failed attempts, surface the issue to the user

## 8. Evals

Develop against realistic evals, not happy-path demos. The eval suite is at [`eval-cases.ts`](examples/map-chat-agent/e2e-tests/eval/eval-cases.ts).

**Eval prompts should sound like real users:**
- Good: "Find the central station." / "Route from Amsterdam to Utrecht and show traffic."
- Bad: "I'm looking at the map near Amsterdam, find the central station." (coaches the model)

**Evals should exercise compound workflows** — retrieval + state + rendering + verification, not isolated actions.

**Use eval failures to improve contracts:** when a pattern recurs (wrong coordinate order, wrong index, calling low-level tools when high-level ones exist), fix the schema/description/validation — don't just adjust prompts.

## Design Checklist

When adding or changing tools:
- Task-oriented over low-level
- Summarized over raw
- Discoverable and composable over hidden and coupled
- Schema-constrained over guess-driven
- Terminal-state-legible over loop-prone
- Evaluable over clever
