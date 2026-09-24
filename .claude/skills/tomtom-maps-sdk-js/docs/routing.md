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
import { bboxFromGeoJSON, formatDistance, formatDuration, withInsertedWaypoint } from '@tomtom-org/maps-sdk/core';
import type { Waypoint, WaypointLike, PolygonFeatures } from '@tomtom-org/maps-sdk/core';
```

---

## Basic route — geocode → calculate → display

```ts
const routingModule = await RoutingModule.create(map);

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

A nested coordinate array is a **path** — geometry the route must follow, for replaying a route you
already have. It is not a stop-free corridor: the path's endpoints go out as waypoints, so a path
between an origin and a destination adds two of them and the legs that come with them.

```ts
// Reconstruct a route from its own coordinates — one path, no extra waypoints
const routes = await calculateRoute({ locations: [previousRoute.geometry.coordinates] });
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
    origins.map((_, i) => RoutingModule.create(map, { theme: { mainColor: colors[i % colors.length] } })),
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

## Vehicle weight, speed and toll restrictions

```ts
const routes = await calculateRoute({
    locations: [origin, destination],
    vehicle: {
        model: {
            dimensions: { weightKG: 3500 },
        },
        // tollTransponder is 'all' | 'unknown' | 'none' — tolls payable only by transponder are
        // avoided with 'none', tolls that cannot be paid by one are avoided with 'all'
        restrictions: { maxSpeedKMH: 80, tollTransponder: 'none' },
    },
});
```

---

## Arrival side

```ts
// 'any' (default) arrives from whichever side is faster; 'curb' arrives on the curb side for the
// country's driving direction, at the destination and at every intermediate stop
const routes = await calculateRoute({ locations: [origin, destination], arrivalSide: 'curb' });
```

---

## Per-stop options — pause, arriving-leg cost model, entry points

Options ride on a waypoint's own `properties`, typed with `RouteStopOptions`. They describe the leg
*arriving* at that stop plus the wait once there, so inserting an earlier stop leaves them attached
to the right place.

```ts
import type { RouteStopOptions } from '@tomtom-org/maps-sdk/services';
import type { Waypoint } from '@tomtom-org/maps-sdk/core';

const stop: Waypoint<RouteStopOptions> = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2.4467, 41.5381] },
    properties: {
        pauseDurationSeconds: 1800,                                   // counted into travel time,
                                                                      // and shown on the stop's pin
        legCostModel: { routeType: 'short', avoid: ['motorways'] },   // this leg only
        candidateEntryPoints: [[2.4467, 41.5381], [2.4479, 41.5372]], // router picks one
        preferredEntryPointIndex: 1,
    },
};

const routes = await calculateRoute({ locations: [origin, warehouse, destination] });
```

The wait comes back on the leg that arrives at the stop, as time spent there:

```ts
const legs = routes.features[0].properties.sections.leg;
legs[0].summary.stopTimeInSeconds;    // whole time at the first stop (absent when it does not stop)
legs[0].summary.chargingInformationAtEndOfLeg?.properties.chargingTimeInSeconds; // of which charging
legs[0].summary.travelTimeInSeconds;  // driving only — the stop is NOT in here
routes.features[0].properties.summary.travelTimeInSeconds; // driving + every stop
```

**Gotchas:**
- `pauseDurationSeconds` is a core `WaypointProps` field, not a `RouteStopOptions` one, because the
  map reads it too: `showWaypoints` labels the stop's pin with the formatted wait by default, and
  charging stop pins carry the same `stopDuration` label (the whole time there, charging included;
  `chargingDuration` still holds the charging part alone).
- Driving time = sum of the legs' `travelTimeInSeconds`; total time standing still = the route's
  minus that sum. On an EV route with charging stops, that includes the charging.
- `stopTimeInSeconds` is one number for the whole stop on purpose — a requested wait and charging at
  the same stop widen the same gap, so they are never two competing durations.
- `pauseDurationSeconds` is rejected on the destination — the API requires the last leg's pause to
  be 0, so request validation fails before anything is sent. Which stop is the destination is
  positional and `locations` is an array callers build dynamically, so this is a validation rule
  rather than something the type can carry.
- `legCostModel` on the origin is ignored: the origin has no arriving leg.
- Not called `entryPoints`: a `Place` already carries its own `entryPoints` from search, and those
  are never sent to the routing API.
- `vehicle.model.variantId` only works on the EV-with-charging path, so `calculateRoute` fails
  validation without `preferences.chargingPreferences` beside it. It is a validation rule and not a
  type one because `calculateReachableRange` takes the same vehicle and accepts a variant alone.
  A non-electric vehicle takes no `variantId` at all — that one does not compile.

---

## EV routing with automatic charging stops

Provide `chargingPreferences` to trigger automatic stop insertion:

```ts
const routes = await calculateRoute({
    locations: [origin, destination],
    // How the service picks the stops: 'automaticFastest' (default) | 'manualFastest'
    //   | 'automaticFastestWithFallbackToManual'
    chargingStopsStrategy: 'automaticFastest',
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

`chargingStopsStrategy` only reaches the wire on the EV endpoint, which is selected by
`vehicle.preferences.chargingPreferences`, so the type requires the two together: a strategy needs a
`vehicle` of type `ElectricVehicleParamsWithChargingStops`. The endpoint also needs a minimum charge
at the destination, and only the preferences supply it.

Annotate the vehicle with that type once it lives in its own variable, rather than inline in the
call — otherwise the missing preferences are reported against the `calculateRoute` argument:

```ts
import type { ElectricVehicleParamsWithChargingStops } from '@tomtom-org/maps-sdk/services';

const vehicle: ElectricVehicleParamsWithChargingStops = {
    engineType: 'electric',
    model: {
        engine: {
            charging: { maxChargeKWH: 75 },
            consumption: { speedsToConsumptionsKWH: [{ speedKMH: 90, consumptionUnitsPer100KM: 18 }] },
        },
    },
    state: { currentChargePCT: 80 },
    // Required by the type, not optional as on a plain ElectricVehicleParams
    preferences: {
        chargingPreferences: { minChargeAtDestinationPCT: 20, minChargeAtChargingStopsPCT: 10 },
    },
};

await calculateRoute({ locations, chargingStopsStrategy: 'manualFastest', vehicle });
```

A predefined `model.variantId` is bound to the same endpoint, so `calculateRoute` rejects one
without charging preferences at validation. Give its charge and preferences in kWh: the percentage
forms are converted against `maxChargeKWH`, which a predefined model does not declare — the service
holds the battery model, not the caller.

```ts
const databaseVehicle: ElectricVehicleParamsWithChargingStops = {
    engineType: 'electric',
    model: { variantId: 'tesla-model-3-long-range-2023' },
    state: { currentChargeInkWh: 60 },
    preferences: {
        chargingPreferences: { minChargeAtDestinationInkWh: 15, minChargeAtChargingStopsInkWh: 10 },
    },
};
```

Legs on an EV route do not line up with the requested stops, because the service inserts charging
stops of its own. `leg.originalWaypointIndex` maps a leg back to the stop the caller asked for:

```ts
routes.features[0].properties.sections.leg?.forEach((leg) => {
    const index = leg.originalWaypointIndex;  // undefined on the final leg and on inserted stops
    const stop = index === undefined ? undefined : locations[index];
});
```

---

## Reachable ranges (isochrones)

```ts
const geometriesModule = await GeometriesModule.create(
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

`vehicle` is `ReachableRangeVehicleParameters` — the routing vehicle minus the two things this
endpoint has no parameter for, both of which it answers with `400 parameter [x] not supported`:

- `state.heading`.
- `preferences`, whose only member is `chargingPreferences`. A range has no charging stops to plan,
  so a predefined `model.variantId` stands on its own here, unlike on `calculateRoute`:

```ts
const ranges = await calculateReachableRanges([
    {
        origin: [4.9, 52.4],
        budget: { type: 'remainingChargeCPT', value: 20 },
        // The service holds this variant's battery model, so nothing else is needed to describe it
        vehicle: { engineType: 'electric', model: { variantId: 'tesla-model-3-long-range-2023' } },
    },
]);
```

### Abort in-flight requests

Every service that takes a parameters object accepts a `signal`. Aborting cancels the in-flight
HTTP request and rejects with `SDKAbortError`, so the `catch` is required — without it the
superseded call rejects unhandled and the line after the `await` never runs.

`searchOne` and `geocodeOne` are the exception: they take a bare query string, so use `search` /
`geocode` with `limit: 1` when the lookup must be cancellable.

```ts
import { SDKAbortError, calculateRoute } from '@tomtom-org/maps-sdk/services';

let abortController: AbortController | undefined;

const calculate = async () => {
    // Cancel whatever the previous call left in flight
    abortController?.abort();
    abortController = new AbortController();

    try {
        const routes = await calculateRoute({ locations, signal: abortController.signal });
        routingModule.showRoutes(routes);
    } catch (error) {
        if (error instanceof SDKAbortError) return; // superseded, not a failure
        throw error;
    }
};
```

`calculateReachableRanges` also accepts a batch-level signal as its second argument, which
applies to every range in the array:

```ts
const ranges = await calculateReachableRanges(paramsArray, { signal: abortController.signal });
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

## Turn-by-turn instructions

`guidance: { type: 'coded' }` is what fills `route.properties.guidance.instructions`. Every
instruction carries ready-made text, so a turn list needs no translation table of your own:

```ts
const routes = await calculateRoute({
    locations: [origin, destination],
    guidance: { type: 'coded', phonetics: 'IPA' },  // 'IPA' | 'LHP'
});

routes.features[0].properties.guidance?.instructions.forEach((inst) => {
    inst.message;         // 'Turn right onto Damrak' — generated and localised by the service
    inst.maneuver;        // Maneuver code, e.g. 'TURN_RIGHT'
    inst.maneuverPoint;   // Position — [lng, lat]
    inst.roundaboutType;  // 'REGULAR' | 'SMALL' — on roundabout maneuvers
    inst.maneuverView;    // the junction layout: { onRouteAngle?, offRouteAngles }
    inst.sideRoads;       // [{ side: 'LEFT', offsetFromManeuverInMeters: 12, isDrivable: true }]
    inst.nextRoadInfo.streetName?.phonetic;  // a flat string, already in the requested alphabet
    inst.nextRoadInfo.countryCode;           // ISO3
});
```

- `message` is present on every instruction — read it instead of mapping `maneuver` to your own
  strings.
- `maneuverView` angles are relative **directions**, not degrees: `ManeuverAngle` is `'STRAIGHT' |
  'SLIGHT_RIGHT' | 'RIGHT' | 'SHARP_RIGHT' | 'SLIGHT_LEFT' | 'LEFT' | 'SHARP_LEFT' | 'BACK'`.
  `onRouteAngle` is the way the route goes, `offRouteAngles` the ways it passes up — enough to draw
  a junction diagram.
- `isDrivable` on a side road says whether it can actually be driven into. A non-drivable one still
  belongs in a diagram; it just cannot be taken by mistake.
- `phonetic` is a flat string, not an object — the alphabet is chosen by `guidance.phonetics`.

---

## Route sections — what costs money, and which incident

```ts
const sections = routes.features[0].properties.sections;

sections.toll;      // stretches charging a per-use toll (ticket, barrier or free-flow point)
sections.tollRoad;  // stretches that cost money by ANY scheme — a superset of `toll`
sections.traffic?.forEach((t) => t.eventId);  // join key to the traffic incident details service
```

- **`toll` vs `tollRoad`.** `toll` answers *will this cost a toll to drive*; `tollRoad` answers
  *does this cost anything at all to drive* — a vignette-only motorway (Austria, Switzerland) or an
  urban charge zone (central London, Milan Area C, Stockholm) appears in `tollRoad` and not in
  `toll`. `RoutingModule`'s `tollRoads` overlay draws `tollRoad`.
- Leaving `sectionTypes` unset requests every section type, `tollRoad` included. Passing a list
  requests only the types it names, so a list has to name `'tollRoad'` to keep it.

---

## RoutingModule — visual customization

### Custom route color

```ts
const routingModule = await RoutingModule.create(map, { theme: { mainColor: '#DF1B12' } });
```

### Custom waypoint icon style

```ts
const routingModule = await RoutingModule.create(map, {
    waypoints: {
        icon: { style: { fillColor: 'green', outlineColor: 'orange', outlineOpacity: 0.7 } },
    },
});
```

### Custom charging stop icons

```ts
const routingModule = await RoutingModule.create(map, {
    chargingStops: {
        icon: {
            customIcons: [
                { id: 'slow-charger', image: chargerSlowSVG },
                { id: 'fast-charger', image: chargerFastSVG, offsetX: 0, offsetY: -10 },
            ],
            mapping: {
                basedOn: 'chargingSpeed',
                value: { slow: 'slow-charger', regular: 'slow-charger', fast: 'fast-charger', 'ultra-fast': 'fast-charger' },
            },
        },
    },
});
```

`mapping` also takes `{ basedOn: 'custom', fn: (stop) => spriteID }`, and works without
`customIcons` when pointing at sprites the style already ships. `offsetX`/`offsetY` (pixels,
`CustomImage`) shift an icon from its coordinate; they need `image` on the same entry, so an
entry naming an existing sprite by `id` alone ignores them. Icon ids here are used as written —
unlike places `categoryIcons`, they are not instance-suffixed.

### Route sections — style a section type without writing MapLibre

All sixteen drawn section types are configured under `sections`, keyed by type, on the same knobs:
`carpool`, `carTrain`, `ferry`, `importantRoadStretch`, `lowEmissionZone`, `motorway`,
`pedestrian`, `speedLimit`, `tollRoad`, `tollVignette`, `traffic`, `tunnel`, `unpaved`, `urban`,
`vehicleRestricted`.

Whether a type is drawn by default is per type, on one rule: a type draws itself when its stretches
are sparse along a route and consequential for the driver. That is `carTrain`, `ferry`,
`lowEmissionZone`, `tollRoad`, `tollVignette`, `traffic`, `tunnel` and `vehicleRestricted` — switch
them off with `{ visible: false }`. `speedLimit` draws itself too, despite running nearly the whole
route, because it posts a sign per section rather than banding it (see below). The other six are
**opt-in**, so `visible: true` is what puts one on the map; `motorway` and `urban` each run nearly
the whole route, so a band drawn for them buries the route line.

```ts
const routingModule = await RoutingModule.create(map, {
    sections: {
        urban: { visible: true },                                            // draw an opt-in type
        lowEmissionZone: { color: '#1B7A43', opacity: 0.8 },                 // restyle a drawn one
        motorway: { visible: true, width: 'l' },                             // 's' | 'm' | 'l'
        tunnel: { color: '#402060', style: 'halo' },                          // restyle a drawn one
        tollRoad: { icon: { image: 'poi-toll_plaza', placement: 'along' } },  // icon from the sprite
        traffic: { visible: false },                                         // drop one
    },
});
```

The knobs: `visible`, `color`, `opacity`, `width` (`'s' | 'm' | 'l'`), `style`
(`'halo' | 'inline'`), `pattern` (`'solid' | 'dashed' | 'dotted'`),
`icon` (`{ image, placement: 'center' | 'along', size }`) and `sign`, which only `speedLimit` takes
(see below).

`style` sets the layer order and the width together, which is what makes the two looks distinct:

- `style: 'halo'` draws the section under the route's own lines and wider than its outline, so it
  bands the route while the route keeps its colour. Default for the ten generated types that band
  the route and for `tollRoad`, which is why a low-emission zone reads as a green outline around it.
- `style: 'inline'` draws it over the route line at the route's own width, so the route itself
  appears in the section's colour there. Default for `ferry`, `traffic`, `tunnel` and
  `vehicleRestricted` — this is why a route goes grey through a tunnel.

Changing `style` through `applyConfig` restacks the layers, so a section can move from one side of
the route line to the other at runtime.

Not every type answers to every knob, and the config type says so: `traffic` colours its line by
`magnitudeOfDelay` and takes its icons from the incident data, so `sections.traffic.color` is a
compile error, not a setting that draws nothing. `speedLimit` draws no line at all, so it takes
only `visible` and `sign`. `sectionSupportsKnob(type, knob)` reports the same
at runtime, for a panel that builds its controls from the type. `sectionDrawsByDefault(type)` says
whether a type starts on, which the map cannot be asked: a route with no ferry sections draws no
ferry layer, so an absent layer reads the same as a type switched off.

### Speed limits are posted as signs, not banded

`speedLimit` is the one type whose information is a number rather than a stretch, so the module
posts a **road sign per section** and draws no line at all. Nothing has to be configured for it:

```ts
// Ask for `country` as well and every sign takes the face and unit of the country it stands in.
const routes = await calculateRoute({ locations, sectionTypes: ['speedLimit', 'country'] });
await routingModule.showRoutes(routes);
```

The sign follows the road, not the reader — face, unit and numeral colour all come from the country
the stretch runs through:

| Country | Face | Unit | Numerals |
|---|---|---|---|
| most of Europe, and anywhere without an entry | white disc | km/h | near-black |
| `SWE`, `FIN`, `ISL` | yellow disc | km/h | near-black |
| `GBR` | white disc | mph | near-black |
| `USA` | `SPEED LIMIT` plaque | mph | near-black |
| `JPN` | white disc | km/h | blue |

Where mph is posted the number is converted and rounded to the step signs come in, so a London
stretch reads `30` and a Californian one `65`, both from the same `maxSpeedLimitInKmh`. With no
`country` sections the display units decide the face and unit; `sign.unit` overrides both.

Signs scale with the zoom (0.5 at zoom 10 to 0.7 at 16), as the ferry and toll-road icons do. That
is not configurable — `sign.minzoom` is the knob for how early they appear at all.

```ts
const routingModule = await RoutingModule.create(map, {
    sections: {
        speedLimit: {
            sign: { minzoom: 8, priority: 'aboveRouteIcons', unit: 'mph' },
        },
    },
});
```

- **`visible` switches the signs**, because they are the whole of what the type draws — there is no
  second switch, and none of the line knobs (`color`, `width`, `style`, `pattern`, `icon`) apply.
- **A sign is repeated along its stretch**, not drawn once, so a reader zoomed into the middle of a
  long stretch still sees the limit they are on. A stretch too short on screen to fit a sign draws
  none, which is what thins a dense route; where two compete, the longer stretch wins.
- **`sign.minzoom` defaults to 9.** Further out, a route's stretches fall in the same few pixels, so
  the signs that survive are an arbitrary sample of the drive rather than its limits — and they
  survive by pushing against the waypoints and incidents. Lower it for a map about the limits.
- **`sign.priority` decides which symbol survives a collision**, since MapLibre resolves them from
  the topmost layer down and the lower layer gives way. `belowRouteIcons` (the default) yields to
  waypoint pins, charging stops and incident icons — each saying something the road cannot — while
  taking precedence over the base map's labels. `belowMapLabels` yields to those labels as well, so
  a sign never lands on a place name, at the cost of showing fewer of them in a city.
  `aboveRouteIcons` yields to nothing.
- **A route carries more sections than fit**, since it splits wherever its geometry does. The signs
  that fit are drawn; the rest are dropped by collision rather than thinned by configuration.
- The sign layer is `routeSectionSpeedLimitSign`, and every derived fact is on the feature for a
  `layers.sections.speedLimit` override to read: `signImageID` (the face), `signLabel` (the number
  in the unit it is posted in), `signFace` (`'whiteDisc' | 'yellowDisc' | 'plaque'`, which is what
  offsets the number clear of the plaque's own words) and `signNumeralsColor`.

### Border crossings

`country` sections partition a route end to end, each ending where the next begins, so every seam
between two of them is a border. A crossing is that seam — a point rather than a stretch — and sits
under `countryCrossings` rather than in the section catalogue. Each is a plaque naming both
countries in the direction of travel by their ISO 3166-1 alpha-2 codes, `ES → FR`.

```ts
const routingModule = await RoutingModule.create(map, {
    countryCrossings: { minzoom: 6, color: '#0B5FA5', alignment: 'route' },
});

const routes = await calculateRoute({ locations, sectionTypes: ['country'] });
await routingModule.showRoutes(routes);   // the crossings draw themselves
```

- **Asking for `country` sections is the whole requirement.** A route that carries none draws no
  crossings, and the module fetches nothing of its own.
- **Colours follow the map's light/dark theme**: near-black plaque on a light map, near-white on a
  dark one, and the label takes whichever of the two reads on the plaque. `color` and `textColor`
  override either; setting `color` alone still gets a legible label.
- **`alignment`** is `'viewport'` (level with the screen) or `'route'` (turned to the route's
  bearing where it crosses, kept upright). **`visible`** defaults to `true`, **`minzoom`** to **4**.
- **Re-entering a country is a second crossing**, back the way it came — `CH → FR` then `FR → CH`.
- **Scope and shown data**: `events.countryCrossings` and `getShown().countryCrossings`. Each
  feature carries `fromCountryCode`, `toCountryCode`, the composed `label` and the `bearing`; a
  **clicked** one also carries `fromSection` and `toSection`, the two `CountrySectionProps` it joins.
- The layer is `routeCountryCrossing`, overridable under `layers.countryCrossings`.

Each section also gets an event scope and a `getShown()` entry. The eleven generated types are keyed
`<type>Sections`; the other five keep their source names (`ferries`, `tollRoads`, `incidents`,
`tunnels`, `vehicleRestricted`):

```ts
routingModule.events.lowEmissionZoneSections.on('click', (section, lngLat) => { /* LEZ */ });
routingModule.getShown().urbanSections;
```

For full MapLibre control, use `layers.sections` with the same type keys. For the generated types
the layer id is derived from the section type — `motorway` is drawn by `routeSectionMotorwayLine`:

```ts
layers: {
    sections: {
        motorway: { routeSectionMotorwayLine: { paint: { 'line-dasharray': [2, 1] } } },
    },
}
```

---

### MapLibre layer overrides (advanced)

Customize route line paint, add extra layers, modify section visuals:

```ts
import { defaultRoutingLayers, SELECTED_ROUTE_FILTER } from '@tomtom-org/maps-sdk/map';

const routingModule = await RoutingModule.create(map, {
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
import type { WaypointDisplayProps } from '@tomtom-org/maps-sdk/map';
import type { Waypoint } from '@tomtom-org/maps-sdk/core';

// Click on any waypoint pin
routingModule.events.waypoints.on('click', (waypoint: Waypoint<WaypointDisplayProps>, lngLat) => {
    // START_INDEX 'start' | MIDDLE_INDEX 'middle' | FINISH_INDEX 'finish' — all from
    // '@tomtom-org/maps-sdk/map'.
    waypoint.properties.indexType;
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
// Every generated section type has a scope of its own, keyed `<type>Sections`:
routingModule.events.urbanSections.on('click', (section, lngLat) => { /* urban stretch */ });
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
const geometriesModule = await GeometriesModule.create(map, {
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
- `chargingStopsStrategy` without `vehicle.preferences.chargingPreferences` does not compile — the strategy is an EV-endpoint parameter, and only the preferences select that endpoint
- The `tollRoads` overlay draws the `tollRoad` sections, not the `toll` ones — every charged stretch, vignette motorways and city charge zones included, all with the toll-plaza icon
- `leg.originalWaypointIndex` is `undefined` on the final leg and on legs ending at a service-inserted charging stop — handle it rather than assuming a number
- `selectRoute(index)` highlights an alternative without recalculating
- `SELECTED_ROUTE_FILTER` is a MapLibre filter expression — use it in `additional` layers to limit them to the active route
- `MIDDLE_INDEX` is the `indexType` value for intermediate stops (not a number — compare with `===`)
- Every point in `locations` ends a leg and draws a numbered pin — three points give two legs. A path's endpoints count too, so there is no way to shape a route without adding waypoints
- `showWaypoints` takes `PlanningWaypoint[]`, where a `null` is an unset planner slot: it draws no pin but keeps its position, so the stops after it keep their numbers
- `clearRoutes()` does NOT clear waypoints — call `clearWaypoints()` separately if needed
- Only `'car'` travel mode is supported — truck, motorcycle, bicycle, pedestrian are not available in the current API
- Event handlers on overlapping source/layer IDs (e.g., two modules sharing layers) — only the first handler fires
- Long-hover events are suppressed on features already in "clicked" state
- An aborted call rejects with `SDKAbortError` (`name === 'AbortError'`), which has no `status` — match the class before any `error.status` check, or a cancellation reads as an unknown failure
- For map-wide traffic overlays (flow layer, incidents layer) see `docs/traffic.md`
