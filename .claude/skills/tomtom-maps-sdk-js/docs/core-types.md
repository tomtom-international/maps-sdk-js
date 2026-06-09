# Core Types Reference

## Imports

```ts
import type {
    Place, Places, CommonPlaceProps, SearchPlaceProps, RevGeoAddressProps,
    Route, Routes, RouteSummary, SectionsProps,
    TrafficIncident, TrafficIncidentDetails, TrafficIncidentCategory,
    TrafficIncidentProperties, DelayMagnitude, TrafficIncidentTimeValidity,
    trafficIncidentCategories,
} from '@tomtom-org/maps-sdk/core';
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
(place.properties as RevGeoAddressProps).originalPosition;  // [lng, lat] you queried
(place.properties as RevGeoAddressProps).offsetPosition;    // interpolated position
(place.properties as RevGeoAddressProps).sideOfStreet;      // 'L' | 'R'
```

### Entry points

```ts
place.properties.entryPoints?.forEach(ep => {
    ep.type;        // 'main' | 'minor'
    ep.position;    // [longitude, latitude]
    ep.functions;   // ['FrontDoor', 'ParkingGarage', ...]
});
```

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

sections.leg;                // LegSection[] — per waypoint segment
sections.traffic;            // TrafficSectionProps[] — incident-affected stretches
sections.country;            // CountrySection[] — cross-border transitions
sections.toll;               // TollSection[] — toll roads
sections.motorway;           // BaseSection[]
sections.ferry;              // BaseSection[]
sections.tunnel;             // BaseSection[]
sections.pedestrian;         // BaseSection[]
sections.urban;              // BaseSection[]
sections.unpaved;            // BaseSection[]
sections.lanes;              // LaneSection[]
sections.speedLimit;         // SpeedLimitSection[]

// All sections have: startPointIndex, endPointIndex (indices into route.geometry.coordinates)
const section = sections.leg?.[0];
route.geometry.coordinates.slice(section.startPointIndex, section.endPointIndex + 1);
```

### Traffic sections

```ts
sections.traffic?.forEach(t => {
    t.categories;          // TrafficIncidentCategory[] — same type as incident.properties.category
    t.magnitudeOfDelay;    // DelayMagnitude
    t.delayInSeconds;      // number
    t.effectiveSpeedInKmh; // number
});
```

### Guidance

```ts
route.properties.guidance?.instructions.forEach(inst => {
    inst.message;   // 'Turn right onto Dam Square'
    inst.maneuver;  // maneuver code
    inst.point;     // { latitude, longitude }
});
```

---

## Traffic types

### `TrafficIncidentCategory`

```ts
import type { TrafficIncidentCategory } from '@tomtom-org/maps-sdk/core';
import { trafficIncidentCategories } from '@tomtom-org/maps-sdk/core';

// 'accident' | 'animals-on-road' | 'broken-down-vehicle' | 'danger' |
// 'flooding' | 'fog' | 'frost' | 'jam' | 'lane-closed' | 'narrow-lanes' |
// 'other' | 'rain' | 'road-closed' | 'roadworks' | 'wind'

trafficIncidentCategories; // full list as array — useful for UI filters
```

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
