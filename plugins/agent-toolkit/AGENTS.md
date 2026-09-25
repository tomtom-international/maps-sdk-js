# AGENTS.md — Agent Toolkit Plugin

## Overview

A headless conversational agent toolkit using [Vercel AI SDK v6](https://ai-sdk.dev/) that gives an LLM tool-based control over a `TomTomMap` instance and TomTom services. No UI ships with this package — consumers bring their own chat interface.

**Scope: client-side only.** The consumer provides their own LLM provider instance — this package does NOT bundle or default to any provider.

> **Read this first:** [`ENGINEERING-GUIDELINES.md`](./ENGINEERING-GUIDELINES.md) defines how tools should be designed, what state management looks like, how system prompts should be structured, and the standards for tool contracts and context management. Everything in this plugin should conform to those guidelines.

---

## Architecture

```
Consumer App
├── Chat UI (BYO)
│     │
│     ▼
├── MapAgent  (this package)
│   ├── AI SDK ToolLoopAgent
│   │     ├── System Prompt
│   │     ├── Intent classifier (picks tools + per-tool scope per turn)
│   │     └── Map ToolSet (Zod-validated tools)
│   │           ├── Data tools: locatePlace, reverseGeocode, discoverPlaces, setRoute, findReachableAreas, getTrafficIncidents, …
│   │           ├── Scope-aware unified tools: analyseData, processData (per-turn scope narrows description + schema)
│   │           ├── Recurrence tools: monitorAnalysis, createTracker, getTrackers, getTrackerHistory, clearTracker
│   │           ├── BYOD tools: addByodSource, setByodLayers, updateByodDisplay
│   │           ├── Map tools: updatePlacesDisplay, updateRoutesDisplay, updateWaypointsDisplay, flyTo, toggleTilesTrafficFlow, toggleTilesTrafficIncidents, …
│   │           └── Styling tools: describeMapStyling, setMapStyling (StylingModule knob catalogue)
│   ├── ToolState — the state object every tool receives (`src/types/index.ts`):
│   │     ├── Entry-owning slices: places, routing, ranges, customGeometries, byod, trafficIncidents, trafficAreaAnalytics
│   │     ├── Non-entry slices: mapPOIs, baseMap, trafficTiles
│   │     └── Session-level: engine (JobEngine), analyses (Analyses), trackers (EventsState), codeExecution (SandboxExecutor)
│   └── Per-entry modules (lazy PlacesModule, RoutingModule, CustomGeoJSONModule, TrafficAreaAnalyticsModule, …)
│
├── TomTomMap instance + maplibre-gl
└── LLM Provider (consumer-supplied, e.g. @ai-sdk/openai)
```

---

## Key Conventions

- **Coordinates**: Always `[longitude, latitude]` — GeoJSON standard.
- **Async modules**: Module factories are all async. Style-owned modules use `Module.get(map)`, which the SDK memoizes per map — call it freely, no local `??=` cache needed. Data-owned modules use `Module.create(map)`, which builds a new independent instance per call — create one per entry you render, and cache that instance alongside its entry.
- **Error handling**: Every tool `execute` must catch and return `{ error: string }`, never throw.
- **Cancellation**: `execute`'s third argument is `ToolExecuteOptions` (`{ signal?: AbortSignal }`), the AI SDK's per-call `abortSignal`. Forward `options.signal` into every service call's params so a cancelled turn cancels its HTTP requests; an abort rejects with `SDKAbortError`. Never forward it into a monitor tick or other deferred job — those run after the turn, and a rejected tick clears the monitor's interval.
- **Token efficiency**: Summarize results. Never return full GeoJSON to the LLM.
- **No provider bundled**: `model` is required. Fail fast if not provided.
- **Monorepo imports**: Use `@tomtom-org/maps-sdk/core`, `/map`, `/services`.
- **Linting**: Biome, not ESLint/Prettier. Run `pnpm lint` from root.
- **No needless exports**: don't `export` a symbol only used within its own file; directory barrels re-export only what's consumed *through* the barrel.
- **Build config**: this package uses its **own** `vite.lib.config.ts` (extends the shared `../plugin-vite-config.ts`), NOT named `vite.config.ts` on purpose — Vitest auto-merges a `vite.config.ts`, and the lib-build plugins (dts/terser/peerDepsExternal) leaking into the test pipeline breaks tests. Keep build config named `vite.lib.config.ts`.

---

## Code-execution sandbox (`src/tools/shared/sandbox/` + `sandbox-code.ts` / `sandbox-replay.ts`)

`analyseData` / `processData` run model-authored JS via a pluggable `SandboxExecutor`. The executor contract, the main-thread executor and the arg packing live in `src/tools/shared/sandbox-code.ts` (a **sibling** of the `sandbox/` directory, not inside it); `sandbox/` holds the browser path (`iframe-worker-executor.ts`, `worker-runtime.ts`, `worker-libs.ts`, `sdk-utils-worker-entry.ts`) and `sandbox-replay.ts` the standing/monitor re-run path. Execution mode is env-chosen, NOT configurable (`resolveSandboxExecutor` + `hasBrowserSandboxApis`): `iframe-worker` in the browser (opaque-origin iframe + worker + CSP `default-src 'none'` + timeout — mandatory there), `mainThreadExecutor` in Node/SSR (no equivalent boundary; a `worker_thread` adds only termination while exposing `fs`/`net`/`child_process`). `codeExecution` only tunes the browser run (`timeoutMs`, `loadWorkerLibrarySource`). **Input deep-copy lives in `mainThreadExecutor` only** (`cloneDataArg`, skips `WORKER_PROVIDED_PARAMS`) — the iframe-worker gets its copy free via `postMessage`; `packSandboxArgs` and the monitor path now pass live references. `turf` / `h3` / `routeUtils` are bundled into the worker and injected into BOTH tools (`routeUtils` shared from `multi-input.ts`).

- **Worker libs (turf/h3/routeUtils)**: the worker can't `import` the host's peer-dep modules, so `worker-libs.ts` `?raw`-inlines turf's/h3's UMD bundles plus the bundled `routeUtils` IIFE into a **lazy chunk** (`dist/worker-libs-*.js`) loaded only in iframe-worker mode — the main bundle keeps turf/h3 externalized. turf needs the `sandbox-turf-umd` alias and the SDK worker-utilities (`routeUtils`, …) the `virtual:sandbox-sdk-utils` plugin (bundling `sdk-utils-worker-entry.ts`) — both live in `vite-sandbox-build.ts`, shared by `vite.lib.config.ts` and `e2e-tests/vite.config.ts`; `*?raw` and the virtual module are typed by `src/raw.d.ts`. After touching this, run `pnpm build` and confirm `dist/index.es.js` stays lean (**370 kB** as of 0.5.3 — it should not jump by the size of a library) and `dist/worker-libs-*.js` (**755 kB**) carries the libs.
- **e2e harness** (`e2e-tests/`): real-browser checks across two specs — `sandbox-isolation.spec.ts` (5 tests: CSP egress-block, Worker termination, opaque-origin isolation, zero-config turf/h3) and `cluster-incidents.spec.ts` (2 tests: `clusterIncidents` running in the iframe-worker). Run `pnpm test:e2e` (one-time `pnpm test:e2e:install` for Chromium).
- **e2e-verified, still experimental**: the `e2e-tests/` suite passes (**7/7**) in real Chromium, so the boundary is verified by those checks. Runs in CI via the dedicated `e2e-test-agent-toolkit-sandbox` job (`pnpm e2e-test:agent-toolkit:sandbox`), separate from the browser-free unit-test runs. Falls back (loudly) to main-thread when browser APIs are missing.

---

## Source Structure Conventions

### Barrel files (`index.ts`)

The package entry point (`plugins/agent-toolkit/index.ts`) uses **explicit named exports**, not `export *`:

```typescript
export { createMapAgent } from './src/create-map-agent';
export { DEFAULT_TOOLS, TOOL_NAMES, type ToolName } from './src/tools';
export * from './src/types/index';  // types/ only contains public types
// ...
```

Because the root is *mostly* explicit, **directory barrels** (`src/*/index.ts`) can export everything in their directory for convenient internal cross-directory imports.

**Two exceptions carry a whole barrel onto the public surface** — `export * from './src/types/index'` (intended: `types/` holds only public types) and `export * from './src/tools/shared/index'` (**not** intended that way: that barrel wildcards 23 modules, including `@ignore` internals like `geometries-id`, `multi-input`, `sandbox-code`, `resolve-where` and `state-inputs`). So "nothing leaks unless the root re-exports it" holds for every directory *except* `tools/shared`. Treat anything you add there as publicly reachable — `@ignore` keeps it out of the API reference, not out of the published types. Narrowing that wildcard to named exports is a breaking change and needs a major bump.

```typescript
// Use the barrel for internal cross-directory imports
import { makePlacesLabel, summarizePlaces } from '../../utils';
import { whereSchema, showResultsOnMap } from '../shared';

// Exception: when a symbol is intentionally absent from the barrel,
// import directly from the source file
import { costModelSchema } from '../services/set-route';
```

**`@ignore`** controls TypeDoc visibility independently of barrel inclusion. An `@ignore` symbol can appear in the bundle and in a directory barrel while still being excluded from the API reference.

### `types/` subdirectories — public API types only

`types/` subdirectories hold types annotated with `@group Agent Toolkit`. Internal types (`@ignore`) live in their source file, not in `types/`.

```
src/types/index.ts          ← public plugin types (ToolState, MapAgentOptions, …)
src/utils/types/index.ts    ← public utility types (ClassificationResult, ClassifierOptions)
```

### `tests/` subdirectories

Test files live in a `tests/` subdirectory alongside their source files:

```
src/tests/                      ← tests for top-level src/ files
src/state/tests/                ← tests for src/state/
src/utils/tests/                ← tests for src/utils/
src/tools/state/tests/          ← tests for src/tools/state/
```

## Cross-surface consistency for this plugin

The toolkit's "tool" + "state slice" abstractions appear in many places that aren't enforced by the compiler. After changes in those areas, walk these checks before pushing.

**Added a new tool to `DEFAULT_TOOLS`**:
- exported the entry from its directory's barrel (`tools/services/index.ts`, `tools/state/index.ts`, …)
- imported and registered in `tools/tool-registry.ts` so the name is in `TOOL_NAMES`
- if it's referenced by another tool's `description` ("call `xTool` first"), confirm `xTool` exists and is registered too — dead pointers in descriptions mislead the model
- if it's scope-aware, supplied a `scopeSchema` + `scopePrompt` and verified `prepareStep` rebuilds it correctly
- added eval coverage in the relevant example's eval cases file (or marked why no eval is needed)
- if the tool warrants scenario-level coverage, added a `describe` block under `src/tests/scenarios/` (its own `<tool-name>.test.ts`, or the fitting themed file) that exercises `examplePrompts` from the registry via `getExamplePrompts('<toolName>')` — see [Scenario tests](#scenario-tests) below

**Added a new entry-owning state slice** — walk every "every slice" code path and wire the new slice in:
- `state/state.ts` adds it to the `DataEntryKind` union and `DATA_ENTRY_KIND_TO_SLICE`, and `ToolState` in `types/index.ts` carries the slice
- `tools/state/reset-state.ts` calls both the pre-reset module-clear loop AND `state.<slice>.reset()` (the session-level `analyses` / `trackers` / `engine` resets there are separate — leave them alone)
- `tools/state/recall-state.ts` includes the new slice in its summary, and `RecallableKind` accepts its `kind`
- `state/digest.ts` (`getStateDigest` + `formatStateDigestDiff`) reports the new slice's `shown` / `entryMode` / `entryCount`
- `tools/shared/entry-kinds.ts` gets an `ENTRY_KIND_META` row (field name, sandbox/schema docs, `recallTool`) if the unified data tools should accept it
- `tools/tool-registry.ts` adds a `TOOLS_BY_DATA_ENTRY_KIND` row so disabling the kind drops the right tools
- `system-prompt.ts` mentions the slice if the model needs to know about it
- the slice's barrel re-exports its public types and the package root re-exports the slice type
- there are tests in `state/<slice>/tests/state.test.ts` covering ID generation/collisions, `single` mode, show/hide/clear, and reset

**Removed or renamed a public tool / type / slice** — in addition to the root-level surfaces in `.claude/skills/tomtom-maps-sdk-js-preflight`, also sweep:
- `system-prompt.ts` and every per-tool `description` / `classificationPrompt` for stale name references
- `documentation/docs-portal/guides/plugins/agent-toolkit/*.mdx` and the `navigation.yml` entry that exposes the affected page
- decide on a deprecated alias or a `minor` changeset (the pre-1.0 breaking bump) — silently dropping a public export is a breaking release
- `src/tests/scenarios/` — update the `getExamplePrompts('<oldName>')` argument in the owning file (find it with `grep -rl`), and rename or delete that file if it covered only this tool

## Scenario tests

`src/tests/scenarios/` holds LLM-in-the-loop tool-selection tests. See [`src/tests/scenarios/README.md`](./src/tests/scenarios/README.md) for what is real vs. mocked, the assertion helpers, and the known-hard cases.

**File layout is per *tool* where one tool warrants a file, per *theme* where several do** — `locate-place.test.ts`, `set-route.test.ts` and `analyse-data.test.ts` cover a single tool each; `display.test.ts`, `map-style.test.ts`, `route-edits.test.ts`, `tile-toggles.test.ts`, `utilities.test.ts`, `guardrails.test.ts`, `state-management.test.ts`, `traffic-incidents-ops.test.ts` and `traffic-analytics-ops.test.ts` each hold several `describe` blocks, one per tool. Don't assume `<tool-name>.test.ts` exists — `grep -rl "getExamplePrompts('<toolName>')" src/tests/scenarios` finds the owning file.

Each `describe` block follows the same two-part shape, where **the canonical prompt is the tool's FIRST registry `examplePrompt`** (not a separately maintained one):

```typescript
const [canonical, ...rest] = getExamplePrompts('locatePlace');
it(`classifies the canonical prompt: ${canonical}`, ...);                       // always runs
it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', ...); // SCENARIOS_FULL=1 only
```

Two suites, two cost profiles (counts measured with `npx vitest list src/tests/scenarios`, as of 0.5.3 — re-measure rather than trusting these):

| Command | Gate | Tests | Use |
|---|---|---|---|
| `pnpm test:agent-tool-calling` | `SCENARIOS_FULL` unset | **61** (canonical only) | the CI suite (`scenario-tests.yml`, on push to `main`), fast pre-push check |
| `pnpm test:agent-tool-calling:full` | `SCENARIOS_FULL=1` | **269** (canonical + registry fanout) | run manually before touching tool descriptions / classifier prompts — **nothing runs this in CI** |

Every scenario runs against **each** model in `AZURE_MODEL_IDS` and passes only when all do, so wall-clock and LLM cost scale with the length of that list — not with the test count alone.

**The registry is the single source of truth, canonical prompts included.** Editing `examplePrompts` reshapes both suites on the next run: reordering the array or rewording `examplePrompts[0]` changes what the *canonical* (CI) suite asserts, and adding/removing later entries changes the fanout. There is no parallel list to maintain and no buffer either way.

Coverage is **51 of 54 default tools** (`clearTracker`, `getTrackerHistory` and `getTrackers` have none). New tools are not auto-covered — add a `describe` block intentionally.

Walk these checks whenever you touch a tool's registry surface:
- changed a tool's `examplePrompts` → run `pnpm test:agent-tool-calling:full` locally; if you touched `examplePrompts[0]`, the canonical/CI assertion changed too.
- changed a tool's `description` / `classificationPrompt` → run `pnpm test:agent-tool-calling:full` for at least the affected tool and any thematically-adjacent sibling (e.g. tweaking `processData.classificationPrompt` can pull `analyseData`'s prompts off-target).
- renamed or removed a tool → update the owning file's `getExamplePrompts('<name>')` argument (an orphan call is a type error), and rename or delete the file if it covered only that tool.
- added a tool → add a `describe` block to the tool's own file or the fitting themed file, with the canonical `it()` + `it.skipIf(!FULL_SCENARIOS).each(rest)` pair above.

## Keeping docs and the SDK skill in sync (REQUIRED for every public-surface change)

The toolkit has three public surfaces that documentation lives on. **All three must move together** with any public-surface change — a new tool, a renamed tool, a new public type, a changed scope shape, a new state slice, a new option on `createMapAgent`, a changed sandbox-runtime guardrail, a new error hint. Updating only one or two is a partial change that drifts the others into wrong territory until the next reviewer notices.

The three surfaces, in the order to walk:

1. **`.claude/skills/tomtom-maps-sdk-js/docs/agent-toolkit.md`** — the LLM-facing reference loaded by the `tomtom-maps-sdk-js` Claude Code skill. Trigger keywords also live in `.claude/skills/tomtom-maps-sdk-js/SKILL.md`'s `description` and the `Topic → Filename` table. **Add new public API names to the SKILL.md `description` keyword list AND to the `agent-toolkit` row's keyword column** — without that, the skill won't auto-load when a developer mentions the new name.
2. **`documentation/docs-portal/guides/plugins/agent-toolkit/*.mdx`** — the customer-facing guides. The full set (current as of this entry):
   - `overview.mdx` — quickstart + "Where to next" links; touch when adding a new page so the index stays correct.
   - `how-it-works.mdx` — turn flow + classifier; touch when changing classifier/scope semantics.
   - `state.mdx` — slices, entries, `dataEntries`; touch on any slice / entry-mode change.
   - `tools.mdx` — tool registry reference; touch on any registry change or category move.
   - `customizing-tools.mdx` — remove/replace/add patterns.
   - `byod.mdx` — BYOD layer ingest and usage.
   - `scope-aware-data-tools.mdx` — `analyseData`/`processData` scope mechanism.
   - `code-generation.mdx` — sandbox runtime, injected identifiers, guardrails, threat model.
   - `customizing-system-prompt.mdx` — prompt assembly and the four ways to shape it; touch on any `SYSTEM_PROMPT_SECTIONS` change.
   - `securing-your-agent.mdx` — where the agent runs, proxying the model, what the toolkit does and does not bound; touch on any guardrail or trust-boundary change.
3. **`documentation/docs-portal/guides/navigation.yml`** — must list any new MDX file under the `Agent Toolkit` items array. A new page that isn't in `navigation.yml` won't appear in the sidebar.

### What to change for which kind of code change

| Code change | Update SKILL.md keywords | Update agent-toolkit.md | Update guides | Update navigation.yml |
|---|---|---|---|---|
| New tool added to `DEFAULT_TOOLS` | ✅ (add tool name) | ✅ (tool category section) | ✅ `tools.mdx` registry table | — |
| Tool renamed or removed | ✅ (remove old name) | ✅ | ✅ everywhere it's mentioned | — |
| New public exported type | ✅ (add type name) | ✅ (relevant section) | ✅ where the type is referenced | — |
| New `createMapAgent` option | ✅ | ✅ (`MapAgentOptions` section) | ✅ `overview.mdx` + relevant guide | — |
| New entry-owning state slice | ✅ | ✅ | ✅ `state.mdx` + `customizing-tools.mdx` + `byod.mdx` if it's BYOD-adjacent | — |
| Sandbox guardrail / injected identifier change | ✅ (if name-bearing) | ✅ (sandbox section) | ✅ `code-generation.mdx` | — |
| New scope shape / scopable tool | ✅ | ✅ (scope section) | ✅ `scope-aware-data-tools.mdx` | — |
| New top-level guide page | — | — | ✅ create + cross-link | ✅ add `fileId` entry |

### Verification before pushing

Quick read-through:

- `grep -l '<changed-name>' .claude/skills/tomtom-maps-sdk-js/ documentation/docs-portal/guides/plugins/agent-toolkit/` should hit every place that previously referenced the symbol; confirm each has been updated.
- For a new public API name, also `grep` for it in the same trees — every place it deserves a mention should now have one.
- If you renamed a guide file, `grep -rn "<old-filename>" documentation/docs-portal/` to catch cross-page links.

These checks are part of the same PR as the code change. Don't push a renamed tool with a "docs follow-up next PR" — every consumer of the docs (humans reading guides, Claude Code through the skill, agent toolkit users grepping the API reference) will be looking at stale instructions until the follow-up lands.
