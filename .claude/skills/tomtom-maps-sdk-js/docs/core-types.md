# Core Types Reference

## Imports

```ts
import type {
    Place, Places, CommonPlaceProps, SearchPlaceProps, RevGeoAddressProps,
    Route, Routes, RouteSummary, SectionsProps,
    TrafficIncident, TrafficIncidentDetails, TrafficIncidentCategory,
    TrafficIncidentProperties, DelayMagnitude, TrafficIncidentTimeValidity,
    TrafficIncidentRequestCategory,
} from '@tomtom-org/maps-sdk/core';
// Category lists are runtime values, so they need a value import, not `import type`.
import { fullTrafficIncidentCategories, trafficIncidentRequestCategories } from '@tomtom-org/maps-sdk/core';
```

---

## Place object

All services return `Place = Feature<Point>` or `Places = FeatureCollection<Point>`.

```ts
const place: Place = await geocodeOne('Amsterdam');

// Geometry
place.geometry.coordinates;          // [longitude, latitude]

// Presence/type
place.properties.type;               // 'POI' | 'Street' | 'Geography' | 'Point Address' | 'Address Range' | 'Cross Street'

// Address
place.properties.address.freeformAddress;    // 'Dam Square 1, 1012 JS Amsterdam, Netherlands'
place.properties.address.streetNumber;       // '1'
place.properties.address.streetName;         // 'Dam Square'
place.properties.address.municipality;       // 'Amsterdam'
place.properties.address.countryCode;        // 'NL'
place.properties.address.countryCodeISO3;    // 'NLD'
place.properties.address.postalCode;         // '1012 JS'
place.properties.address.countrySubdivision; // 'North Holland'
```

### POI properties (when `type === 'POI'`)

```ts
const poi = place.properties.poi;        // undefined if not a POI

poi?.name;                               // 'Starbucks'
poi?.phone;                              // '+31 20 123 4567'
poi?.url;                                // 'https://starbucks.com'
poi?.brands;                             // ['Starbucks']
poi?.categories;                         // POICategory[] — e.g. ['COFFEE_SHOP'] (standardized enum)
poi?.localizedCategories;               // string[] — e.g. ['coffee shop'] (human-readable)
poi?.openingHours?.alwaysOpenThisPeriod; // boolean
poi?.openingHours?.timeRanges;          // [{ start: { date, hour, minute }, end: {...} }]
poi?.timeZone?.ianaId;                   // 'Europe/Amsterdam'
```

### Data source IDs (for follow-up calls)

```ts
place.properties.dataSources?.geometryId;      // pass to geometryData()
place.properties.dataSources?.poiDetailsId;    // pass to placeById()
place.properties.dataSources?.evAvailabilityId;// pass to getPlacesWithEVAvailability()
```

### Search-specific properties

```ts
// Only on results from search() — not on geocode()
(place as Place & { properties: SearchPlaceProps }).properties.score;    // relevance score
(place as Place & { properties: SearchPlaceProps }).properties.distance; // meters from bias position
```

### Reverse geocode-specific properties

```ts
(place.properties as RevGeoAddressProps).originalPosition;  // [lng, lat] the service matched
// note: place.geometry holds the [lng, lat] you queried
```

### Entry points

```ts
place.properties.entryPoints?.forEach(ep => {
    ep.type;        // 'main' | 'minor' — absent on reverse geocoded places
    ep.position;    // [longitude, latitude]
    ep.functions;   // ['FrontDoor', 'ParkingGarage', ...]
});
```

Reverse geocoding fills `entryPoints` too, from the points the service places on the road network,
so `getPosition(place, { useEntryPoint: 'main-when-available' })` and routing's `useEntryPoints`
work the same on a reverse geocoded address as on a search result.

### Related POIs (parent / child relationships)

```ts
place.properties.relatedPois?.forEach(rel => {
    rel.relationType;  // 'parent' | 'child'
    rel.id;            // use with placeById()
});
```

---

## Route object

`calculateRoute()` returns `Routes = FeatureCollection<LineString>`.

```ts
const routes: Routes = await calculateRoute({ locations: [origin, destination] });
const route: Route = routes.features[0];

// Path
route.geometry.coordinates;           // [lng, lat][] — all path points

// Index (0 = main route, 1+ = alternatives)
route.properties.index;               // 0
```

### Summary

```ts
const s: RouteSummary = route.properties.summary;

s.lengthInMeters;                      // total distance
s.travelTimeInSeconds;                 // total duration
s.trafficDelayInSeconds;               // extra time due to traffic
s.trafficLengthInMeters;               // traffic-affected distance
s.arrivalTime;                         // Date object
s.departureTime;                       // Date object
s.noTrafficTravelTimeInSeconds;        // free-flow time
s.historicTrafficTravelTimeInSeconds;  // historical average

// EV only
s.batteryConsumptionInkWh;
s.remainingChargeAtArrivalInkWh;
s.totalChargingTimeInSeconds;

// Combustion only
s.fuelConsumptionInLiters;
```

### Sections

```ts
const sections: SectionsProps = route.properties.sections;

sections.leg;                // LegSectionProps[] — per waypoint segment
sections.traffic;            // TrafficSectionProps[] — incident-affected stretches
sections.country;            // CountrySectionProps[] — cross-border transitions
sections.toll;               // SectionProps[] — stretches charging a per-use toll
sections.tollRoad;           // SectionProps[] — stretches that cost money by ANY scheme
sections.tollVignette;       // CountrySectionProps[] — one per country needing a vignette
sections.motorway;           // SectionProps[]
sections.ferry;              // SectionProps[]
sections.tunnel;             // SectionProps[]
sections.pedestrian;         // SectionProps[]
sections.urban;              // SectionProps[]
sections.unpaved;            // SectionProps[]
sections.lanes;              // LaneSectionProps[]
sections.speedLimit;         // SpeedLimitSectionProps[]

// All sections have: startPointIndex, endPointIndex (indices into route.geometry.coordinates)
const section = sections.leg?.[0];
route.geometry.coordinates.slice(section.startPointIndex, section.endPointIndex + 1);
```

**`toll` vs `tollRoad`.** `toll` answers *will this cost a toll to drive*; `tollRoad` answers *does
this cost anything at all to drive* — a vignette-only motorway or a city charge zone appears in
`tollRoad` and not in `toll`. `tollRoad` is a superset of `toll`, and it is what `RoutingModule`'s
toll overlay draws.

### Leg sections

```ts
sections.leg?.forEach(leg => {
    leg.summary;                // RouteSummary for this leg alone
    leg.originalWaypointIndex;  // which entry of the request's `locations` this leg arrives at
});
```

`legs[i]` is **not** reliably the leg arriving at `locations[i + 1]`: on an EV route the service
inserts charging stops of its own. Use `originalWaypointIndex` to map a leg back to a stop the
caller asked for. It is `undefined` on the final leg and on a leg ending at an inserted stop, so
handle that rather than assuming a number.

### Traffic sections

```ts
sections.traffic?.forEach(t => {
    t.categories;          // TrafficIncidentCategory[] — same type as incident.properties.category
    t.magnitudeOfDelay;    // DelayMagnitude
    t.delayInSeconds;      // number
    t.effectiveSpeedInKmh; // number
    t.eventId;             // string — join key back to the traffic incident details service
});
```

### Guidance

```ts
route.properties.guidance?.instructions.forEach(inst => {
    inst.message;         // 'Turn right onto Dam Square' — generated and localised by the service
    inst.maneuver;        // Maneuver code, e.g. 'TURN_RIGHT'
    inst.maneuverPoint;   // Position — [lng, lat]
    inst.roundaboutType;  // 'REGULAR' | 'SMALL' — on roundabout maneuvers
    inst.maneuverView;    // { onRouteAngle?: ManeuverAngle, offRouteAngles: ManeuverAngle[] }
    inst.sideRoads;       // SideRoad[] — { side, offsetFromManeuverInMeters, isDrivable? }
});
```

- `message` is present on **every** instruction, in the request's language — a turn list needs no
  translation table of your own.
- `ManeuverAngle` is a relative direction, not degrees: `'STRAIGHT' | 'SLIGHT_RIGHT' | 'RIGHT' |
  'SHARP_RIGHT' | 'SLIGHT_LEFT' | 'LEFT' | 'SHARP_LEFT' | 'BACK'`. `maneuverView` describes the
  junction layout — the direction the route takes, plus the directions it does not.
- `SideRoadSide` is `'LEFT' | 'RIGHT' | 'LEFT_AND_RIGHT'`; `isDrivable` says whether the side road
  can actually be driven into.
- Phonetics live on name fields as `TextWithPhonetics`: `inst.nextRoadInfo.streetName?.phonetic` is a
  **flat string**, already transcribed in the requested alphabet, alongside `phoneticLanguageCode`.
  Request it with `guidance: { type: 'coded', phonetics: 'IPA' }` (or `'LHP'`).
- `inst.previousRoadInfo` / `inst.nextRoadInfo` are `RoadInformation`, whose `countryCode` is ISO3,
  matching the rest of the SDK.

---

## Traffic types

### `TrafficIncidentCategory`

```ts
import type { TrafficIncidentCategory, TrafficIncidentRequestCategory } from '@tomtom-org/maps-sdk/core';
import { fullTrafficIncidentCategories, trafficIncidentRequestCategories } from '@tomtom-org/maps-sdk/core';

// TrafficIncidentCategory — the 15 categories an incident can be *received* with:
// 'accident' | 'animals-on-road' | 'broken-down-vehicle' | 'danger' |
// 'flooding' | 'fog' | 'frost' | 'jam' | 'lane-closed' | 'narrow-lanes' |
// 'other' | 'rain' | 'road-closed' | 'roadworks' | 'wind'

fullTrafficIncidentCategories;    // all 15, as a readonly array — use for a legend or a display filter
trafficIncidentRequestCategories; // the 13 accepted as a request filter — use for a search UI
```

**Two lists, and they are not interchangeable.** `TrafficIncidentCategory` /
`fullTrafficIncidentCategories` is what you can *receive*.
`TrafficIncidentRequestCategory` / `trafficIncidentRequestCategories` is the strict subset you
can *send* as `trafficIncidentDetails({ categoryFilter })` — it excludes `'animals-on-road'` and
`'narrow-lanes'`, which arrive on vector-tile features but are rejected by the Incident Details
API with `Unsupported categoryFilter parameter value`. Build request filters from the request
list only.

### `DelayMagnitude`

`'unknown' | 'minor' | 'moderate' | 'major' | 'indefinite'`

- `indefinite` = road closure / unknown duration

### `TrafficIncident` and `TrafficIncidentDetails`

```ts
// Return type of trafficIncidentDetails()
const result: TrafficIncidentDetails = await trafficIncidentDetails({ bbox: place });

result.features.forEach((incident: TrafficIncident) => {
    incident.geometry.type;              // 'Point' | 'LineString'
    incident.geometry.coordinates;       // [lng, lat] or [[lng, lat], ...]

    const p: TrafficIncidentProperties = incident.properties;
    p.id;
    p.category;           // TrafficIncidentCategory
    p.magnitudeOfDelay;   // DelayMagnitude
    p.events;             // [{ description, code }]
    p.from;               // road name (start of affected stretch)
    p.to;                 // road name (end of affected stretch)
    p.lengthInMeters;
    p.delayInSeconds;
    p.roadNumbers;        // ['A10']
    p.timeValidity;       // 'present' | 'future'
    p.startTime;          // Date | undefined
    p.endTime;            // Date | undefined
    p.probabilityOfOccurrence; // 'certain' | 'probable' | 'risk_of' | 'improbable'
});
```

---

## Gotchas

- `place.properties.poi?.categories` is `POICategory[]` (e.g. `'ITALIAN_RESTAURANT'`) — NOT raw strings
- `place.properties.poi?.localizedCategories` is `string[]` (e.g. `'restaurant'`) — human-readable
- `CommonPlaceProps` has NO `score` field — that is on `SearchPlaceProps` (search results only)
- `RouteSummary.arrivalTime` / `departureTime` are `Date` objects — not ISO strings
- `SectionsProps` has no index signature — access properties by name, not dynamic key
- `DelayMagnitude` is a string union — not a number
- Traffic incident geometry can be either `Point` (local) or `LineString` (road stretch)
