# Agent Toolkit — Tools

The tool registry, the `ToolEntry` shape, and how to add / replace / remove tools.
See [base reference](../agent-toolkit.md) for setup and `MapAgentOptions`.

---

## `DEFAULT_TOOLS` registry

Flat record of the 35 default tools; `TOOL_NAMES` lists their names and `ToolName` is the union type.
`executeMaplibreCode` is not one of them — see [`executeMaplibreCode` — opt-in](#executemaplibrecode--opt-in).

- **Location**: `locatePlace`, `reverseGeocode`, `getCurrentLocation`, `getViewport`, `calculateBBox`
- **Places & search**: `discoverPlaces`, `getPOICategoryCodes`. `discoverPlaces` asks for the next seven days of opening
  hours and each place's time zone, and takes `chargers: { minPowerKW?, maxPowerKW?, connectors? }`, which alone
  searches charging locations. Its result lists five places, each with `distance` (whole metres), `openingHours:
  { openNow?, today?, closesAt?, opensAt?, openDays? }` and a charging park's `connectors`, and counts every place it
  returned `byCategory`, every charging park `byConnector` (`{ connectorType, ratedPowerKW, stations, connectors }`)
  and how many are `openNow`. `moreMatched: true` says the search hit its limit (100, or the detour `limit`), so the
  counts cover only those places. A listed place's hours say whether that one is open now or on a given day; which of
  the others are open is `analyseDatasets`. `deriveDatasets` and `recallState` on a places dataset return the same
  counts and per-place fields. `locatePlace` of a venue returns `distance`, `openingHours` and `connectors`.
- **Routing**: `setRoute`, `editRouteWaypoints({ replace?, remove?, origin?, destination?, stops?, show? })` — every edit in one
  recalculation, applied in that order; `stops` go where they fit best along the route
- **A point along a route**: `alongRoute: { routeId?, travelTimeSeconds | distanceMeters }` ("1 hour into the drive",
  "50 km in") reads the point off the selected alternative of a stored route, shown or hidden, with no recalculation.
  `moveCamera`'s `where` flies there, the `nearby` bias of `discoverPlaces` and `locatePlace` searches around it, and
  `reverseGeocode` names the place there. Each returns
  `routePoint: { routeId, routeIndex, position, travelTimeInSeconds, distanceInMeters }`; a hidden route uses index 0,
  and a value past the end lands on the destination
- **A part of a route**: `stretch` on `discoverPlaces` (`where.route` or `maxDetour`) and `getTrafficIncidents`
  (`where.route`) keeps part of the selected alternative. `from` and `to` are each `travelTimeSeconds` or
  `distanceMeters`, the same fields as `alongRoute`, or `percent` of the length; `last` is the final part in those
  fields. Countries (ISO alpha-2 or alpha-3) and section types narrow it further. A hidden route uses alternative 0,
  and a value past the end lands on the destination. The result's `searchedStretch` names the alternative and the
  parts covered. `maxDetour` searches the selected alternative with or without a stretch. A point into the drive stays
  `alongRoute`
- **Reachable areas**: `findReachableAreas({ origins, budgets, show, fillStyle?, originPins?, fitBounds?, hidePreviousDatasets? })` → `{ datasetId, ranges, skipped? }` — calls `calculateReachableRanges`, in private preview: the API key needs Calculate Reachable Range access ([routing.md](../routing.md#reachable-ranges-isochrones))
- **The camera after a show**: every tool whose `show` is a boolean (`setRoute`, `editRouteWaypoints`,
  `findReachableAreas`, `getTrafficAreaAnalytics`, `getTrafficIncidents`) takes `fitBounds`, default `true`; `false`
  shows the result and keeps the map where it is. `updateDatasetDisplay`'s `fitBounds` defaults to fitting when the
  call names datasets to show (`add` / `addMatching`) or a focus finds sections, so a restyle of the latest dataset
  keeps the camera where it is. The places and BYOD tools, whose `show` is an
  object, take its `zoomMode: 'auto' | 'none'`
- **BYOD**: `addByodSource`, `setByodLayers` — [byod.md](./byod.md)
- **Traffic incidents**: `getTrafficIncidents`, `clusterIncidents`, `focusIncidents`
- **Live refresh**: `setDatasetMonitor({ slice: 'routing' | 'trafficIncidents', datasetId, enabled, intervalMs? })` → `{ slice, datasetId, enabled, alreadyInState }` — re-fetches a route (live-traffic delays) or an incidents dataset on a cadence (default 60 s)
- **Traffic area analytics**: `getTrafficAreaAnalytics` (the look is `setMapStyling`'s)
- **Event rules (geofence / proximity alerts)**: `createEventRule`, `clearEventRule`; `recallState({ slice: 'eventRules' })` reads them; app-defined watches: the `createEventRule` function ([below](#create-an-event-rule-in-a-custom-tool))
- **Data tools (scopable)**: `analyseDatasets`, `deriveDatasets`, `monitorAnalysis`, `monitorDerivedDataset` — [data-tools.md](./data-tools.md); app-defined derivations: the `deriveDatasets` function ([below](#derive-a-dataset-in-a-custom-tool))
- **Map display**: `updateDatasetDisplay` — which datasets of a slice show, and the display options their tool
  took, such as a polygon's fill; colours and widths are `setMapStyling`'s
- **Map control**: `moveCamera({ where?, zoomBy?, pitch?, bearing? })` (`where` is `{ boundingBox, padding? }` or
  `{ position, zoom? }` or `{ alongRoute, zoom? }`, not with `zoomBy`), `setMapStandardStyle`, `setMapLocale`
- **Map styling**: `setMapStyling` — what the base map shows (layer groups, POI icons, the live traffic overlays) and how it looks, and the look of every layer the agent drew
- **MapLibre direct**: `getMapStyleLayers`, `setLayerProperties` (`changes: [{ layerId, paint?, layout? }]`)
- **State**: `recallState`, `setDatasetMode`, `resetState`
- **Utilities**: `clarifyIntent`, `help`

Names are stable; reference entries as `DEFAULT_TOOLS.locatePlace`. Nine entries are builders (`ToolEntryBuilder`):
`discoverPlaces`, `analyseDatasets`, `deriveDatasets`, `createEventRule`, `clusterIncidents`, `recallState`, `setMapStyling`,
`updateDatasetDisplay`, `setDatasetMonitor`.

`TOOLS_BY_DATASET_KIND` maps each `DatasetKind` to the tools dropped when `datasets[kind].enabled` is `false`.
`updateDatasetDisplay` and `setDatasetMonitor` narrow their `slice` to the enabled kinds; `setDatasetMonitor` is dropped
once `routes` and `incidents` are both disabled.
`getDefaultToolPrompts()` returns `Record<ToolName, readonly string[]>` of every tool's `examplePrompts` — chat-UI starter
suggestions from the same source as the `help` tool.

### Notes on specific tools

- **`setMapStyling`** — `{ set?, reset?, preset?, theme? }`, applied in the order reset → preset → theme → set.
  `set` takes every knob id of the `StylingFoundationsModule`, `BaseMapModule`, `POIsModule`, `TrafficFlowModule`,
  `TrafficIncidentsModule` and `TerrainModule` catalogues, under the map-wide prefixes `''`, `pois.`, `traffic.flow.`,
  `traffic.incidents.` and `terrain.`: `labels.sizeFactor`, `groups.buildings3D.visible`, `pois.visible`,
  `pois.filters.categories.values`, `traffic.flow.visible`, `traffic.incidents.filters.magnitudes.values`,
  `terrain.elevation.visible`, … (not the base map's `buildings3D.hover.*` and `buildings3D.click.*`, which show only under
  a base-map event handler the agent never registers); `reset: true` resets every knob, visibility included, or pass ids; `preset` calls `applyMapPreset`;
  scopable: the classifier emits `{ kinds }` from `look`, `baseMap`, `pois`, `trafficFlow`, `trafficIncidents`, `terrain`
  and the `set` description lists only those families' ids, a long value list several knobs share (the label fonts,
  road categories) written once as `$name = …`, while any id stays settable; an unknown id is refused with
  the closest ones (`did you mean pois.label.color?`);
  the layers the agent drew take their module catalogues under `places.` (`PlacesModule`, the ranges' origin pins too),
  `routes.` (`RoutingModule`), `geometries.` (custom geometries, place boundaries, ranges drawn as geometries),
  `ranges.` (`ReachableRangesModule`), `traffic.areaAnalytics.` and `traffic.incidentDetails.`, minus `visible`,
  `markerType` and `fill.style`, which the display tools set per dataset; families `places`, `routes`, `geometries`,
  `ranges`, `trafficAreaAnalytics`, `trafficIncidentDetails`; each slice's `SliceKnobs` (`state.routing.knobs`,
  `state.places.geometriesKnobs`, …) sets the knob on every module of that kind and on each one created later;
  `theme: { colors | imageUrl, mode }` themes the map and returns `switchedStyle` when it had to switch the standard style.
  See [map-styling.md](../map-styling.md), [map-theming.md](../map-theming.md).
- **`setMapLocale`** — `{ language?, geopoliticalView? }`, at least one. Sets each on the map and in `TomTomConfig`,
  so later searches follow; `geopoliticalView` from `geopoliticalViews`, `null` resets to the default view.
- **`setRoute`** — requests every travel time (`computeTravelTimeFor: 'all'`) and, besides the default sections,
  `curve` and `curvyStretch`, which the SDK finds in the geometry with no extra request (no guidance, so a turn at a
  junction counts as a curve). Each route summary also carries
  `sectionCounts` (`tollRoad`, `ferry`, `traffic`, … above zero), the `countries` crossed (ISO3), `via`, its main
  roads (`getImportantRoads`; among alternatives, those on its `sections.distinct`), and `timeInCurvesPercent`, the
  share of its travel time in curves (absent below 0.5%). An alternative adds
  `comparedToBest: { adds?, avoids? }`, the section counts it takes on and stays clear of against route 0
  (`compareRoutes`). A route held up by traffic adds `jams: { count, first }`, `first` being the jam met first:
  `startsAfterMeters`, `lengthInMeters`, `delayInSeconds`, its `road` and `categories`. `editRouteWaypoints` and `recallState({ slice: 'routing', id })` return the same summary.
  It takes no display options beyond `show` and `fitBounds`: the pins are `updateDatasetDisplay`'s `waypoints`, the summary bubbles
  `setMapStyling`'s `routes.summaryBubbles.visible`.
- **`updateDatasetDisplay`** — `{ slice, add?, remove?, addMatching?, removeMatching?, drop?, fitBounds?, … }` shows,
  hides or drops datasets of one slice; `{ clear: true }` with no `slice` hides everything every slice draws. A builder:
  the `slice` enum drops the slices of disabled kinds, but `ranges` always stays. Places add `markerType` and `geometry` (boundaries). Routing
  adds `waypoints`, `selectedIndex`, `focus` and `planningSlots: true`, which shows the staged waypoints without a route.
  Ranges add `fillStyle` and `originPins`, custom geometries `fillStyle`: each display option a producer took when it drew
  the dataset changes here, never by recalculating it.
  `waypoints: false` hides a dataset's pins, which monitor ticks and re-shows keep until the dataset is hidden
  (`RoutingState.setWaypointsShown`, or `showDataset(id, { showWaypoints })` for a hidden one); `selectedIndex` calls `RoutingModule.selectRoute`; `focus: { sectionTypes?, roads?, pick? }`
  rings sections of each targeted dataset's selected route with `setSectionFocus` and fits the camera to them, and
  `focus: null` clears the ring. `sectionTypes` are the counted types plus `motorway`, `distinct`, `leg`, `country`,
  `curve` and `curvyStretch`, `roads` match road numbers or street names, and `pick` is `'all'` (default), `'longest'`,
  `'mostDelay'`, `'curviest'` (highest `curvinessScore`) or a 0-based index in driving order. Drawing every curve is
  `setMapStyling`'s `routes.sections.curve.visible` and `routes.sections.curvyStretch.visible`. With no `add` / `addMatching`, the display fields of places, routing, ranges and custom geometries target the latest dataset; the result's `focused` lists
  each dataset's `sectionCount` and `lengthInMeters`. The camera moves only for `add` / `addMatching` or a focus that
  finds sections. A monitor tick keeps the selected alternative and rings the same focus on the recalculated route.
- **Errors** — a failed TomTom service or map call returns `{ error, code }`, `code` being the `SDKErrorCode`, the
  error text ending with whether retrying helps.
- **`recallState`** — reads state, never fetches. No args: session snapshot (places / routing / ranges index, dataset
  modes, map style, POIs, traffic). `{ slice }`: that slice's index; `routing`'s also lists the `planningSlots` staged for
  the next `setRoute`. `{ slice, id }`: one dataset's summarised detail. Slices: `places`, `routing`, `ranges`,
  `geometries`, `byod`, `trafficIncidents`, `trafficAreaAnalytics`, `eventRules` (each event rule, whether it's firing, and
  its alert log; `id` narrows to one, `sinceMs` to the newer events).
- **`help`** — `{ mode: 'summary' | 'detail', query?, tag? }`, surfacing each tool's `description`, `examplePrompts` and `relatedTools`.
- **`setDatasetMode`** — `{ slice, mode }`; see [state.md](./state.md).

---

## `ToolEntry` shape

```ts
type ToolEntry<S extends ToolState = ToolState, Scope = unknown> = {
    description: string;            // sent to the model
    inputSchema: z.ZodType;         // Zod-validated input
    outputSchema?: z.ZodType;       // structured output (dropped when outputSchemas: false)
    execute: (input: any, state: S, options?: ToolExecuteOptions) => Promise<any>; // never throw — return { error }

    // classifier and help metadata
    classificationPrompt?: string;  // one-liner the classifier reads (never the description)
    tags?: string[];                // category labels, filterable in help
    examples?: string[];            // in the ToolMetadata a custom classifier receives
    examplePrompts?: string[];      // shown by help
    relatedTools?: string[];        // listed by help
    dependsOn?: string[];           // tools that must run first; shown to the classifier

    // loop control
    alwaysActive?: boolean;         // active every step regardless of the classifier
    endsTurnOnCall?: boolean;       // calling it stops the loop (e.g. a tool whose UI collects the answer)

    // per-turn scope — data-tools.md
    scopeSchema?: z.ZodType<Scope>; // shape of `toolScopes[name]` the classifier emits
    scopePrompt?: string;           // explains the scope shape to the classifier
};
```

The agent makes a `z.object` `inputSchema` strict, a scope's rebuilt one too: a top-level key the model invents fails the call with `Unrecognized key: "<name>"`, which the model sees and can correct, rather than vanishing from `input`. Nested objects keep Zod's default and strip unknown keys. The SDK services behave the same way for their own parameters (`services-config.md`).

### Cancellation — `options.signal`

`execute`'s third argument carries the AI SDK's `abortSignal` for the call, which fires when the turn is cancelled:

```ts
type ToolExecuteOptions = { signal?: AbortSignal };
```

Forward it to every `@tomtom-org/maps-sdk/services` call; an aborted call rejects with `SDKAbortError`:

```ts
import { geocode, SDKAbortError } from '@tomtom-org/maps-sdk/services';

execute: async ({ query }, state, options) => {
    try {
        const results = await geocode({ query, signal: options?.signal });
        // ...
    } catch (error) {
        if (error instanceof SDKAbortError) return { error: 'Cancelled.' };
        return { error: `Search failed: ${error instanceof Error ? error.message : String(error)}` };
    }
},
```

**Never forward it into work that outlives the turn** (a monitor tick, a deferred job): it has already aborted by then,
and a monitor treats a rejected tick as fatal and clears its interval.

### Builders — `ToolEntryBuilder`

```ts
type ToolEntryBuilder<S, Scope = unknown> = (options: ToolBuildOptions<Scope>) => ToolEntry<S, Scope>;

type ToolBuildOptions<Scope = unknown> = {
    featureFlags?: FeatureFlags;
    scope?: Scope;                            // undefined at creation and when the turn emitted no scope
    enabledDataKinds?: readonly AnalysableDatasetKind[]; // kinds left enabled by datasets
};
```

Builders are called once at creation and again per turn when scoped — [data-tools.md](./data-tools.md).

---

## Add a custom tool

```ts
import { z } from 'zod';
import type { Place } from '@tomtom-org/maps-sdk/core';
import type { ToolEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

const getFleetVehicle: ToolEntry = {
    description: 'Get the current map position of a fleet vehicle by ID and add it to the places history.',
    classificationPrompt: 'Locate or display a fleet vehicle on the map by its ID.',
    inputSchema: z.object({ vehicleId: z.string() }),
    execute: async ({ vehicleId }, state) => {
        const position = await fleetApi.getPosition(vehicleId);
        const place: Place = {
            type: 'Feature',
            id: `vehicle-${vehicleId}`,
            geometry: { type: 'Point', coordinates: position },
            properties: {
                type: 'POI',
                address: { freeformAddress: '' },
                poi: { name: `Vehicle ${vehicleId}`, categories: [], localizedCategories: [] },
            },
        };
        // Appends a places dataset; the model shows it with updateDatasetDisplay.
        const datasetId = await state.places.addDataset({ label: `Vehicle ${vehicleId}`, data: { type: 'FeatureCollection', features: [place] } });
        return { vehicleId, datasetId, position };
    },
    tags: ['location'],
    examplePrompts: ['Where is vehicle TT-001?', 'Show fleet vehicle on the map'],
};

createMapAgent(map, { model, tools: { getFleetVehicle } });
```

### Resolve a place in a custom tool

`locatePlace(query, queryAs, bias?, executeOptions?)` runs the `locatePlace` tool's lookup and returns the best `Place` or `null`
(`queryAs`: `'poi'` searches points of interest, `'place'` geocodes). `getViewportBias(state.baseMap)` returns the map centre as
`[lng, lat]`, or `undefined` below zoom `MIN_VIEWPORT_BIAS_ZOOM` (6). A failed or cancelled lookup rejects:

```ts
import { getViewportBias, locatePlace } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

execute: async ({ name }, state, options) => {
    try {
        const position = getViewportBias(state.baseMap);
        const place = await locatePlace(name, 'poi', position && { position }, options);
        if (!place) return { status: 'not_found' };
        return { datasetId: await state.places.addDataset({ label: name, data: { type: 'FeatureCollection', features: [place] } }) };
    } catch (error) {
        return { error: `Lookup failed: ${error instanceof Error ? error.message : String(error)}` };
    }
},
```

### Create an event rule in a custom tool

The `createEventRule(state, parameters, executeOptions?)` function is the `createEventRule` tool's `execute`: it dry-runs `parameters.code`, registers the
event rule, re-runs its code whenever a watched dataset changes, and returns the same result (`ruleId`, `watching`,
`firingNow`, `summary`) or `{ error }` (`CreateEventRuleResult`). `parameters` (`CreateEventRuleParams`) is `SomeMultiInputIds` (the `*DatasetIDs` fields, at least
one, of datasets already in state; a call with none doesn't compile) plus `name` (slugged into the id), `condition` (display text) and `code` (sandbox JS
returning `{ active, members, summary }`, `featureIds` as strings (any other id fails the creation-time gate, and drops a re-run's verdict), reading `byodByDataset[id]` etc. as in [data-tools.md](./data-tools.md)).
Optional `resolveAfterMs` (app code only; the tool's schema doesn't offer it) holds the resolve until the verdict has
stayed inactive that long in source-data time (the datasets' latest `timestamp`, not the wall clock): a verdict active
again meanwhile keeps the open alert with no new `opened`, so a feed that flickers each refresh doesn't churn
opened/resolved. The hold is checked only when the rule recomputes, so it resolves at the first recompute after the hold,
and a rule whose datasets stop changing stays open past it. Without it, the first inactive verdict resolves. A negative or
non-finite value returns `{ error }`; `eventRuleParamsOf` gives it back.
Remove it with `state.eventRules.unregister(ruleId)`, never add one with `state.eventRules.register` (it stores the record
without its job, so it never fires); alerts arrive as `rule-event` on `state.eventRules.events`.

Use it when the app knows the watch in advance: a compact tool (`watchZone({ zone })`) instead of `createEventRule`, whose
schema is several thousand characters per request and whose code the model must write. Interpolate only trusted values
into `code`, e.g. a `z.enum` value or `JSON.stringify(value)`.

```ts
import { createEventRule } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

inputSchema: z.object({ zone: z.enum(['north', 'south', 'harbour']) }),
execute: async ({ zone }, state) => {
    const quoted = JSON.stringify(zone);
    return createEventRule(state, {
        byodDatasetIDs: ['vehicles'],
        name: `zone-${zone}`,
        condition: `A vehicle is in the ${zone} zone`,
        code: `const hits = byodByDataset.vehicles.features.filter((f) => f.properties.zone === ${quoted});
return { active: hits.length > 0, members: [{ datasetId: 'vehicles', featureIds: hits.map((f) => String(f.id)) }], summary: hits.length + ' vehicle(s) in ' + ${quoted} };`,
    });
},
```

### Derive a dataset in a custom tool

The `deriveDatasets(state, parameters, executeOptions?)` function is the `deriveDatasets` tool's `execute`: it runs
`parameters.code` in the sandbox, writes one new places, custom-geometries or BYOD dataset, and returns the same result
or `{ error }` (`DeriveDatasetsResult`). `parameters` (`DeriveDatasetsParams`) is `SomeMultiInputIds` (the
`*DatasetIDs` fields, at least one, of datasets already in state; a call with none doesn't compile) plus `code` (sandbox
JS returning `{ places?, placeConnections?, geometries?, fitOnMap?, byod? }`, as in [data-tools.md](./data-tools.md)),
`persist` (`'none'` writes once, `'monitor'` re-derives in place whenever a source changes), and optional `label`,
`datasetId`, `operation`, `show`, `connectMarkerType`, `keepHistory` (a monitored run also samples each run into the BYOD
dataset `historyDatasetId` names, `<datasetId>_history`, as in [data-tools.md](./data-tools.md), so an app or event rule
reads the trend without sampling it itself), `keepEmpty` (a monitored run whose code returns its output empty still
writes it and keeps it live). `monitoring: true` in the result confirms a monitored run (a ranges-only read, or an id
shared with a source, stays one-shot; a first run that writes nothing returns `{ error }` and starts no monitor, unless
`keepEmpty` is set); stop it with `state.derivedDatasets.remove(datasetId)`. A `datasetId` naming a monitored dataset
of the kind the code returns rewrites that one in place instead (`revised: true`, as in [data-tools.md](./data-tools.md)).
A BYOD result has no layers, so it draws nothing until you give it some ([byod.md](./byod.md)).

Use it when the app knows the derivation in advance: a compact tool (`showLateVehicles({ minutes })`) instead of
`deriveDatasets`, whose code the model must write. Interpolate only trusted values into `code`, as for `createEventRule`.

```ts
import { deriveDatasets } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

inputSchema: z.object({ minutes: z.number().int().min(1).max(120) }),
execute: async ({ minutes }, state) =>
    deriveDatasets(state, {
        byodDatasetIDs: ['vehicles'],
        label: `Late by ${minutes} min or more`,
        code: `const v = byodByDataset.vehicles;
return { byod: { ...v, features: v.features.filter((f) => f.properties.delayMinutes >= ${minutes}) } };`,
        persist: 'monitor',
    }),
```

### Save and restore event rules and live derived datasets

`eventRuleParamsOf(state, ruleId)` returns a copy of the `CreateEventRuleParams` a live event rule was created with (by
the model's tool or the function), `undefined` once paused or cleared; `derivedDatasetParamsOf(state, datasetId)`
returns the `DeriveDatasetsParams` of a dataset kept live with `persist: 'monitor'` (its `datasetId` and
`persist: 'monitor'` set, the latest revision's code with the label and display the dataset kept), `undefined` for a
one-shot, paused, stopped or gone one; `state.derivedDatasets.datasetIds` lists the monitored ones in every slice, each
after the derived ones it reads, so restoring in that order finds every source. Save them (JSON-safe) and pass them back to
`createEventRule` / `deriveDatasets` in a later session to bring the agent's standing work back with no model call:

```ts
const saved = {
    rules: state.eventRules.rules.map((rule) => eventRuleParamsOf(state, rule.id)),
    derived: state.derivedDatasets.datasetIds.map((datasetId) => derivedDatasetParamsOf(state, datasetId)),
};
localStorage.setItem('agent-setup', JSON.stringify(saved));
// later, once their source datasets are back in state; derived first (in datasetIds order), since rules may read them
const restored: typeof saved = JSON.parse(localStorage.getItem('agent-setup') ?? '{ "rules": [], "derived": [] }');
for (const parameters of restored.derived) if (parameters) await deriveDatasets(state, parameters);
for (const parameters of restored.rules) if (parameters) await createEventRule(state, parameters);
```

A derived dataset takes its saved `datasetId` when free; a rule's id is re-slugged from its `name`, so it can differ
(`hospitals-2` can come back as `hospitals`). The saved
`code` runs in the sandbox again: restore only parameters your app stored.

## Replace / remove default tools

```ts
createMapAgent(map, {
    model,
    tools: {
        setMapLocale: false,                   // remove
        getCurrentLocation: myCustomGetLoc,    // replace (full ToolEntry)
    },
});
```

A tool you add or replace overrides `datasets[kind].enabled: false`.

## `getCurrentLocation` precision

Default: position rounded to 3 decimals (~100 m), `accuracy` of 111 m (or the device's, if coarser), no `timestamp`,
from a non-high-accuracy fix up to 60 s old. `createGetCurrentLocationTool({ fullPrecision: true })` sends the exact fix,
device accuracy and timestamp from a fresh high-accuracy fix. `getCurrentLocation: false` removes the tool, so "near me"
falls back to the viewport.

```ts
import { createGetCurrentLocationTool } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

createMapAgent(map, {
    model,
    tools: { getCurrentLocation: createGetCurrentLocationTool({ fullPrecision: true }) },
});
```

## `executeMaplibreCode` — opt-in

Runs model-written JS against the live MapLibre `map` in the host page, with no sandbox, for raster overlays and
time-based animations no other tool covers. Not in `DEFAULT_TOOLS`; add it only when the deployment trusts the model and
every prompt and tool result it reads; `executeMaplibreCode: false` has nothing to remove.

```ts
import { createExecuteMaplibreCodeTool } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

createMapAgent(map, {
    model,
    tools: { executeMaplibreCode: createExecuteMaplibreCodeTool() },
});
```

## `clarifyIntent` — prose or form

Default `clarifyIntent` is `alwaysActive` and asks the user in prose. For a UI that renders the questions as a form:

```ts
import { createClarifyIntentTool } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

createMapAgent(map, {
    model,
    tools: { clarifyIntent: createClarifyIntentTool({ rendersForm: true }) },
});
```

- `rendersForm: true` sets `endsTurnOnCall`: the turn ends on the call with no prose; render the call's
  `{ intro?, questions }` (`clarifyIntentSchema`, each question per `questionSchema`: `id`, `question`, `options`, `multiSelect`)
  and send the user's choices back as the next message.
- Default (`rendersForm: false`): the model narrates the questions as prose for form-less UIs.
- Other options: `description`, `classificationPrompt`, `examples`, `examplePrompts`, `alwaysActive` (default `true`).
- Prompts: `CLARIFY_PROSE_PROMPT`, `CLARIFY_FORM_PROMPT`.

## `getTrafficIncidents` `where`

`where: { mode: 'within', … }` takes the same multi-region fields as `discoverPlaces` (`viewport`, `boundingBox`, `queries`,
`placeIds`, `geometries`, `range`, `route`); they resolve to bboxes and are unioned (≤ 10,000 km²).
`route.stretch` keeps part of the selected alternative. Several parts share one bbox, so a gap between them is included.
Omitted `where` means the viewport. A named area beats `viewport: true` when the model sends both.

```ts
getTrafficIncidents({});                                                                       // viewport
getTrafficIncidents({ where: { mode: 'within', queries: [{ query: 'Paris', queryAs: 'place' }] } });
getTrafficIncidents({ where: { mode: 'within', route: { widthMeters: 1000 } } });              // corridor around the latest route
getTrafficIncidents({ where: { mode: 'within', route: { widthMeters: 500, stretch: { includeCountries: ['BE'] } } } }); // Belgian part of the selected alternative
getTrafficIncidents({ where: { mode: 'within', queries: [{ query: 'Amsterdam' }], placeIds: ['G55fc4abe-...'] } });
```

Other inputs: `categoryFilter`, `timeValidityFilter` (default `['present']`), `label`, `show` (default `true`), `fitBounds`,
`monitor` (default `true` when shown), `monitorIntervalMs` (default 60 s).

The result's `summary` counts every incident fetched: `byCategory`, `byMagnitude`, `totalDelayInSeconds` and `byRoad`,
the 10 roads (first road number) with most incidents, each with its delay. It names no single incident.
`recallState({ slice: 'trafficIncidents', id })` returns that same `summary`.

## Start blank, hand-pick built-ins

`tools` takes `ToolDefinition | false` — an entry, a builder or a `DEFAULT_TOOLS` value, no cast:

```ts
import { createMapAgent, DEFAULT_TOOLS } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

createMapAgent(map, {
    model,
    includeDefaultTools: false,
    tools: {
        getFleetVehicle,
        locatePlace: DEFAULT_TOOLS.locatePlace,
        moveCamera: DEFAULT_TOOLS.moveCamera,
        analyseDatasets: DEFAULT_TOOLS.analyseDatasets,
    },
});
```

For a **scopable** custom tool (`scopeSchema` + `scopePrompt` + `ToolEntryBuilder`), see [data-tools.md](./data-tools.md).
