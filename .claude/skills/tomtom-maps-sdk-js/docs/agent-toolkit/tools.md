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
- **Reachable areas**: `findReachableAreas` (isochrones / isodistances)
- **BYOD (bring-your-own-data)**: `addByodSource`, `setByodLayers`, `updateByodDisplay` — customer-authored GeoJSON layers. See [byod.md](./byod.md) for the full ingest / profile / safety / styling model.
- **Traffic — tiles**: `toggleTilesTrafficFlow`, `toggleTilesTrafficIncidents`
- **Traffic — incidents (fetch / monitor / focus)**: `getTrafficIncidents`, `setTrafficIncidentsMonitor`, `clusterIncidents`, `focusIncidents`
- **Traffic — area analytics**: `getTrafficAreaAnalytics`, `monitorAnalysis`, `updateTrafficAreaAnalyticsDisplay`
- **Trackers (geofence / proximity alerts)**: `createTracker`, `getTrackers`, `getTrackerHistory`, `clearTracker`
- **Unified data tools (scope-aware)**: `analyseData`, `processData` — see [data-tools.md](./data-tools.md)
- **Map display**: `updatePlacesDisplay`, `updateRoutesDisplay` (replaces the old `setRouteTheme`), `updateWaypointsDisplay`, `updateTrafficAreaAnalyticsDisplay`, `updateByodDisplay`, `setByodLayers` (BYOD restyle), `clearMap`
- **Map control**: `flyTo`, `zoomInOrOut`, `setMapStandardStyle`, `setLanguage`, `toggleTilesPOIs`, `toggleTilesBaseMapLayerGroups`, `setPitchBearing`, `getStandardMapStyles`
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
    execute: (input: any, state: S) => Promise<any>;

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
            geometry: { type: 'Point', coordinates: position },
            properties: { name: `Vehicle ${vehicleId}` },
        };
        // Append to the places history; the model can show it via updatePlacesDisplay later.
        const entryId = state.places.addPlaceResult(place, `Vehicle ${vehicleId}`);
        return { vehicleId, entryId, position };
    },
    tags: ['location'],
    examplePrompts: ['Where is vehicle TT-001?', 'Show fleet vehicle on the map'],
};

createMapAgent(map, { model, tools: { getFleetVehicle } });
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
