# Agent Toolkit — Scope-aware data tools

The unified `analyseDatasets` / `deriveDatasets` tools, the sandbox their generated code runs in (`createEventRule` and
`clusterIncidents` code too), and per-turn scoping.
See [base reference](../agent-toolkit.md) for setup, [tools.md](./tools.md) for the registry.

---

## Inputs

Both tools take any combination of `placesDatasetIDs` / `routesDatasetIDs` / `incidentsDatasetIDs` / `geometriesDatasetIDs` /
`trafficAreaAnalyticsDatasetIDs` / `byodDatasetIDs` plus a `code` string (a JS function body). The sandbox receives one
per-dataset record per kind — no merged collection:

| Kind (`AnalysableDatasetKind`) | Sandbox identifier | Value per dataset |
|---|---|---|
| `places` | `placesByDataset` | `FeatureCollection` |
| `routes` | `routesByDataset` | `FeatureCollection` |
| `incidents` | `incidentsByDataset` | `FeatureCollection` (`TrafficIncidentDetails`) |
| `customGeometries` | `geometriesByDataset` | polygon array, keyed by the tagged source `${kind}:${id}` (a place's, a range's or a custom geometry's polygons) |
| `trafficAreaAnalytics` | `trafficAreaAnalyticsByDataset` | `FeatureCollection` of tile / hex regions |
| `byod` | `byodByDataset` | `FeatureCollection` |

Span datasets with `Object.values(...)` (`.flatMap((fc) => fc.features)` for collections, `.flat()` for geometries' arrays).

Libraries also injected: `turf`, `h3`, `routeUtils` (core's route section and progress helpers, `getSectionsWithin`,
`getImportantRoads`, `compareRoutes` and `isHairpin` included), `cluster(incidents, params?, previous?, now?)`
(DBSCAN over one dataset's collection or a filtered incident array, `{ eps?, minMembers?, maxClusters?, preFilter? }`). Standing runs (a monitored analysis, a monitor tick) add
`previous`, `now`, `log`.

## `analyseDatasets`

- Extra inputs: `name`, `description?`, `outputFormat?` (`'json'` default, or `'chart'` for a Chart.js config —
  `bar` / `line` / `pie` / `doughnut` / `radar` / `polarArea` / `scatter` / `bubble`), and the required
  `persist`, which says what happens to the result:
  - `'none'` returns the result only. Nothing is recorded and there is no `analysisId`. The model picks it for a
    one-off count, percentage or average it states in chat or feeds into another tool. It can't return a chart:
    `persist: 'none'` with `outputFormat: 'chart'` fails validation.
  - `'attach'` also records the result against every contributing dataset and returns an `analysisId`;
    `monitorAnalysis({ analysisId, enabled })` makes it recompute on every source change later.
  - `'monitor'` records it and recomputes it on every source change from the start. The model picks it for a
    live chart or metric.

## `deriveDatasets`

- Extra inputs: `persist` (required), `label?`, `datasetId?` (overwrite), `operation?`, `show?`, `keepHistory?`,
  `keepEmpty?`.
- `persist: 'none'` writes the new dataset once. `persist: 'monitor'` also re-derives it in place whenever a monitored
  source dataset refreshes, without moving the camera, and reports `monitoring: true`. A new route or search adds
  another dataset, which it doesn't follow. A re-derive that returns nothing empties the dataset, and one that throws or
  returns another kind leaves it as it was. `monitorDerivedDataset({ datasetId, enabled })` toggles it later by the new
  dataset's id.
- `keepHistory: true` with `persist: 'monitor'` also keeps the BYOD dataset `<datasetId>_history`, named by
  `historyDatasetId` in the result and in the `recallState` `derivation`, so the model reads a trend or a peak instead of
  keeping notes. One feature per run that wrote: an empty `GeometryCollection` with `{ at (ISO), features (count),
  <each finite numeric property>: total rounded to 0.1 }`, over 6 h of source-data time and at most 360 samples; a run
  within 20 s of the last replaces it. Read it with `analyseDatasets` (`byodByDataset['<datasetId>_history']`) or watch it
  with `createEventRule`. It goes with the job (`state.derivedDatasets.remove`, a run that finds the dataset gone, its
  sources gone, a reset) and stays while paused. A revision, paused or not, keeps it under the same id, so rules watching
  it survive, and starts the samples afresh; one that sets `keepHistory: false` removes it, unless its code reads it,
  which leaves it as a plain BYOD dataset. None is kept, and none sampled, while the BYOD slice is in `single` mode, nor
  when the code reads its own history or another dataset already holds `<datasetId>_history`.
- A first run whose code returns its `places`, `geometries` or `byod` empty writes nothing and returns `{ error }`, so
  no monitor starts. `keepEmpty: true` with `persist: 'monitor'` writes that dataset empty instead and keeps it live, for
  a watch that matches nothing yet: it fills as its sources change, a `keepHistory` history starts at a zero sample, and
  `drift` measures against the first run that writes features and never counts an empty run. A run that can't follow
  its sources (ranges only, an id shared with a source) keeps no empty dataset and returns `{ error }`. A revision that
  may come back empty sets it again; a revision without it doesn't inherit it.
- Judging and fixing a live one: the dataset's `recallState` detail carries `derivation: { code, sourceDatasetIds,
  monitoring, lastRun?, historyDatasetId? }`, where `lastRun` is `{ at, featureCount, drift? }` or `{ at, error }`. `drift` says how a run
  that wrote strayed from what `deriveDatasets` first wrote (armed or revised): no feature from sources that have some,
  or a property on at least half of the features it first wrote now missing, on under half of the run's, or of a
  non-null type it never had (a narrower mix, or values that were all `null`, don't count). A call whose `datasetId` names
  that dataset and whose code returns the same kind rewrites it in place (same id, label and display), reports
  `revised: true`, and re-derives with the new code; with `persist: 'none'` it stops following its sources. App code
  reads `state.derivedDatasets.lastRun(datasetId)` or subscribes to `state.derivedDatasets.events.on('derived-dataset-run',
  ({ datasetId, run }) => …)`.
- `code` returns one of `{ places }` (optionally with attached `geometries` and `placeConnections`), `{ geometries }`
  (a new `customGeometries` dataset) or `{ byod }`; `fitOnMap` composes with any of them.
- Nothing kept (an empty collection, or `turf.bbox` of one in `fitOnMap`) fails with an error saying no feature
  passed the filter, so the model reports that none matched rather than calling again. With `persist: 'monitor'`, the
  error also offers the `keepEmpty` retry above.

## `clusterIncidents`

Groups incidents into hotspots; scopable too. Unscoped it covers incidents only; scoped, it also accepts the context kinds
(places, routes, …) the query filters against. Optional `code` filters or combines the inputs and returns `cluster(...)`,
in the sandbox; without it the default clustering runs.

---

## Sandbox

- **Browser:** `analyseDatasets` / `deriveDatasets` / `createEventRule` / `clusterIncidents` code runs in a Web Worker inside a sandboxed opaque-origin iframe with CSP
  `default-src 'none'` — no DOM, network or storage. The worker is terminated on timeout (`codeExecution.timeoutMs`,
  default 10 s). The worker libraries load lazily, as a ~770 kB chunk from wherever the app serves the plugin's chunks.
  If the iframe cannot start, the tool returns an error to the model and runs nothing (`console.warn` once); a call
  30 seconds or more later retries. A page with a `document` but no `Worker` fails the same way.
  `codeExecution.allowMainThreadFallback: true` runs the code on the page's main thread instead, NOT isolated,
  and does not retry the iframe.
  `agent.getCodeExecutionMode()` → `CodeExecutionMode`: `'not-started' | 'iframe-worker' | 'unavailable' | 'main-thread'`.
- **Host page CSP** (inherited by the `srcdoc` iframe and its worker): `script-src` needs `'unsafe-inline'` (start-up
  script; ignored, so the start fails, when `script-src` lists a nonce or hash) and `'unsafe-eval'`; `worker-src` (or
  `script-src`) needs `blob:`; `script-src` must also allow the origin serving the plugin's chunks. Each start-up
  signal (iframe script, then worker) must arrive within 2 s; `timeoutMs` bounds runs, not the start.
- **Node / SSR:** main thread, no isolation.
- **Everywhere:** `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `localStorage`, `sessionStorage`, `indexedDB`,
  `document`, `window`, `globalThis`, `self`, `navigator`, `importScripts`, `process` are shadowed to `undefined` —
  a tripwire, not a boundary. The iframe worker also shadows its own `postMessage`, `onmessage`, `addEventListener`,
  `removeEventListener` and `close`, so a run can't take over or end the worker. Code runs with a null-prototype
  `this`, so `this.fetch` finds nothing. Inputs are copied, so code can mutate them.
- **Error hints:** a thrown error reaches the model with a `Hint:`. A read on a `<kind>ByDataset` record the call
  left `undefined` (no matching `*DatasetIDs`) names the input to pass, rather than blaming the code.
  `analyseDatasets`, `deriveDatasets` and `createEventRule` also fail before running when the code reads a literal
  id its call doesn't list (`placesByDataset["hospitals"]`), naming the id and the input to add it to.
- **`executeMaplibreCode`** runs in the host page, unshadowed, so it is not a default tool — add it with
  `createExecuteMaplibreCodeTool()` only when the deployment trusts the model ([tools.md](./tools.md#executemaplibrecode--opt-in)).

```ts
createMapAgent(map, {
    model,
    codeExecution: {
        timeoutMs: 5_000,
        // Self-host the worker libraries; the source must define self.turf and self.h3
        // (plus self.routeUtils / self.cluster if generated code uses them).
        loadWorkerLibrarySource: async () => (await fetch('/sandbox-libs.js')).text(),
    },
});
```

Threat model: [code generation guide](https://docs.tomtom.com/maps-sdk-js/guides/plugins/agent-toolkit/code-generation.md).

---

## Per-turn scope

An unscoped data tool documents every enabled kind with its schema docs. To keep each request small, the classifier emits
`toolScopes[<name>] = { kinds: [...] }` for every scopable tool it picks (`analyseDatasets`, `deriveDatasets`, `createEventRule`,
`clusterIncidents`; `setMapStyling` scopes the same way by knob family, see [tools.md](./tools.md#notes-on-specific-tools)),
and `prepareStep` rebuilds that tool's `description` + `inputSchema` for the turn with only those kinds. Scoped or not, the
helper docs follow the active kinds: the cross-kind cheat-sheet when more than one is active, `routeUtils` with routes,
`cluster` with incidents. `createEventRule` leaves those helper docs out.

- **Contract:** picking a scopable tool without a valid scope fails classifier validation. Two attempts; then the tool keeps
  its unscoped surface for the turn.
- **`classifier: false`:** scoping never engages.
- **`datasets[kind].enabled: false`:** the kind leaves both surfaces and the scope enum.
- **Observe:** `onClassify` receives `activeToolNames` and `toolScopes`:

```ts
onClassify: (result) => {
    console.log(result?.activeToolNames); // ['analyseDatasets', 'recallState']
    console.log(result?.toolScopes);      // { analyseDatasets: { kinds: ['places', 'routes'] } }
},
```

## Add a scopable custom tool

Declare `scopeSchema` + `scopePrompt` and build the entry from a `ToolEntryBuilder` that reads `options.scope`:

```ts
import { z } from 'zod';
import type { ToolEntryBuilder } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

type FleetScope = { kinds: ('vehicles' | 'jobs')[] };

const fleetScopeSchema = z.object({
    kinds: z.array(z.enum(['vehicles', 'jobs'])).min(1),
});

const fleetAnalyseBuilder: ToolEntryBuilder<MyState, FleetScope> = ({ scope }) => ({
    description: scope ? `Analyse ${scope.kinds.join(' + ')} datasets via dynamic JS.` : 'Analyse fleet data.',
    inputSchema: buildFleetSchema(scope),
    execute: executeFleetAnalyse,
    scopeSchema: fleetScopeSchema,
    scopePrompt: 'Emit `{ kinds: ["vehicles" | "jobs"] }` listing only the kinds the user query touches.',
});

createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
    tools: { fleetAnalyse: fleetAnalyseBuilder },
});
```

`scope` is `undefined` at creation and on turns without a scope — return a working unscoped entry then.
