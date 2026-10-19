# Core Utilities Reference

## Imports

```ts
import {
    bboxFromGeoJSON, bboxFromCoordsArray, bboxFromBBoxes, isBBoxWithArea, bboxCenter, polygonFromBBox,
    getPosition,
    formatDistance, formatDuration,
    findBestWaypointInsertionIndex, findBestWaypointInsertionIndices,
    withInsertedWaypoint, withInsertedWaypoints,
    getSectionBBox, getSectionOverlap, getDistinctSections, getImportantRoads, getSectionsWithin, compareRoutes,
    getInstructionLanes,
    calculateProgressAtRoutePoint, getRouteProgressBetween,
    getRouteProgressForSection, getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
} from '@tomtom-org/maps-sdk/core';
```

---

## Bounding boxes

### `bboxFromGeoJSON`

Extracts or calculates `[west, south, east, north]` from any GeoJSON object or array of them. An existing `bbox` wins; otherwise it is calculated from the geometry, sampling lines longer than 1000 points (use turf's `bbox` for an exact box).

```ts
// From a geocoded place (uses the place's own bbox — often a city-level area)
const place = await geocodeOne('Amsterdam');
const bbox = bboxFromGeoJSON(place);            // [minLng, minLat, maxLng, maxLat] | undefined

// From a FeatureCollection (encompasses all features)
const places = await discoverPlaces({ query: 'coffee', geoBias: { position: [4.9, 52.4] } });
const bbox = bboxFromGeoJSON(places);

// From a route geometry
const bbox = bboxFromGeoJSON(route.features[0].geometry);

// From an array of objects
const bbox = bboxFromGeoJSON([place1, place2, place3]);
```

Returns `[minLng, minLat, maxLng, maxLat] | undefined`.

### `bboxFromCoordsArray`

Calculates bbox from a flat array of `[lng, lat]` coordinates — useful when you have raw coordinate pairs (e.g., multiple origins/destinations) rather than GeoJSON objects. Samples arrays longer than 1000 positions, like `bboxFromGeoJSON`; `undefined` for an empty array.

```ts
const bounds = bboxFromCoordsArray([[4.9, 52.4], [2.3, 48.8], [13.4, 52.5]]);
// → [2.3, 48.8, 13.4, 52.5]
```

### `bboxFromBBoxes`

The bbox containing every given one, skipping `undefined` entries — combine `bboxFromGeoJSON` results without null checks. `undefined` when none is defined.

```ts
const bounds = bboxFromBBoxes([bboxFromGeoJSON(city), bboxFromGeoJSON(cafes)]);
```

### `isBBoxWithArea` and `bboxCenter`

`isBBoxWithArea(bbox)` is `false` for `undefined` and for a box with no width or no height (one point, or a line along a meridian or parallel) — fitting the map to such a box zooms in as far as it goes. `bboxCenter(bbox)` gives the box's `[lng, lat]` centre, to centre on instead; for a box whose west edge lies east of its east edge, that centre is across the antimeridian.

```ts
const bbox = bboxFromGeoJSON(places);
if (bbox && isBBoxWithArea(bbox)) map.mapLibreMap.fitBounds(bbox, { padding: 50 });
else if (bbox) map.mapLibreMap.jumpTo({ center: bboxCenter(bbox), zoom: 15 });
```

### `polygonFromBBox`

Converts a bbox to a GeoJSON `Feature<Polygon>` — useful for displaying a search area on the map.

```ts
const bbox = bboxFromGeoJSON(places);
if (bbox) {
    const bboxPolygon = polygonFromBBox(bbox);
    // use with GeometriesModule.show() or map.mapLibreMap.addSource(...)
}
```

---

## Coordinates

### `getPosition`

Extracts `[longitude, latitude]` from any of: raw array, Point geometry, or Place Feature.

```ts
getPosition([4.9, 52.3]);                          // → [4.9, 52.3]
getPosition({ type: 'Point', coordinates: [...] }); // → [lng, lat]
getPosition(place);                                 // → [lng, lat] from geometry

// Prefer building entrance over geometry centroid
getPosition(place, { useEntryPoint: 'main-when-available' });
```

Returns `[longitude, latitude] | null`.

---

## Formatting

### `formatDuration`

Formats seconds to a human-readable time string. Returns `undefined` if under 30 seconds.

```ts
formatDuration(0);       // undefined
formatDuration(60);      // '1 min'
formatDuration(1800);    // '30 min'
formatDuration(3660);    // '1 hr 01 min'

// Custom units
formatDuration(3660, { hours: 'h', minutes: 'm' });  // '1 h 01 m'

// Route travel time
const { travelTimeInSeconds } = routes.features[0].properties.summary;
formatDuration(travelTimeInSeconds);
```

### `formatDistance`

Formats meters to a human-readable distance string. Supports metric, US imperial, UK imperial.

```ts
formatDistance(7.348);   // '7.3 m'
formatDistance(950);     // '1 km'
formatDistance(2850);    // '2.9 km'

// Imperial
formatDistance(205.95, { type: 'imperial_us' });  // '¼ mi'
formatDistance(150.88, { type: 'imperial_uk' });  // '170 yd'

// Custom labels
formatDistance(1500, { type: 'metric', kilometers: 'KM' });  // '1.5 KM'

// Route distance
const { lengthInMeters } = routes.features[0].properties.summary;
formatDistance(lengthInMeters);
```

### Global default units

```ts
TomTomConfig.instance.put({
    displayUnits: {
        distance: { type: 'imperial_us', feet: 'ft', miles: 'mi' },
        time: { hours: 'hr', minutes: 'min' },
    },
});
// formatDistance() and formatDuration() use these; a per-call options argument overrides them key by key
```

See [Formatting](https://docs.tomtom.com/maps-sdk-js/guides/core/utilities/formatting.md).

---

## Route waypoint utilities

### `withInsertedWaypoint`

Finds the optimal position and inserts a new waypoint into an existing waypoints array without modifying the original.

```ts
const waypoints = [origin, destination];
const newStop = [4.95, 52.35];

const updatedWaypoints = withInsertedWaypoint(routes.features[0], waypoints, newStop);
// → [origin, newStop, destination]

const updatedRoutes = await calculateRoute({ locations: updatedWaypoints });
```

### `withInsertedWaypoints`

Multi-waypoint variant. All projections are computed in a single pass against the original route, then new waypoints are bucketed into slots and sorted within each slot by their along-route location (with stable input-order tie-breaking). The result is independent of input order.

```ts
const waypoints = [origin, destination];
// stops can be passed in any order — the result settles into along-route order
const stops = [pointFurther, pointCloser];

const updated = withInsertedWaypoints(routes.features[0], waypoints, stops);
// → [origin, pointCloser, pointFurther, destination]

const updatedRoutes = await calculateRoute({ locations: updated });
```

Use this whenever you have N new stops (e.g. POIs `discoverPlaces` finds along a `route`) and want to merge them into the route in one shot. Don't call `withInsertedWaypoint` in a loop — the plural variant is O(n+m) on projections and produces correctly ordered output regardless of input order.

### `findBestWaypointInsertionIndex`

Returns the index at which to insert a new waypoint.

```ts
const index = findBestWaypointInsertionIndex(routes.features[0], waypoints, newStop);
// index=1 → insert between waypoints[0] and waypoints[1]
```

### `findBestWaypointInsertionIndices`

Multi-waypoint variant. Returns one slot index per new waypoint, computed in a single pass against the original existing waypoints. Multiple new waypoints may share the same slot. When you also need them merged in correct along-route order, use `withInsertedWaypoints` (which adds within-slot ranking on top of these slot indices).

```ts
const slots = findBestWaypointInsertionIndices(route, existing, [stopA, stopB, stopC]);
// e.g. [1, 2, 1] → A and C both fall between existing[0] and existing[1]; B between [1] and [2]
```

---

## Route section bbox and overlap

### `getSectionBBox`

Returns `[minLng, minLat, maxLng, maxLat]` for any route section, or any `RouteSpan` (uses start, mid, end points for speed), or `undefined` when the route has no coordinates or the indices are out of range or reversed.

```ts
const route = routes.features[0];
const countrySections = route.properties.sections.country;

for (const section of countrySections ?? []) {
    const bbox = getSectionBBox(route, section);
    if (bbox) map.mapLibreMap.fitBounds(bbox, { padding: 40 });
}
```

### `getSectionOverlap`

The `RouteSpan` `{ startPointIndex, endPointIndex }` two sections of one route share, of any types, or
`undefined` when they share no segment (meeting at one point isn't sharing). Use it to cross section
types instead of comparing point indexes yourself:

```ts
const { country = [], toll = [] } = route.properties.sections;
const france = country.find((section) => section.countryCodeISO3 === 'FRA');
const tollsInFrance = france ? toll.filter((section) => getSectionOverlap(section, france)) : [];
```

---

## Distinct sections — what sets each route apart

### `getDistinctSections`

The stretches of each route that no other route drives, one `DistinctSectionProps[]` per route in input
order, each section `{ id, startPointIndex, endPointIndex, lengthInMeters }`. A section runs from the
coordinate where the route leaves the others to the one where it rejoins them; a route crossing at a
junction doesn't split it.

```ts
// Already parsed: with two or more routes, calculateRoute fills sections.distinct on every route.
const own = routes.features[1].properties.sections.distinct ?? [];

// Recompute to drop short stretches, or to compare routes from separate calculations (they match on a
// road only where both carry the same coordinates along it, as one response's routes do).
const named = getDistinctSections(routes, { minLengthInMeters: 1000 });
const ownMeters = named[1].reduce((total, section) => total + section.lengthInMeters, 0);
```

- Takes `Routes` or `Route[]`, and `DistinctSectionsOptions` `{ minLengthInMeters }`. A route sharing every road with the others gets `[]`; a single route is
  one section end to end.
- `RoutingModule` doesn't draw `distinct`, but `setSectionFocus` rings sections of any type, so
  `routingModule.setSectionFocus(own.map((section) => section.id))` highlights a route's own stretches.
  That only finds ids on the shown routes, so pass the parsed `sections.distinct`, not a recomputed one.

### `getImportantRoads`

The motorways and main roads a route takes, from its `importantRoadStretch` sections: one
`ImportantRoad` `{ index, name?, roadNumbers, streetName?, lengthInMeters, sections }` per road, in order along
the route. With `within: sections.distinct` it names what sets each route apart ("via A26, A1"); don't
rebuild this from `importantRoadStretch` or guidance yourself.

```ts
const roads = getImportantRoads(route, { within: route.properties.sections.distinct, minLengthInMeters: 2000 });
const via = roads.map((road) => road.name).filter(Boolean).join(' · ');

// Ring one road on the map, say while its chip is hovered
await routingModule.setSectionFocus(roads[0].sections.map((section) => section.id));
```

- A road is the stretches sharing a first road number, or a street name when they have none: the API
  can rank the stretches of one motorway apart (`A16/E402` and `A16`), and the road still comes once.
  `name` is that first road number, else the street name. Stretches with neither group by their
  `index` into a road with no `name`, hence the `.filter(Boolean)`.
- `ImportantRoadsOptions`: `within` takes non-overlapping `RouteSpan`s, `{ startPointIndex, endPointIndex }` such as sections, and
  counts only the parts inside them; without it, the whole route counts, as for a route calculated alone, which has no
  `sections.distinct`. `lengthInMeters` is that count.
- `index` is the road's importance, that of its most important stretch: the lower, the more important.
- A route calculated with a `sectionTypes` list that leaves out `importantRoadStretch` has no roads (`[]`).

### `getSectionsWithin`

A route's sections of every type within spans of it (`SectionsWithin`): per type it has there, a `SectionsWithinOfType`
`{ sections, shares, lengthInMeters }`, sections whole (ids suit `setSectionFocus`), length counting only the
parts within, `shares[i]` the part of `sections[i]` within (0–1; prorate a jam's `delayInSeconds` by it). `SectionsWithinOptions`: `types` narrows it (default every type), `within` as for `getImportantRoads`. Use it for
what a route's own roads carry (ferries, car trains, tolls, traffic) instead of crossing section
types yourself:

```ts
const own = getSectionsWithin(route, { within: route.properties.sections.distinct, types: ['ferry', 'toll', 'traffic'] });
const { traffic } = own;
const delay = traffic
    ? traffic.sections.reduce((total, jam, i) => total + (jam.delayInSeconds ?? 0) * traffic.shares[i], 0)
    : 0;
```

- A section counts when it shares a segment with a span (`getSectionOverlap`); one touching a span at
  one end doesn't. Types the route doesn't have there are absent, so `own.ferry` alone says "no ferry".
- A leg without point indexes (route with no geometry) is left out.

### `compareRoutes`

`compareRoutes(route, reference, { types? }: CompareRoutesOptions)` → `RouteComparison` `{ distinct, referenceDistinct, adds, avoids }`:
the stretches each drives alone (pairwise `getDistinctSections`, not their `sections.distinct`, which were found against
the whole response), and `getSectionsWithin` on each side. Both `distinct` arrays empty = same roads.

```ts
// What an alternative adds and avoids against the selected route
const { adds, avoids } = compareRoutes(alternative, selected, { types: ['ferry', 'toll'] });

// Why the live route goes this way: compare with the route typical traffic would take.
// A historical-traffic route still carries the live traffic sections along it.
const [live, usual] = await Promise.all([
    calculateRoute({ locations }),
    calculateRoute({ locations, costModel: { traffic: 'historical' } }),
]);
const why = compareRoutes(live.features[0], usual.features[0], { types: ['traffic'] }).avoids.traffic;
const closures = (why?.sections ?? []).filter((incident) => incident.categories.includes('road-closed'));
```

- Separate calls compare where they carry the same coordinates along a shared road; where they
  don't, that road counts as distinct on both sides.
- Without `types` it weighs every type the service returns, never `leg` or `distinct`.
- A closure's traffic section holds no delay: name it from `categories`, don't time it. Summary
  times mislead here too (the usual route's live time ignores its closures), so explain with sections.

---

## Lanes of an instruction

### `getInstructionLanes`

`getInstructionLanes(route, instruction)` → the `lanes` section leading to the maneuver, or `undefined`. A
section leads to the last instruction inside it, else to the next one within 100 m after its end (lanes stop
at the stop line, short of the junction); the closest section wins; of instructions sharing a point (a roundabout's entry
and `EXIT_ROUNDABOUT`) only the first gets lanes. `lanes`
sections come only with `guidance`, and `RoutingModule` draws no lanes: drawing them in a panel is the app's own
code, as in the `route-with-guidance` example.

```ts
const guidedRoute = (await calculateRoute({ locations, guidance: { type: 'coded' } })).features[0];
for (const instruction of guidedRoute.properties.guidance?.instructions ?? []) {
    const lanes = getInstructionLanes(guidedRoute, instruction);
    // lanes?.lanes: [{ directions: ['STRAIGHT', 'SLIGHT_RIGHT'], follow: 'STRAIGHT' }, …], left to right
}
```

---

## Route progress utilities

These functions require `route.properties.progress`, present unless the route was calculated with `extendedRouteRepresentations: []`. Between two `progress` entries they follow the line's length, not its vertex count, so equal steps of distance cover equal ground.

### `calculateProgressAtRoutePoint`

Distance and time at a specific coordinate index along the route.

```ts
const progress = calculateProgressAtRoutePoint(route, 10);
// → { distanceInMeters, travelTimeInSeconds } | undefined
```

### `getRouteProgressBetween` / `getRouteProgressForSection`

Distance and time for a segment between two coordinate indices, or directly from a section object or any `RouteSpan`, such as `getSectionOverlap`'s.

```ts
const segment = getRouteProgressBetween(route, 5, 20);
// → { start, end, delta: { distanceInMeters, travelTimeInSeconds } } | undefined

const section = route.properties.sections.traffic?.[0];
if (section) {
    const sectionProgress = getRouteProgressForSection(route, section);
    sectionProgress && console.log(`${sectionProgress.delta.travelTimeInSeconds}s through the jam`); // travel time, not delay: that is section.delayInSeconds
}
```

### `getCoordinateAtRouteProgress`

Position on the route at a given elapsed time, distance, or absolute clock time.

```ts
// By elapsed time
const byTime = getCoordinateAtRouteProgress(route, { traveledTimeInSeconds: 600 });

// By distance
const byDistance = getCoordinateAtRouteProgress(route, { traveledDistanceInMeters: 5000 });

// By clock time (relative to route departure)
const byClock = getCoordinateAtRouteProgress(route, { clockTime: new Date('2025-06-01T09:10:00Z') });

byTime && console.log(`At 10 min: [${byTime.position}]`);
// → { position: [lng, lat], distanceInMeters, travelTimeInSeconds }
```

### `getProgressAtNearestRoutePoint`

Snaps an arbitrary point to the nearest position on the route — useful for hover/click interactions.

```ts
map.mapLibreMap.on('mousemove', (event) => {
    const result = getProgressAtNearestRoutePoint(route, event.lngLat.toArray());
    if (result) {
        showTooltip(`${formatDistance(result.distanceInMeters)} from start`);
    }
});
// → { position: [lng, lat], distanceInMeters, travelTimeInSeconds } | undefined
```

See [Route utilities](https://docs.tomtom.com/maps-sdk-js/guides/core/utilities/routes.md).
