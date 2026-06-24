# Agent Toolkit — Scope-aware data tools

The unified `analyseData` / `processData` tools, the sandbox they execute in, per-turn scoping,
and the `getTrafficIncidents` `where` schema for data loading.
See [base reference](../agent-toolkit.md) for setup, [tools.md](./tools.md) for the registry.

---

## Scope-aware tools

`analyseData` and `processData` are the **two unified data tools** that replace the older per-kind splits
(`analysePlaces` / `analyseRoutes` / `analyseGeometries` / `analyseIncidents`
and `processPlaces` / `processRoutes` / `processGeometries`).
Each takes any combination of
`placesEntryIDs` / `routesEntryIDs` / `incidentsEntryIDs` / `geometriesEntryIDs` / `trafficAreaAnalyticsEntryIDs` / `byodEntryIDs`
and exposes them as sandbox inputs
(`places`, `routes`, `incidents`, `geometries`, `trafficAreaAnalytics`, `byod`, plus `byEntry` partition views).

### Sandbox execution

Detail lives in `tools/shared/sandbox-code.ts` + `multi-input.ts`.

Inputs are **deep-copied so generated code can mutate them in place without corrupting live state —
but the copy lives in `mainThreadExecutor` only** (`cloneDataArg`, which skips `WORKER_PROVIDED_PARAMS`
since `structuredClone` throws on the function namespaces).
The iframe-worker path gets its copy for free via `postMessage`/`structuredClone`,
so `packSandboxArgs` and `runIncidentSpec` (monitor) now pass **live references**
and let each executor copy once, only where needed.

`runSandboxedFn` also binds network/storage/DOM globals (`fetch`, `localStorage`, `document`, `process`, …)
to `undefined` as a tripwire
(`process` matters on the Node main-thread path — first hop to `child_process` → RCE)
(not a boundary — reachable via realm escapes; `executeMaplibreCode` is unshadowed).
See the [code-generation guide](../../../../../documentation/docs-portal/guides/plugins/agent-toolkit/code-generation.mdx)
for the full threat model.

### Pluggable execution (experimental)

`runSandboxedFn` delegates to a `SandboxExecutor`.
The mode is **env-chosen, not configurable** (`resolveSandboxExecutor` + `hasBrowserSandboxApis`):
`iframe-worker` in the browser (**mandatory** — no opt-out),
`mainThreadExecutor` in Node/SSR
(no equivalent boundary there; a `worker_thread` would add only termination while exposing `fs`/`net`/`child_process`).

`MapAgentOptions.codeExecution` only tunes the browser run (`timeoutMs`, `loadWorkerLibrarySource`);
it's resolved onto `state.codeExecution`.

iframe-worker runs analyse/process code in a Web Worker inside a sandboxed opaque-origin iframe (`tools/shared/sandbox/`):
opaque origin + CSP `default-src 'none'` (no DOM/network) + worker termination on timeout (default 5 s);
long-lived frame, warm worker, fresh scope per call.

**Zero-config:** the worker's turf/h3 source plus a bundled `routeUtils` IIFE ship in a separate lazy chunk
(`worker-libs.ts` `?raw`-imports the UMD bundles; turf via the `sandbox-turf-umd` alias and the SDK worker-utilities
(`routeUtils`, …) via the generic `virtual:sandbox-sdk-utils` plugin bundling `sdk-utils-worker-entry.ts` —
both in `vite-sandbox-build.ts`, shared by `vite.lib.config.ts` and `e2e-tests/vite.config.ts`)
loaded only in iframe-worker mode — main bundle stays ~323 kB.
Optional `loadWorkerLibrarySource` overrides the libs.
If the iframe can't initialise at runtime it falls back (loud `console.warn`) to main-thread.

`turf` / `h3` / `routeUtils` are all available in-worker,
and `routeUtils` is now injected into BOTH `analyseData` and `processData`
(shared from `multi-input.ts` via `buildSandboxToolsDoc` + `packSandboxArgs`), so route-slicing runs in the browser.

**First implementation — `e2e-tests/` suite passes (5/5) in real Chromium**
(CSP egress-block, worker termination, opaque-origin isolation, zero-config turf/h3), verifying the boundary;
runs in CI via the dedicated `e2e-test-agent-toolkit-sandbox` job
(`e2e-tests/` → `pnpm test:e2e` / `pnpm e2e-test:agent-toolkit:sandbox` from the root).

### Why scopable

The catch: a tool that documents all 6 input kinds + per-kind schema docs + cross-kind ops cheat-sheet is large
(~5–8 K tokens per tool when unscoped).
To keep cost down, both tools are **scopable**: the classifier emits a `toolScopes[<name>]` value
naming the kinds the turn actually touches,
and `prepareStep` rebuilds the tool's description + inputSchema for that step to mention *only* those kinds.

**Scope shape:**

```ts
type AnalyseDataKind = 'places' | 'routes' | 'incidents' | 'customGeometries' | 'trafficAreaAnalytics' | 'byod';
type AnalyseDataScope = { kinds: readonly AnalyseDataKind[] };

// processData has its own ProcessDataKind / ProcessDataScope with the same shape.
```

The shared union `EntryDataKind` covers all entry-owning slices that show up as data-tool inputs:

```ts
type EntryDataKind =
    | 'places'
    | 'routes'
    | 'incidents'
    | 'customGeometries'
    | 'trafficAreaAnalytics'
    | 'byod';
```

(Distinct from `EntryModeSliceName`, which uses the literal state-slice keys for state-level operations:
`routing` vs `routes`, `customGeometries` vs `geometries`, etc.)

**Classifier contract:** picking a scopable tool *without* emitting its scope is rejected by the classifier
output schema's `superRefine`.
Up to two retry attempts; on persistent failure the tool falls back to the terse unscoped surface (degraded but functional).
When `classifier: false`, scoping never engages and tools use the terse unscoped surface permanently.

**Observability:** `onClassify` receives both the picked tool names and the per-tool scopes:

```ts
onClassify: (result) => {
    console.log('tools:', result?.activeToolNames);   // ['analyseData', 'recallPlaces']
    console.log('scopes:', result?.toolScopes);       // { analyseData: { kinds: ['places', 'routes'] } }
}
```

**Add a scopable custom tool:** declare `scopeSchema` + `scopePrompt`
and produce the entry from a `ToolEntryBuilder` that reads `options.scope`:

```ts
type FleetScope = { kinds: ('vehicles' | 'jobs')[] };

const fleetScopeSchema = z.object({
    kinds: z.array(z.enum(['vehicles', 'jobs'])).min(1),
});

const fleetAnalyseBuilder: ToolEntryBuilder<MyState, FleetScope> = ({ scope }) => ({
    description: scope ? `Analyse ${scope.kinds.join(' + ')} entries via dynamic JS.` : 'Analyse fleet data.',
    inputSchema: buildFleetSchema(scope),
    execute: executeFleetAnalyse,
    scopeSchema: fleetScopeSchema,
    scopePrompt: 'Emit `{ kinds: ["vehicles" | "jobs"] }` listing only the kinds the user query touches.',
});
```

The classifier discovers the new tool's scope via its `scopePrompt`; the prepareStep mutation engages automatically.

---

## `getTrafficIncidents` `where` schema

Traffic-incident loading uses a `where` schema (`within` mode) instead of a top-level bbox.
The same multi-region inputs that `discoverPlaces.where.within` accepts
(`viewport`, `boundingBox`, `queries`, `placeIds`, `geometries`, `range`, `route`)
all resolve to bboxes and are unioned into one bbox for the underlying SDK call.
Default when `where` is omitted: `{ mode: 'within', viewport: true }`.

```ts
// Current viewport
getTrafficIncidents({});

// Named area (geocoded → polygon bbox)
getTrafficIncidents({ where: { mode: 'within', queries: [{ query: 'Paris', queryAs: 'place' }] } });

// Buffered corridor around the latest route
getTrafficIncidents({ where: { mode: 'within', route: { widthMeters: 1000 } } });

// Multi-source union
getTrafficIncidents({
    where: { mode: 'within', queries: [{ query: 'Amsterdam' }], placeIds: ['G55fc4abe-...'] },
});
```

When the classifier picks `getTrafficIncidents` with both a meaningful multi-region field *and* `viewport: true`
(strict-mode LLMs default both), the executor prefers the multi-region intent —
never silently answers with the viewport when the user named a specific area.
