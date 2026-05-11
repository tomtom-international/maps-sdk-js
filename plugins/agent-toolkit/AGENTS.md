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
│   │     └── Map ToolSet (Zod-validated tools)
│   │           ├── Data tools: geocode, search, route, reverseGeocode
│   │           └── Map tools: updatePlacesDisplay, updateRoutesDisplay, flyTo, toggleTraffic, ...
│   ├── MapAgentState (retains full GeoJSON between tool calls)
│   └── Module cache (lazy PlacesModule, RoutingModule, etc.)
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
