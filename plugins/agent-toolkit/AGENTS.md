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
│   │           ├── BYOD tools: addByodSource, recallByod, setByodLayers, updateByodDisplay
│   │           └── Map tools: updatePlacesDisplay, updateRoutesDisplay, updateWaypointsDisplay, flyTo, toggleTilesTrafficFlow, toggleTilesTrafficIncidents, …
│   ├── MapAgentState (per-entry histories: places, routing, ranges, customGeometries, byod, trafficIncidents, trafficAreaAnalytics)
│   └── Per-entry modules (lazy PlacesModule, RoutingModule, CustomGeoJSONModule, TrafficAreaAnalyticsModule, …)
│
├── TomTomMap instance + maplibre-gl
└── LLM Provider (consumer-supplied, e.g. @ai-sdk/openai)
```

---

## Key Conventions

- **Coordinates**: Always `[longitude, latitude]` — GeoJSON standard.
- **Async modules**: All `Module.get(map)` calls are async. Cache in `state.modules`.
- **Error handling**: Every tool `execute` must catch and return `{ error: string }`, never throw.
- **Token efficiency**: Summarize results. Never return full GeoJSON to the LLM.
- **No provider bundled**: `model` is required. Fail fast if not provided.
- **Monorepo imports**: Use `@tomtom-org/maps-sdk/core`, `/map`, `/services`.
- **Linting**: Biome, not ESLint/Prettier. Run `pnpm lint` from root.
- **No needless exports**: don't `export` a symbol only used within its own file; directory barrels re-export only what's consumed *through* the barrel.
- **Build config**: this package uses its **own** `vite.lib.config.ts` (extends the shared `../plugin-vite-config.ts`), NOT named `vite.config.ts` on purpose — Vitest auto-merges a `vite.config.ts`, and the lib-build plugins (dts/terser/peerDepsExternal) leaking into the test pipeline breaks tests. Keep build config named `vite.lib.config.ts`.

---

## Code-execution sandbox (`src/tools/shared/sandbox/`)

`analyseData` / `processData` run model-authored JS via a pluggable `SandboxExecutor` (`sandbox-code.ts`). Execution mode is env-chosen, NOT configurable (`resolveSandboxExecutor` + `hasBrowserSandboxApis`): `iframe-worker` in the browser (opaque-origin iframe + worker + CSP `default-src 'none'` + timeout — mandatory there), `mainThreadExecutor` in Node/SSR (no equivalent boundary; a `worker_thread` adds only termination while exposing `fs`/`net`/`child_process`). `codeExecution` only tunes the browser run (`timeoutMs`, `loadWorkerLibrarySource`). **Input deep-copy lives in `mainThreadExecutor` only** (`cloneDataArg`, skips `WORKER_PROVIDED_PARAMS`) — the iframe-worker gets its copy free via `postMessage`; `packSandboxArgs` and the monitor path now pass live references. `turf` / `h3` / `routeUtils` are bundled into the worker and injected into BOTH tools (`routeUtils` shared from `multi-input.ts`).

- **Worker libs (turf/h3/routeUtils)**: the worker can't `import` the host's peer-dep modules, so `worker-libs.ts` `?raw`-inlines turf's/h3's UMD bundles plus the bundled `routeUtils` IIFE into a **lazy chunk** (`dist/worker-libs-*.js`) loaded only in iframe-worker mode — the main bundle keeps turf/h3 externalized. turf needs the `sandbox-turf-umd` alias and the SDK worker-utilities (`routeUtils`, …) the `virtual:sandbox-sdk-utils` plugin (bundling `sdk-utils-worker-entry.ts`) — both live in `vite-sandbox-build.ts`, shared by `vite.lib.config.ts` and `e2e-tests/vite.config.ts`; `*?raw` and the virtual module are typed by `src/raw.d.ts`. After touching this, run `pnpm build` and confirm `dist/index.es.js` stays lean (~323 kB) and `dist/worker-libs-*.js` carries the libs.
- **e2e harness** (`e2e-tests/`): real-browser isolation checks (CSP / opaque origin / Worker termination) — run `pnpm test:e2e` (one-time `pnpm test:e2e:install` for Chromium).
- **e2e-verified, still experimental**: the `e2e-tests/` suite passes (5/5) in real Chromium — CSP egress-block, worker termination, opaque-origin isolation, zero-config turf/h3 — so the boundary is verified by those checks. Runs in CI via the dedicated `e2e-test-agent-toolkit-sandbox` job (`pnpm e2e-test:agent-toolkit:sandbox`), separate from the browser-free unit-test runs. Falls back (loudly) to main-thread when browser APIs are missing.

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

Because the root is explicit, **directory barrels** (`src/*/index.ts`) can export everything in their directory for convenient internal cross-directory imports. Nothing leaks to the public surface unless the root explicitly re-exports it.

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
- if the tool warrants scenario-level coverage, added a per-tool scenario file `src/tests/scenarios/<tool-name>.test.ts` that exercises `examplePrompts` from the registry via `getExamplePrompts('<toolName>')` (coverage is a curated subset, not every tool) — see [Scenario tests](#scenario-tests) below

**Added a new entry-owning state slice** — walk every "every slice" code path and wire the new slice in:
- `tools/state/reset-state.ts` calls both the pre-reset module-clear loop AND `state.<slice>.reset()`
- `tools/state/recall-state.ts` includes the new slice in its summary
- `state/digest.ts` (`getStateDigest` + `formatStateDigestDiff`) reports the new slice's `shown` / `entryMode` / `entryCount`
- `system-prompt.ts` mentions the slice if the model needs to know about it
- the slice's barrel re-exports its public types and the package root re-exports the slice type
- there are tests in `state/<slice>/tests/state.test.ts` covering ID generation/collisions, `single` mode, show/hide/clear, and reset

**Removed or renamed a public tool / type / slice** — in addition to the root-level surfaces in `.claude/skills/tomtom-maps-sdk-js-contribution`, also sweep:
- `system-prompt.ts` and every per-tool `description` / `classificationPrompt` for stale name references
- `documentation/docs-portal/guides/plugins/agent-toolkit/*.mdx` and the `navigation.yml` entry that exposes the affected page
- decide on a deprecated alias or a major-version bump in `.release-please-manifest.json` — silently dropping a public export is a breaking release
- `src/tests/scenarios/<tool-name>.test.ts` — rename the per-tool scenario file (and the `getExamplePrompts('<oldName>')` argument inside it) or delete it if the tool is gone

## Scenario tests

`src/tests/scenarios/` holds one `<tool-name>.test.ts` file per **covered** tool — a curated subset of `DEFAULT_TOOLS`, not every tool. New tools are not auto-covered; expand the suite intentionally when a tool needs scenario-level assertion. Each file has:
- a small set of **canonical `it()` scenarios** — hand-picked, hand-stabilised prompts that always run.
- one **`it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)` block** that fans out across every entry in the tool's `examplePrompts` array from the registry (via `getExamplePrompts('<toolName>')` in `helpers.ts`).

Two suites, two cost profiles:

| Command | Gate | Tests | Wall-clock | Use |
|---|---|---|---|---|
| `pnpm test:scenarios` | `SCENARIOS_FULL` unset | ~23 (canonical only) | ~40s (parallel) | CI on every PR, fast pre-push check |
| `pnpm test:scenarios:full` | `SCENARIOS_FULL=1` | ~121 (canonical + registry fanout) | ~5–15 min | Nightly job, before touching tool descriptions/classifier prompts |

Editing `examplePrompts` in `tool-registry.ts` automatically reshapes the **full** suite's coverage on its next run — **no parallel list to maintain, but also no buffer when an examplePrompt is removed or reworded**. The sanity suite is unaffected by registry changes.

Walk these checks whenever you touch a tool's registry surface:
- changed a tool's `examplePrompts` → run `pnpm test:scenarios:full` locally; the new list is now under test in the full suite.
- changed a tool's `description` / `classificationPrompt` → run `pnpm test:scenarios:full` for at least the affected tool and any thematically-adjacent sibling (e.g. tweaking `processData.classificationPrompt` can pull `analyseData`'s prompts off-target).
- renamed or removed a tool → rename / delete the per-tool scenario file alongside the registry edit; an orphan file calling `getExamplePrompts('<oldName>')` is a type error.
- added a tool → create the per-tool scenario file as per the checklist above; seed it with one canonical `it()` scenario and the standard `it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)` block.

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
