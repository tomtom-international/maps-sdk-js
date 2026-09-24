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

Optional plugins live in `plugins/` (e.g. `viewport-places`, `agent-toolkit`, `landmarks-3d`, `map-effects`) and declare `@tomtom-org/maps-sdk` as a **peer dependency** — they never bundle it.

### Other workspaces

| Workspace | Purpose |
|---|---|
| `shared-configs/` | Shared Vite, TypeScript, and Vitest configs extended by all packages |
| `testing/core-utils` | `@testing/core-utils` — Playwright/async helpers shared by `map-integration-tests` and `ai-eval` (not unit tests) |
| `testing/ai-eval` | AI agent evaluation harness (LLM judge + eval cases for agent-toolkit) |
| `testing/ai-eval-explorer` | Dev UI for browsing and running eval results |
| `examples/` | 99 runnable examples, each a standalone Vite app |
| `map-integration-tests/` | Playwright browser tests against the built map package; runs a local HTTPS server at `https://localhost:9001` |

### Data flow
`TomTomConfig.instance.put({ apiKey })` → Services return typed GeoJSON (`FeatureCollection`) → Map modules consume that GeoJSON directly.

All map modules extend `AbstractMapModule` (`map/src/shared/AbstractMapModule.ts`), which manages MapLibre sources/layers and auto-restores them after style changes. Each one does so through the subclass for its kind (see below), never through the root class.

**Concrete map modules** (all in `map/src/`):

| Module | Kind | Factory | Key methods |
|---|---|---|---|
| `BaseMapModule` | Style-owned | `get()` | `setVisible`, `setLayerGroupVisible` |
| `POIsModule` | Style-owned | `get()` | `setVisible` |
| `HillshadeModule` | Style-owned | `get()` | `setVisible` |
| `TrafficFlowModule` | Style-owned | `get()` | `setVisible`, `applyConfig` |
| `TrafficIncidentsModule` | Style-owned | `get()` | `setVisible`, `applyConfig` |
| `StylingModule` | Style-owned | `get()` | `set`, `reset`, `applyPreset`, `describe` |
| `PlacesModule` | Data-owned | `create()` | `show`, `clear`, `applyTheme`, `applyIconConfig` |
| `RoutingModule` | Data-owned | `create()` | `showRoutes`, `showWaypoints`, `clear` |
| `GeometriesModule` | Data-owned | `create()` | `show`, `clear` |
| `CustomGeoJSONModule` | Data-owned | `create()` | `show`, `clear`, `setVisible` |
| `TrafficIncidentOverlayModule` | Data-owned | `create()` | `show`, `clear`, `setFocus`, `setVisible`, `moveBeforeLayer` |
| `TrafficAreaAnalyticsModule` | Data-owned | `create()` | `show`, `clear`, `setMode`, `setMetric`, `setVisible` |

The kind is the base class. A style-owned module extends `AbstractStyleOwnedMapModule`: it controls sources and layers the map style already provides, under fixed global IDs — the SDK memoizes one per map, so `get()` twice returns the same instance, and a style change lets it re-bind in the same tick. A data-owned module extends `AbstractDataOwnedMapModule`: it adds and owns its own sources, layers and images, suffixed per instance — safely multi-instance — it defers restoration by one animation frame, and it must implement `discardShownData`, which forgets what it shows when a style switch resets state. That hook is on the root class, so a style-owned module that keeps state of its own can override it too.

**Events** are one surface per module: `module.events.on('click' | 'config-change' | …)`. Modules that manage several surfaces also expose a named scope each (`routing.events.tunnels`, `places.events.connections`), themselves events objects. `events.where(scope, config?)` narrows ad hoc — by feature predicate on every module, and by `{ layerGroups }` on `BaseMapModule` — and takes its own event config, which is how two parts of one module get different hover cursors.

## Essential Dev Commands

```bash
# Prerequisites: Node 24+, pnpm 11+ (corepack enable)
pnpm install
pnpm build              # core → services + map (strict order via build:sdk)
pnpm build:plugins      # Build all plugins in parallel (separate from SDK build)

# Target a single workspace
pnpm -F core build
pnpm -F services build
pnpm -F map build

# Watch mode while iterating (run in a separate terminal). Rebuilds the JS bundle
# and the declarations together.
pnpm -F map build:watch

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

**[`CODING_GUIDELINES.md`](./CODING_GUIDELINES.md) is normative for every change** — reuse and duplication, type
precision, comment and TSDoc density, barrels and imports, naming, tests, dependencies. Read it before writing
code; a workspace's own `AGENTS.md` adds only what is specific to that workspace.

## Key Files & Directories

| Path | Purpose |
|---|---|
| `core/src/config/globalConfig.ts` | `TomTomConfig` singleton — the single config point for `apiKey`, language, units |
| `map/src/TomTomMap.ts` | Central map class wrapping MapLibre GL JS |
| `map/src/shared/AbstractMapModule.ts` | Base for all map modules; handles style-change restoration |
| `map/src/shared/AbstractStyleOwnedMapModule.ts`, `AbstractDataOwnedMapModule.ts` | The per-kind bases every module extends; hold what differs between the two kinds |
| `services/index.ts` | All service exports (search, geocode, routing, traffic, EV, …) |
| `plugins/agent-toolkit/` | AI agent plugin; see its `AGENTS.md` + `ENGINEERING-GUIDELINES.md` |
| `plugins/viewport-places/` | Plugin: continuously shows POIs in the visible map viewport |
| `plugins/landmarks-3d/` | Plugin: renders Orbis 3D landmark GLB tiles via a Three.js MapLibre custom layer |
| `plugins/map-effects/` | Plugin: post-processing over the rendered map (bloom, grade, tint, fog, edge blur, vignette) and high-DPI capture |
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
