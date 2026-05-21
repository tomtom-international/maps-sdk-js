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
│   │           ├── BYOD tools: addByodLayer, recallByod, updateByodDisplay
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
- added eval coverage in `examples/map-chat-agent/e2e-tests/eval/eval-cases.ts` (or marked why no eval is needed)

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
