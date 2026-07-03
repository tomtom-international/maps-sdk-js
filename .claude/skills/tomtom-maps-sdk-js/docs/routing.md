# Routing Reference

## Imports

```ts
import { calculateRoute, calculateReachableRanges, geocodeOne } from '@tomtom-org/maps-sdk/services';
import {
    RoutingModule, GeometriesModule, reachableRangeGeometryConfig,
    defaultRoutingLayers, SELECTED_ROUTE_FILTER, MIDDLE_INDEX,
} from '@tomtom-org/maps-sdk/map';
import type {
    PlanningWaypoint, ColorPaletteOptions, GeometryTheme, GeometryBeforeLayerConfig,
} from '@tomtom-org/maps-sdk/map';
import { asSoftWaypoint, bboxFromGeoJSON, formatDistance, formatDuration, withInsertedWaypoint } from '@tomtom-org/maps-sdk/core';
import type { Waypoint, WaypointLike, PolygonFeatures } from '@tomtom-org/maps-sdk/core';
```

---

## Basic route — geocode → calculate → display

```ts
const routingModule = await RoutingModule.get(map);

const [origin, destination] = await Promise.all([
    geocodeOne('Amsterdam, Netherlands'),
    geocodeOne('Rotterdam, Netherlands'),
]);

const routes = await calculateRoute({ locations: [origin, destination] });

// showRoutes draws the line; showWaypoints draws the pins — always call both
await routingModule.showRoutes(routes);
await routingModule.showWaypoints([origin, destination]);

const summary = routes.features[0].properties.summary;
console.log(formatDistance(summary.lengthInMeters));      // e.g. '75 km'
console.log(formatDuration(summary.travelTimeInSeconds)); // e.g. '1 hr 10 min'
console.log(summary.arrivalTime);                         // Date object
```

---

## Coordinate-only locations (no geocoding needed)

```ts
const routes = await calculateRoute({
    locations: [
        [4.897, 52.377],   // [longitude, latitude]
        [4.897, 52.200],
        [4.462, 51.926],
    ],
});
```

---

## Multiple alternatives — display and select

```ts
const routes = await calculateRoute({
    locations: [origin, destination],
    maxAlternatives: 2,    // returns up to 3 routes (best + 2 alternatives)
});

await routingModule.showRoutes(routes, { selectedIndex: 0 });
await routingModule.showWaypoints([origin, destination]);

// Programmatic selection
await routingModule.selectRoute(1);

// Let user click to select
routingModule.events.mainLines.on('click', (feature) => {
    routingModule.selectRoute(feature.properties.index);
});
```

---

## Clearing routes and waypoints

```ts
// Remove route lines from the map (does NOT clear waypoints)
await routingModule.clearRoutes();

// Remove waypoint markers
await routingModule.clearWaypoints();

// Calling showRoutes() again replaces the previous display — no need to clear first
await routingModule.showRoutes(newRoutes);
```

---

## Multiple routes with different colors

Create separate `RoutingModule` instances for each route — they manage routes, waypoints, and events independently:

```ts
const colors = ['#0066CC', '#00BBDD', '#33AA33', '#99BB00'];

const modules = await Promise.all(
    origins.map((_, i) => RoutingModule.get(map, { theme: { mainColor: colors[i % colors.length] } })),
);

for (let i = 0; i < origins.length; i++) {
    const routes = await calculateRoute({ locations: [origins[i], destination] });
    await modules[i].showRoutes(routes);
    await modules[i].showWaypoints([origins[i], destination]);
}
```

---

## Traffic and routing options

```ts
const routes = await calculateRoute({
    locations: [origin, destination],
    costModel: {
        traffic:   'live',       // 'live' | 'historical'
        routeType: 'fast',       // 'fast' | 'short' | 'efficient' | 'thrilling'
        avoid: ['tollRoads', 'ferries', 'motorways'],
    },
    guidance: { type: 'coded' },  // enables turn-by-turn instructions
    maxAlternatives: 2,
});

const instructions = routes.features[0].properties.guidance?.instructions;
```

---

## Soft waypoints (pass through without stopping)

```ts
const via = asSoftWaypoint([4.85, 52.25], 50);   // [lng, lat], radiusMeters

const waypoints: PlanningWaypoint[] = [origin, via, destination];

// Use null to suppress pin display for a waypoint
const waypointsNoPins: PlanningWaypoint[] = [null, destination]; // no origin pin
```

---

## Vehicle dimensions and restrictions

```ts
const routes = await calculateRoute({
    locations: [origin, destination],
    vehicle: {
        model: {
            dimensions: {
                heightMeters: 2.5,
                weightKG: 3500,
                lengthMeters: 8,
            },
        },
        restrictions: { commercial: true },
    },
});
```

---

## EV routing with automatic charging stops

Provide `chargingPreferences` to trigger automatic stop insertion:

```ts
const routes = await calculateRoute({
    locations: [origin, destination],
    vehicle: {
        engineType: 'electric',
        model: {
            dimensions: { weightKG: 2000 },
            engine: {
                charging: {
                    maxChargeKWH: 75,
                    chargingConnectors: [{
                        currentType: 'DC',
                        plugTypes: ['IEC_62196_Type_2_Outlet'],
                        efficiency: 0.9,
                        maxPowerInkW: 50,
                    }],
                },
                consumption: {
                    speedsToConsumptionsKWH: [{ speedKMH: 90, consumptionUnitsPer100KM: 18 }],
                },
            },
        },
        state: { currentChargePCT: 80 },
        preferences: {
            chargingPreferences: {
                minChargeAtDestinationPCT: 20,
                minChargeAtChargingStopsPCT: 10,
            },
        },
    },
});

const summary = routes.features[0].properties.summary;
console.log(summary.totalChargingTimeInSeconds);
console.log(summary.remainingChargeAtArrivalInPCT);

// Charging stop pins appear automatically via showRoutes
await routingModule.showRoutes(routes);
routingModule.events.chargingStops.on('click', (feature) => { showChargerDetails(feature); });
```

---

## Reachable ranges (isochrones)

```ts
const geometriesModule = await GeometriesModule.get(
    map,
    reachableRangeGeometryConfig('fadedRainbow', 'filled', 'lowestLabel'),
);

const ranges = await calculateReachableRanges([
    { origin: [4.9, 52.4], budget: { type: 'timeMinutes', value: 10 } },
    { origin: [4.9, 52.4], budget: { type: 'timeMinutes', value: 20 } },
    { origin: [4.9, 52.4], budget: { type: 'timeMinutes', value: 30 } },
]);

await geometriesModule.show(ranges);  // auto-labels: '30 min', '20 min', '10 min'
```

Budget types: `'timeMinutes'`, `'distanceKM'`, `'remainingChargeCPT'`, `'spentChargePCT'`, `'spentFuelLiters'`

Palette options: `'fadedRainbow'` | `'rainbow'` | ... (see `ColorPaletteOptions`)

Themes: `'filled'` | `'inverted'` | `'outlined'` | ...

Before-layer config: `'lowestLabel'` | `'lowestPlaceLabel'` | `'aboveRoads'` | ...

### Abort in-flight requests

```ts
let abortController = new AbortController();

const calculate = async () => {
    abortController.abort();
    abortController = new AbortController();
    const ranges = await calculateReachableRanges(params, { signal: abortController.signal });
    geometriesModule.show(ranges);
};
```

### Update geometry config without re-fetching

```ts
geometriesModule.applyConfig(reachableRangeGeometryConfig('rainbow', 'inverted', 'lowestLabel'));
// or move all geometries before a different layer
geometriesModule.moveBeforeLayer('aboveRoads');
```

---

## Traffic incidents on route

`showRoutes()` automatically renders incident markers along the route:

```ts
const routes = await calculateRoute({
    locations: [origin, destination],
    costModel: { traffic: 'live' },
});

await routingModule.showRoutes(routes);

const { trafficDelayInSeconds } = routes.features[0].properties.summary;

routingModule.events.incidents.on('click', (feature) => {
    const { category, magnitudeOfDelay, delayInSeconds } = feature.properties;
});
```

---

## Accessing route data

```ts
const route = routes.features[0];

const { lengthInMeters, travelTimeInSeconds, trafficDelayInSeconds,
        arrivalTime, departureTime, batteryConsumptionInkWh } = route.properties.summary;

const sections     = route.properties.sections;
const instructions = route.properties.guidance?.instructions;
const path         = route.geometry.coordinates; // [lng, lat][]
```

---

## RoutingModule — visual customization

### Custom route color

```ts
const routingModule = await RoutingModule.get(map, { theme: { mainColor: '#DF1B12' } });
```

### Custom waypoint icon style

```ts
const routingModule = await RoutingModule.get(map, {
    waypoints: {
        icon: { style: { fillColor: 'green', outlineColor: 'orange', outlineOpacity: 0.7 } },
    },
});
```

### MapLibre layer overrides (advanced)

Customize route line paint, add extra layers, modify section visuals:

```ts
import { defaultRoutingLayers, SELECTED_ROUTE_FILTER } from '@tomtom-org/maps-sdk/map';

const routingModule = await RoutingModule.get(map, {
    theme: { mainColor: '#DF1B12' },
    layers: {
        mainLines: {
            routeOutline: {
                paint: { 'line-color': '#555', 'line-width': 10 },
            },
            // add a new custom layer
            additional: {
                myDashLine: {
                    type: 'line',
                    filter: SELECTED_ROUTE_FILTER,
                    paint: { 'line-color': 'lightgrey', 'line-dasharray': [3, 2] },
                    beforeID: 'routeIncidentBackgroundLine',
                },
            },
        },
        sections: {
            tollRoad: {
                routeTollRoadSymbol: { layout: { visibility: 'none' } }, // hide toll icons
                routeTollRoadOutline: {
                    paint: { 'line-color': '#29A2FF', 'line-dasharray': [1, 0.2] },
                },
            },
            tunnel: {
                routeTunnelLine: {
                    paint: {
                        ...defaultRoutingLayers.sections.tunnel?.routeTunnelLine?.paint,
                        'line-opacity': 1,
                    },
                },
            },
        },
    },
});
```

---

## RoutingModule — waypoint events

```ts
import { MIDDLE_INDEX } from '@tomtom-org/maps-sdk/map';
import type { Waypoint, WaypointDisplayProps } from '@tomtom-org/maps-sdk/map';

// Click on any waypoint pin
routingModule.events.waypoints.on('click', (waypoint: Waypoint<WaypointDisplayProps>, lngLat) => {
    waypoint.properties.indexType; // 'ORIGIN' | 'DESTINATION' | MIDDLE_INDEX
    waypoint.properties.index;     // position in the waypoints array

    if (waypoint.properties.indexType === MIDDLE_INDEX) {
        // intermediate stop clicked — offer to remove it
        const stopIndex = waypoint.properties.index - 1;
    }
});
```

### Route section events

Beyond `mainLines` and `waypoints`, the module exposes click events for specific route section types:

```ts
routingModule.events.ferries.on('click', (section, lngLat) => { /* ferry segment */ });
routingModule.events.tollRoads.on('click', (section, lngLat) => { /* toll segment */ });
routingModule.events.tunnels.on('click', (section, lngLat) => { /* tunnel segment */ });
routingModule.events.vehicleRestricted.on('click', (section, lngLat) => { /* restricted area */ });
```

---

## Dynamic stop insertion with `withInsertedWaypoint` / `withInsertedWaypoints`

For a single new stop (e.g. a map click), use `withInsertedWaypoint`:

```ts
import { withInsertedWaypoint } from '@tomtom-org/maps-sdk/core';

let waypoints: WaypointLike[] = [origin, destination];
let currentRoute = routes.features[0];

// On map click: find optimal position and insert new stop
map.mapLibreMap.on('click', async (e) => {
    const newStop = e.lngLat.toArray() as [number, number];
    waypoints = withInsertedWaypoint(currentRoute, waypoints, newStop);

    const updated = await calculateRoute({ locations: waypoints });
    currentRoute = updated.features[0];
    routingModule.showWaypoints(waypoints);
    routingModule.showRoutes(updated);
});
```

For multiple new stops at once (e.g. results from `alongRouteSearch`), use `withInsertedWaypoints` — projections are computed once and the result is in along-route order regardless of input order:

```ts
import { withInsertedWaypoints } from '@tomtom-org/maps-sdk/core';
import { search, calculateRoute } from '@tomtom-org/maps-sdk/services';

const stops = await search({
    poiCategories: ['ELECTRIC_VEHICLE_STATION'],
    route: routes.features[0],
    maxDetourTimeSeconds: 300,
    limit: 5,
});

const updatedWaypoints = withInsertedWaypoints(
    routes.features[0],
    waypoints,
    stops.features.map((f) => f.geometry.coordinates as [number, number]),
);

const updatedRoutes = await calculateRoute({ locations: updatedWaypoints });
```

**Don't loop `withInsertedWaypoint` to insert N stops** — the plural variant projects everything once (O(n+m) instead of O(n·m)) and gives a deterministic along-route order independent of input order.

---

## GeometriesModule — full config

```ts
import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';

// Display city boundaries (inverted = shade everything outside)
const geometriesModule = await GeometriesModule.get(map, {
    theme: 'inverted',
    beforeLayerConfig: 'lowestPlaceLabel',
    fill: { color: 'white', opacity: 0.75 },
    line: { opacity: 0 },
});

const geometry = geometryData({ geometries: [place] });
await geometriesModule.show(geometry as PolygonFeatures);
```

---

## Gotchas

- `showRoutes()` draws the line; `showWaypoints()` draws the pins — always call both
- `maxAlternatives: 2` returns up to 3 routes; index 0 is the recommended route
- EV charging stop insertion requires `chargingPreferences`; only `routeType: 'fast'` is supported
- `selectRoute(index)` highlights an alternative without recalculating
- `SELECTED_ROUTE_FILTER` is a MapLibre filter expression — use it in `additional` layers to limit them to the active route
- `MIDDLE_INDEX` is the `indexType` value for intermediate stops (not a number — compare with `===`)
- `clearRoutes()` does NOT clear waypoints — call `clearWaypoints()` separately if needed
- Only `'car'` travel mode is supported — truck, motorcycle, bicycle, pedestrian are not available in the current API
- Event handlers on overlapping source/layer IDs (e.g., two modules sharing layers) — only the first handler fires
- Long-hover events are suppressed on features already in "clicked" state
- For map-wide traffic overlays (flow layer, incidents layer) see `docs/traffic.md`
