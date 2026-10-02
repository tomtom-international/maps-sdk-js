# Agent Toolkit — Tools

The tool registry, the `ToolEntry` shape, and how to add / replace / remove tools.
See [base reference](../agent-toolkit.md) for setup and `MapAgentOptions`.

---

## `DEFAULT_TOOLS` registry

Flat record of named `ToolEntry` objects.
Categories (representative names — see `DEFAULT_TOOLS` for the full list and `TOOL_NAMES` for the union type):

- **Location**: `locatePlace`, `reverseGeocode`, `getCurrentLocation`, `getViewport`
- **Places & search**: `discoverPlaces`, `getPOICategoryCodes`
- **Routing**: `setRoute`, `addWaypointsToRoute`, `removeWaypointsFromRoute`, `replaceWaypointInRoute`, `getCurrentWaypoints`, `startRouteMonitor`, `stopRouteMonitor`
- **Reachable areas**: `findReachableAreas` (isochrones / isodistances) — calls `calculateReachableRanges`, which is in private preview: the API key needs Calculate Reachable Range access (see [routing.md](../routing.md#reachable-ranges-isochrones))
- **BYOD (bring-your-own-data)**: `addByodSource`, `setByodLayers`, `updateByodDisplay` — customer-authored GeoJSON layers. See [byod.md](./byod.md) for the full ingest / profile / safety / styling model.
- **Traffic — tiles**: `toggleTilesTrafficFlow`, `toggleTilesTrafficIncidents`
- **Traffic — incidents (fetch / monitor / focus)**: `getTrafficIncidents`, `setTrafficIncidentsMonitor`, `clusterIncidents`, `focusIncidents`
- **Traffic — area analytics**: `getTrafficAreaAnalytics`, `monitorAnalysis`, `updateTrafficAreaAnalyticsDisplay`
- **Trackers (geofence / proximity alerts)**: `createTracker`, `getTrackers`, `getTrackerHistory`, `clearTracker`
- **Unified data tools (scope-aware)**: `analyseData`, `processData` — see [data-tools.md](./data-tools.md)
- **Map display**: `updatePlacesDisplay`, `updateRoutesDisplay`, `updateWaypointsDisplay`, `updateTrafficAreaAnalyticsDisplay`, `updateByodDisplay`, `setByodLayers` (BYOD restyle), `clearMap`
- **Map control**: `flyTo`, `zoomInOrOut`, `setMapStandardStyle`, `setLanguage`, `toggleTilesPOIs`, `setPitchBearing`, `getStandardMapStyles`
- **Map styling**: `setMapStyling` (set/reset knobs, apply a preset, or theme the map from colours or an image; its schema names every knob id with its range — `labels.sizeFactor`, `roads.exitNumbers`, `basemap.roadLabels`, `buildings.3d`, `colors.water`, `view.projection`, `hillshade.method`, `traffic.flow.slowColor`, …, plus `theme: { colors | imageUrl, mode }`, which switches to the light or dark variant of the standard style the theme needs and reports it as `switchedStyle`; its `colors.accent` recolours the routes and place pins drawn without a colour of their own). Backed by `StylingModule`; see [map-styling.md](../map-styling.md) and [map-theming.md](../map-theming.md). Base-map group visibility is a `basemap.<group>` knob here (there is no separate toggle tool).
- **MapLibre direct**: `executeMaplibreCode`, `setLayoutProperties`, `setPaintProperties`, `getMapStyleLayers`
- **State / recall**: `recallState` (scope-aware `{ kind, id }` over `places` / `routes` / `ranges` / `geometries` / `byod` / `incidents` / `trafficAreaAnalytics`), `setEntryMode`, `resetState`
- **Utilities**: `clarifyIntent`, `calculateBBox`, `help`

Every tool follows the same `ToolEntry` shape.
Listed names are stable — agents and apps can reference them via `DEFAULT_TOOLS.locatePlace`, etc.

---

## `ToolEntry` shape

```ts
type ToolEntry<S extends ToolState = ToolState, Scope = unknown> = {
    description: string;            // sent to the model
    inputSchema: z.ZodType;         // Zod-validated input
    outputSchema?: z.ZodType;       // structured output schema (improves reliability)
    execute: (input: any, state: S, options?: ToolExecuteOptions) => Promise<any>;

    // classifier metadata
    classificationPrompt?: string;  // one-liner: when to activate this tool
    tags?: string[];                // category labels (e.g. 'location', 'route')
    examples?: string[];            // shown by the help tool
    examplePrompts?: string[];      // shown by the help tool
    relatedTools?: string[];        // hints for the model
    dependsOn?: string[];           // tools that must run first

    // OPTIONAL: per-turn scope (see data-tools.md → "Scope-aware tools")
    scopeSchema?: z.ZodType<Scope>; // shape of `toolScopes[name]` the classifier should emit
    scopePrompt?: string;           // hint shown to the classifier explaining the scope shape
};
```

### Cancellation — `options.signal`

`execute`'s third argument carries the AI SDK's own `abortSignal` for the tool call, which fires
when the model's turn is cancelled:

```ts
type ToolExecuteOptions = { signal?: AbortSignal };
```

Forward it to every `@tomtom-org/maps-sdk/services` call your tool makes, so a cancelled turn also
cancels the in-flight HTTP request:

```ts
execute: async ({ query }, state, options) => {
    const results = await discoverPlaces(withAgentToolkitHeaders({ query, signal: options?.signal }));
    // ...
},
```

An aborted call rejects with `SDKAbortError`. Since `execute` must never throw, catch it and return
a standard error shape:

```ts
try {
    const results = await discoverPlaces(withAgentToolkitHeaders({ query, signal: options?.signal }));
} catch (error) {
    if (error instanceof SDKAbortError) return { error: 'Cancelled.' };
    return { error: `Search failed: ${error instanceof Error ? error.message : String(error)}` };
}
```

**Do NOT forward it into work that outlives the turn** — a monitor's recurring tick, or any
deferred job. Those fire after the signal has already aborted, and a monitor treats a rejected
tick as fatal (it clears its own interval), so a leaked signal kills the monitor instead of
cancelling a request.

Builder form (`ToolEntryBuilder`) accepts `ToolBuildOptions<Scope>`
and is what the registry uses for tools that need to react to feature flags or per-turn scope:

```ts
type ToolEntryBuilder<S, Scope = unknown> = (options: ToolBuildOptions<Scope>) => ToolEntry<S, Scope>;

type ToolBuildOptions<Scope = unknown> = {
    featureFlags?: FeatureFlags;
    scope?: Scope;                  // classifier-resolved scope; undefined at agent-creation time and on the no-scope fallback path
};
```

---

## Add a custom tool (BYOD)

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
        // Append to the places history; the model can show it via updatePlacesDisplay later.
        const entryId = await state.places.addPlaceResult(place, `Vehicle ${vehicleId}`);
        return { vehicleId, entryId, position };
    },
    tags: ['location'],
    examplePrompts: ['Where is vehicle TT-001?', 'Show fleet vehicle on the map'],
};

createMapAgent(map, { model, tools: { getFleetVehicle } });
```

### Resolve a place in a custom tool

`locatePlace(query, queryAs, bias?, execOptions?)` runs the `locatePlace` tool's lookup and returns the best
`Place` or `null` (`queryAs`: `'poi'` searches points of interest, `'place'` geocodes). `getViewportBias(state.baseMap)`
returns the map centre as `[longitude, latitude]`, or `undefined` below zoom `MIN_VIEWPORT_BIAS_ZOOM`, where the
view is too wide to bias toward. A failed or cancelled lookup rejects, so catch it:

```ts
import { getViewportBias, locatePlace } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

execute: async ({ name }, state, options) => {
    try {
        const position = getViewportBias(state.baseMap);
        const place = await locatePlace(name, 'poi', position && { position }, options);
        if (!place) return { status: 'not_found' };
        return { entryId: await state.places.addPlaceResult(place, name) };
    } catch (error) {
        return { error: `Lookup failed: ${error instanceof Error ? error.message : String(error)}` };
    }
},
```

## Replace / remove default tools

```ts
createMapAgent(map, {
    model,
    tools: {
        setLanguage: false,                    // remove
        getCurrentLocation: myCustomGetLoc,    // replace (full ToolEntry)
    },
});
```

## `getCurrentLocation` precision

By default `getCurrentLocation` sends the model a position rounded to 3 decimals (~100 m), `accuracy` of 111 m (or the device's, if coarser), no `timestamp`, from a non-high-accuracy fix up to 60 s old. `createGetCurrentLocationTool({ fullPrecision: true })` sends the exact fix, device accuracy and timestamp from a fresh high-accuracy fix. `getCurrentLocation: false` removes the tool, so "near me" falls back to the viewport.

```ts
createMapAgent(map, {
    model,
    tools: { getCurrentLocation: createGetCurrentLocationTool({ fullPrecision: true }) },
});
```

## Start blank, hand-pick built-ins

```ts
import { createMapAgent, DEFAULT_TOOLS } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

createMapAgent(map, {
    model,
    includeDefaultTools: false,
    tools: {
        getFleetVehicle,
        locatePlace: DEFAULT_TOOLS.locatePlace,
        flyTo: DEFAULT_TOOLS.flyTo,
    },
});
```

For a **scopable** custom tool (`scopeSchema` + `scopePrompt` + `ToolEntryBuilder`), see [data-tools.md](./data-tools.md).
