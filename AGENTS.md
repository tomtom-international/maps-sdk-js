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

Optional plugins live in `plugins/` (e.g. `viewport-places`, `agent-toolkit`, `landmarks-3d`) and declare `@tomtom-org/maps-sdk` as a **peer dependency** — they never bundle it.

### Other workspaces

| Workspace | Purpose |
|---|---|
| `shared-configs/` | Shared Vite, TypeScript, and Vitest configs extended by all packages |
| `testing/core-utils` | `@testing/core-utils` — Playwright/async helpers shared by `map-integration-tests` and `ai-eval` (not unit tests) |
| `testing/ai-eval` | AI agent evaluation harness (LLM judge + eval cases for agent-toolkit) |
| `testing/ai-eval-explorer` | Dev UI for browsing and running eval results |
| `examples/` | 95 runnable examples, each a standalone Vite app |
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

- **Tooling**: Biome (not ESLint/Prettier). 4-space indentation, single quotes, 120-char line width. Run `pnpm lint` from root.
- **Package manager**: pnpm workspaces. Add deps with `pnpm -F <workspace> add <pkg>`. Shared version pins live in `pnpm-workspace.yaml` under `catalog:`.
- **Coordinates**: always `[longitude, latitude]` (GeoJSON standard) — enforced throughout services and the agent-toolkit plugin.
- **Map modules**: never `new SomeModule()` directly. The factory names the ownership kind — `await SomeDataModule.create(map)` for data-owned modules (a new independent instance every call), `await SomeStyleModule.get(map)` for style-owned ones (a shared controller over style-provided layers). Reaching for the wrong one does not compile. See the module table below and `documentation/docs-portal/guides/map/modules.mdx`.
- **Error handling in tools/plugins**: every tool `execute` must catch and return `{ error: string }`, never throw.
- **Test placement**: a `tests/` subdirectory **beside the source it covers** — `src/<area>/tests/<Name>.test.ts`, or `src/tests/` for files sitting directly in `src/`. Never a sibling `<Name>.test.ts`. Live-API tests sit there too, suffixed `*Integration.test.ts` (all in `services/` today), and nothing excludes them — so `pnpm test:sdk` makes real API calls, keyed by `API_KEY_TESTS` from `shared-configs/.env*` locally and a CI secret.
- **Shared build config**: packages extend `shared-configs/` for Vite, TypeScript, and Vitest — modify there to affect all packages.
- **TypeScript**: strict mode, no `any`, no unnecessary casts.
- **Variable naming**: always use full, descriptive names — never abbreviate. Use `response` not `res`, `request` not `req`, `error` not `err`, `parameters` not `params`, `configuration` not `config`, `index` not `idx`, `element` not `el`, `reference` not `ref`, `argument` not `arg`, `destination` not `dest`, `source` not `src`, `message` not `msg`, `previous` not `prev`, `current` not `curr`.
- **No spaghetti code**: a function is spaghetti if it is both longer than one screen (~50 lines) and has complex nested logic (deeply nested conditions, loops within loops, etc.). If both conditions are met, extract the nested blocks into named functions whose names make the intent self-evident.
- **Blank line after single-line `if`**: always add a blank line after a single-line `if` (i.e. an `if` with no `else` whose body is a single statement or early-exit) when it is followed by more code. This makes it visually distinct from the code that follows. Biome does not enforce this — apply it manually.
- **Arrow functions**: prefer arrow function syntax (`const fn = () => ...`) over `function` declarations. One-liner arrows that return a single expression omit the curly braces and `return` keyword (e.g. `const double = (x: number) => x * 2`).
- **Shortest import path**: when a module barrel (`index.ts`) already exports the symbol you need, import it from the barrel instead of reaching for the file behind it — `from '../../shared'`, not `from '../../shared/types/commonRoutingParams'`. Use the deep path only when the barrel does not export the symbol, or when the importing file sits inside that barrel's own subtree (importing your own barrel makes a cycle). Drop a trailing `/index` as well: `from '../..'`, not `from '../../index'`.
- **No re-exports**: do not re-export types or values that originate elsewhere — always import directly from the canonical source. Barrel re-exports that just forward a symbol from another module add indirection without value.
- **Reuse core utilities**: before writing a local helper for geometry, bbox, distance, formatting, or any other generic operation, check `core/src/util/` (exported via `@tomtom-org/maps-sdk/core`). The same applies to `services/` helpers when working in higher layers. Only add a new local helper when nothing in the canonical location fits.
- **Document the end state, not the change**: guides, TSDoc and code comments describe how the SDK works today. Never write what was removed, renamed or fixed — "there is no `hybrid` ID", "this no longer throws", "the option used to be ignored". The diff, the PR and the changelog carry the history; a doc that carries it too ages badly and doubles the noise. When the removal leaves a fact worth knowing, state the fact on its own ("`satellite` draws roads and labels over the imagery"); otherwise delete the sentence along with the code.
- **Cross-file consistency**: when renaming or removing a public symbol (tool, type, slice, helper, schema), sweep `git grep -l '<oldName>'` across `plugins/`, `examples/`, `documentation/docs-portal/`, and `.claude/skills/` — descriptions, JSDoc, navigation entries, and skill trigger keywords all go stale silently. The `tomtom-maps-sdk-js-preflight` skill walks the full set of surfaces before pushing, alongside the gates CI runs.

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
