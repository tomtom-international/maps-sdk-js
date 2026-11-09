# Agent Toolkit — State

The `ToolState` slices, their module accessors, the tagged geometries id, custom slices, dataset mode, and the state digest.
See [base reference](../agent-toolkit.md) for setup and `MapAgentOptions`.

---

## `ToolState` slices

Live state, shared by tools and your app via `agent.state`. Dataset slices keep an append-only history of plain-data
datasets: `{ id, label, timestamp, data, producedFrom }`. `data` is always a GeoJSON `FeatureCollection` — places a `Places`,
routes `Routes`, incidents `TrafficIncidentDetails`, custom geometries `PolygonFeatures`, ranges one polygon per origin
and budget whose properties carry `origin`, `budget` and `originQuery` (`rangesOf(data)` regroups them as
`ReachableRange[]`). `producedFrom` records what re-produces the data, and is required where it exists: routes
`{ waypoints, parameters }`, incidents the area and filters, area analytics the request, custom geometries
`{ sourceIds, operation? }`; BYOD's source defaults to `{ kind: 'integrator' }`; places and ranges have none. What a slice
draws beside a dataset stays on the slice, keyed by dataset id: `places.getDatasetGeometries(id)` / `getDatasetConnections(id)`,
`byod.getDatasetLayers(id)`. Every dataset slice shares one surface:

- history — `datasets`, `latestDataset`, `findById(id)`, `findFeature(featureId)` → `{ feature, dataset }` (newest first),
  `profile(id)` (a `DatasetProfile`: feature count, geometry types, properties);
- writes — `addDataset({ label, data, producedFrom, id?, timestamp? })` (a taken `id` gets `-2`, `-3`, …),
  `replaceDatasetData(id, data, timestamp)`, `removeDataset(id)`, `datasetMode` / `setDatasetMode(mode)`;
- map — `showDataset(id, options?)`, `hideDataset(id)`, `shownDatasetIds`, `getDatasetModule(id)`. The slice keeps each
  dataset's SDK modules apart from it, created lazily on first display (all accessors are `async`). Showing a dataset needs
  the map the agent was created with. Pass `undefined` for that map when the agent only reads datasets. `baseMap.hasMap`
  is then false, and showing, moving or styling throws;
- focus — `setFocus(id, featureIds, reason?)` → `{ focusedCount, droppedIds }`, `getFocus(id)` (a `DatasetFocus`), `clearFocus(id)`,
  `focusedFeatures(id)`, the `focus-change` event (only `trafficIncidents` highlights it on the map);
- monitors — `startMonitoring(id, { fetch }, { intervalMs?, skipInitialTick? })` (`{ fetch }` is a `DatasetRefresh`),
  `stopMonitoring(id)`, `isMonitored(id)`, `getMonitorStatus(id)` (`'idle' | 'running' | 'stopped-error'`);
  each tick replaces the data and fires `monitor-tick` with `snap`, a `DatasetSnapshot` `{ takenAt, data }`; `monitor-start`, `monitor-stop`
  (`reason: 'manual' | 'error'`) and `monitor-error` bracket it.

| Slice | Holds | Module accessors |
|---|---|---|
| `places` | Place datasets; `getDatasetGeometries(id)` / `getDatasetConnections(id)` for what came with one; `showDataset(id, { markerType? })` | `getDatasetModule(id, markerType?)`, `getDatasetGeometriesModule(id, fillStyle?)`, `findDatasetGeometriesModule(id)` (sync, may be `undefined`) |
| `routing` | Route datasets, planning waypoint slots, route `params`; `showDataset(id, { showWaypoints?, showSummaryBubbles? })` | `getDatasetModule(id)` |
| `ranges` | Reachable-range datasets — origins, budgets, polygons; `showDataset(id, { polygons?: 'ranges' \| 'geometries' \| 'none', fillStyle?, originPins? })`, an omitted option keeping how a shown dataset draws (omitted `polygons` after `'none'` draws the bands, unless the call sets only `originPins`; a hidden dataset draws bands and origin pins) | `getDatasetModule(id, fillStyle?)`, `getDatasetGeometriesModule(id, fillStyle?)`, `getDatasetPlacesModule(id)` |
| `customGeometries` | Polygons derived by `deriveDatasets` (union, difference, h3 coverage, …); `showDataset(id, { fillStyle?, mode? })` | `getDatasetModule(id, fillStyle?)` |
| `byod` | Customer GeoJSON datasets with an inferred `DatasetProfile` — [byod.md](./byod.md) | `getDatasetModule(id)` (`CustomGeoJSONModule`) |
| `trafficIncidents` | Fetched incident datasets, focused subsets, the live monitor; `showDataset(id, { fitBounds? })` | `getDatasetModule(id)` (`TrafficIncidentDetailsModule`) |
| `trafficAreaAnalytics` | Area-analytics datasets; `getDatasetConfig(id)` is its module's display config, or nothing before the module exists | `getDatasetModule(id)` (`TrafficAreaAnalyticsModule`) |
| `baseMap` | The `TomTomMap` (`ttMap`) and its MapLibre map (`mapLibreMap`); `hasMap` is false without one, and both then throw | `getBaseMapModule()`, `getStylingFoundationsModule()`, `getTerrainModule()` |
| `trafficTiles` | Traffic flow / incident tile overlays | `getTrafficFlowModule()`, `getTrafficIncidentsModule()` |
| `mapPOIs` | Base-map POI layer | `getPOIsModule()` |

Each dataset slice holds its modules' look as a `SliceKnobs` — `routing.knobs`, `places.knobs` / `places.geometriesKnobs`,
`ranges.knobs` / `ranges.geometriesKnobs` / `ranges.placesKnobs`, `customGeometries.knobs`, `trafficAreaAnalytics.knobs`,
`trafficIncidents.knobs`: `set(id, value)` / `reset(id)` / `resetAll()` / `values` by the module catalogue's ids, applied to
every module of that kind the slice holds and to each one it creates later (`setMapStyling` writes through them).
`trafficAreaAnalytics` shows a dataset's `activeMetric` only if the dataset fetched it, else its first metric.

Session-level fields: `analyses` (every `analyseDatasets` result), `trackers`, `engine` (re-runs monitored analyses and
trackers when their source datasets change), `codeExecution` (the sandbox executor).

Common reads from app code:

```ts
agent.state.routing.currentRoutes;   // most recent Routes
agent.state.places.latestPlace;      // places of the most recent dataset
agent.state.places.datasets;          // full history
agent.state.places.shownDatasetIds;    // ids currently on the map
agent.state.byod.latestDataset;        // most recent BYOD dataset
agent.state.baseMap.mapLibreMap;     // raw maplibre-gl Map
```

Writers for custom tools: `state.places.addDataset({ label, data: places, connections?, geometries?, id? })`,
`state.byod.addDataset({ label, data, layers?, producedFrom?, id? })`, a `BYODDatasetInput` (BYOD's `producedFrom` defaults to `{ kind: 'integrator' }`).

---

## Tagged geometries id

`recallState({ slice: 'geometries' })` and the data-tool `geometriesDatasetIDs` input take tagged ids selecting polygons from
four sources:

```ts
type GeometriesIdKind = 'place' | 'places' | 'ranges' | 'customGeometries';

// { kind: 'place', id: '<placeId>' }            → one place's footprint
// { kind: 'places', id: '<placesDatasetId>' }     → every footprint in a places dataset
// { kind: 'ranges', id: '<rangesDatasetId>' }     → every polygon in a ranges dataset
// { kind: 'customGeometries', id: '<datasetId>' } → a dataset deriveDatasets wrote
```

---

## Custom state slice

```ts
import type { StateSlice, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

class FleetState implements StateSlice {
    vehicles = new Map<string, VehiclePosition>();
    reset() { this.vehicles.clear(); }
}

interface MyState extends ToolState {
    fleet: FleetState;
}

createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});
```

`destroy()` calls `reset()` on every slice that implements `StateSlice`, built-in and custom. The `resetState` tool calls it on every custom one too.
The model only knows what a tool returns this turn — give it a tool that reads the slice back.

---

## Dataset mode

`DatasetMode` is `'multiple'` (default — several datasets on the map) or `'single'` (only the latest stays; switching drops
the rest). Slices: `places`, `routing`, `ranges`, `customGeometries`, `byod`, `trafficAreaAnalytics`, `trafficIncidents`
— exported as `DATASET_MODE_SLICE_NAMES` / `DatasetModeSliceName` (slice keys, not `AnalysableDatasetKind`s):

```ts
import { DATASET_MODE_SLICE_NAMES } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

for (const slice of DATASET_MODE_SLICE_NAMES) {
    console.log(slice, agent.state[slice].datasetMode);
}
await agent.state.routing.setDatasetMode('single');
```

- Defaults per kind: `createMapAgent(map, { datasets: { routes: { datasetMode: 'single' } } })`.
- The model switches it with the `setDatasetMode` tool (*"only show one route at a time"*).

---

## State digest — tell the model what the user changed

When your UI changes the map between turns, diff two digests and prepend the summary to the next prompt:

```ts
import { formatStateDigestDiff, getStateDigest } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

let baseline = getStateDigest(agent.state);              // after each assistant turn
// … user clicks around …
const diff = formatStateDigestDiff(baseline, getStateDigest(agent.state)); // before the next prompt
const prompt = diff ? `${diff}\n${userText}` : userText;
```

`StateDigest` covers what is shown for places, routes, ranges, traffic, incidents, custom geometries and BYOD;
the diff is `null` when nothing changed.
