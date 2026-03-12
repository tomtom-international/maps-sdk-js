# Routing Reference

## Imports

```ts
import { calculateRoute, calculateReachableRanges, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { RoutingModule, GeometriesModule, reachableRangeGeometryConfig } from '@tomtom-org/maps-sdk/map';
import { asSoftWaypoint, bboxFromGeoJSON, formatDistance, formatDuration } from '@tomtom-org/maps-sdk/core';
import type { PlanningWaypoint } from '@tomtom-org/maps-sdk/map';
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

## Gotchas

- `showRoutes()` draws the line; `showWaypoints()` draws the pins — always call both
- `maxAlternatives: 2` returns up to 3 routes; index 0 is the recommended route
- EV charging stop insertion requires `chargingPreferences`; only `routeType: 'fast'` is supported
- `selectRoute(index)` highlights an alternative without recalculating
- For map-wide traffic overlays (flow layer, incidents layer) see `docs/traffic.md`
