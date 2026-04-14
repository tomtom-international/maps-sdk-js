# AGENTS.md — TomTom Maps SDK for JavaScript

**This repository is a read-only mirror of an internal repo. No PRs are accepted; feedback goes via GitHub Issues/Discussions.**

## Architecture Overview

The SDK ships as **one npm package** (`@tomtom-org/maps-sdk`) with three sub-path entry points backed by separate workspace packages:

| Import path | Workspace | Platform | Depends on |
|---|---|---|---|
| `@tomtom-org/maps-sdk/core` | `core/` | any | — |
| `@tomtom-org/maps-sdk/services` | `services/` | any | `core` |
| `@tomtom-org/maps-sdk/map` | `map/` | browser only | `core`, `maplibre-gl` |

**Build order is strict**: `core` → `services` + `map` in parallel. Never import `map` from `services` or vice versa.

Optional plugins live in `plugins/` (e.g. `viewport-places`, `agent-toolkit`) and declare `@tomtom-org/maps-sdk` as a **peer dependency** — they never bundle it.

### Other workspaces

| Workspace | Purpose |
|---|---|
| `shared-configs/` | Shared Vite, TypeScript, and Vitest configs extended by all packages |
| `testing/core-utils` | `@testing/core-utils` — Playwright/async helpers shared by `map-integration-tests` and `ai-eval` (not unit tests) |
| `testing/ai-eval` | AI agent evaluation harness (LLM judge + eval cases for agent-toolkit) |
| `testing/ai-eval-explorer` | Dev UI for browsing and running eval results |
| `examples/` | 50+ runnable examples, each a standalone Vite app |
| `map-integration-tests/` | Playwright browser tests against the built map package; runs a local HTTPS server at `https://localhost:9001` |

### Data flow
`TomTomConfig.instance.put({ apiKey })` → Services return typed GeoJSON (`FeatureCollection`) → Map modules consume that GeoJSON directly.

All map modules extend `AbstractMapModule` (`map/src/shared/AbstractMapModule.ts`), which manages MapLibre sources/layers and auto-restores them after style changes.

**Concrete map modules** (all in `map/src/`):

| Module | Source type | Key methods |
|---|---|---|
| `BaseMapModule` | `style` | `setVisible`, `setLayerGroupVisible` |
| `PlacesModule` | `geojson` | `show`, `clear`, `applyTheme`, `applyIconConfig` |
| `POIsModule` | `style` | `setVisible` |
| `RoutingModule` | `geojson` | `showRoutes`, `showWaypoints`, `clear` |
| `GeometriesModule` | `geojson` | `show`, `clear` |
| `HillshadeModule` | `style` | `setVisible` |
| `TrafficFlowModule` | `style` | `setVisible`, `applyConfig` |
| `TrafficIncidentsModule` | `style` | `setVisible`, `applyConfig` |
| `TrafficAreaAnalyticsModule` | `geojson` | `show`, `clear`, `setMode`, `setMetric`, `setVisible` |

## Essential Dev Commands

```bash
# Prerequisites: Node 24+, pnpm 10+ (corepack enable)
pnpm install
pnpm build              # core → services + map (strict order via build:sdk)
pnpm build:plugins      # Build all plugins in parallel (separate from SDK build)

# Target a single workspace
pnpm -F core build
pnpm -F services build
pnpm -F map build

# Watch mode while iterating (run in a separate terminal)
pnpm -F map build --watch

# Run examples after building
cd examples/<example-name> && pnpm develop
# → http://localhost:5173/<example-name>

# Unit tests
pnpm test:sdk           # core + services + map
pnpm test:sdk:coverage  # same with coverage reports

# Type checking
pnpm type-check:sdk        # core + services + map + map-integration-tests
pnpm type-check:plugins    # all plugins
pnpm type-check:examples   # examples workspace

# E2E tests
pnpm e2e-test:sdk       # map integration tests (Playwright, browser required)
pnpm e2e-test:examples  # each example's Playwright smoke tests
pnpm e2e-test:examples:update-all-snapshots  # regenerate all upon-load.png snapshots

# Linting / formatting (Biome, not ESLint/Prettier)
pnpm lint
pnpm lint:fix           # runs biome check + biome lint --write
pnpm format:fix

# Clean all build artifacts
pnpm clean

# AI eval explorer (for agent-toolkit eval results)
pnpm eval:explorer      # start dev server for eval UI
```

API keys are required for examples and integration tests:
```bash
cp examples/.env.example examples/.env   # add API_KEY_EXAMPLES=…
# map-integration-tests reads API_KEY_TESTS from the environment
```

## Conventions & Patterns

- **Tooling**: Biome (not ESLint/Prettier). 4-space indentation, single quotes, 120-char line width. Run `pnpm lint` from root.
- **Package manager**: pnpm workspaces. Add deps with `pnpm -F <workspace> add <pkg>`. Shared version pins live in `pnpm-workspace.yaml` under `catalog:`.
- **Coordinates**: always `[longitude, latitude]` (GeoJSON standard) — enforced throughout services and the agent-toolkit plugin.
- **Map modules**: get instances via `await SomeModule.get(map)`, never `new SomeModule()` directly.
- **Error handling in tools/plugins**: every tool `execute` must catch and return `{ error: string }`, never throw.
- **Test placement**: unit tests co-located (`src/feature/index.test.ts`); integration tests in `src/tests/`.
- **Shared build config**: packages extend `shared-configs/` for Vite, TypeScript, and Vitest — modify there to affect all packages.
- **TypeScript**: strict mode, no `any`, no unnecessary casts.
- **Variable naming**: always use full, descriptive names — never abbreviate. Use `response` not `res`, `request` not `req`, `error` not `err`, `parameters` not `params`, `configuration` not `config`, `index` not `idx`, `element` not `el`, `reference` not `ref`, `argument` not `arg`, `destination` not `dest`, `source` not `src`, `message` not `msg`, `previous` not `prev`, `current` not `curr`.
- **No spaghetti code**: a function is spaghetti if it is both longer than one screen (~50 lines) and has complex nested logic (deeply nested conditions, loops within loops, etc.). If both conditions are met, extract the nested blocks into named functions whose names make the intent self-evident.
- **Blank line after single-line `if`**: always add a blank line after a single-line `if` (i.e. an `if` with no `else` whose body is a single statement or early-exit) when it is followed by more code. This makes it visually distinct from the code that follows. Biome does not enforce this — apply it manually.
- **Arrow functions**: prefer arrow function syntax (`const fn = () => ...`) over `function` declarations. One-liner arrows that return a single expression omit the curly braces and `return` keyword (e.g. `const double = (x: number) => x * 2`).
- **No re-exports**: do not re-export types or values that originate elsewhere — always import directly from the canonical source. Barrel re-exports that just forward a symbol from another module add indirection without value.

## Key Files & Directories

| Path | Purpose |
|---|---|
| `core/src/config/globalConfig.ts` | `TomTomConfig` singleton — the single config point for `apiKey`, language, units |
| `map/src/TomTomMap.ts` | Central map class wrapping MapLibre GL JS |
| `map/src/shared/AbstractMapModule.ts` | Base for all map modules; handles style-change restoration |
| `services/index.ts` | All service exports (search, geocode, routing, traffic, EV, …) |
| `plugins/agent-toolkit/` | AI agent plugin; see its `AGENTS.md` + `ENGINEERING-GUIDELINES.md` |
| `plugins/viewport-places/` | Plugin: continuously shows POIs in the visible map viewport |
| `plugins/plugin-vite-config.ts` | Shared Vite library-mode config for all plugins |
| `shared-configs/` | Shared Vite, TypeScript, Vitest configs for all packages |
| `testing/ai-eval/` | Map-agent eval harness: LLM judge, eval cases, scoring |
| `testing/core-utils/src/` | `@testing/core-utils` — `waitForMapIdle`, `queryRenderedFeatures`, map-query helpers used in integration tests |
| `map-integration-tests/src/tests/util/MapTestEnv.ts` | Integration test helper: `MapTestEnv.loadPageAndMap()` sets up the HTTPS test page and a fresh map |
| `map-integration-tests/src/tests/util/TestUtils.ts` | Per-module init/show/clear helpers used in all integration tests (`initTrafficAreaAnalytics`, `initPlaces`, etc.) |
| `map-integration-tests/src/tests/types/MapsSDKThis.ts` | `MapsSDKThis` — `typeof globalThis` extension exposing all module instances to Playwright via `page.evaluate` |
| `pnpm-workspace.yaml` | Workspace list + dependency version catalog |
| `documentation/development/` | BUILD.md, TESTING.md, GETTING_STARTED.md, DEPENDENCIES.md |

Each top-level workspace has its own `AGENTS.md` with package-specific guidance.
