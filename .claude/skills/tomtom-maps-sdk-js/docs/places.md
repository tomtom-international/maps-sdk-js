# Places & Search Reference

## Imports

```ts
import {
    discoverPlaces, discoverOnePlace, geocode, geocodeOne, reverseGeocode,
    getSearchSuggestions, getPlaceDetails, geometryData,
    getPlacesWithEVAvailability, hasChargingAvailability,
    getPOICategories, getPOICategoryCodes,
} from '@tomtom-org/maps-sdk/services';
import type { SearchSuggestionsParams, SearchSuggestion, PlaceSuggestion, RefinementSuggestion } from '@tomtom-org/maps-sdk/services';
import { PlacesModule, POIsModule, GeometriesModule } from '@tomtom-org/maps-sdk/map';
import type { PlaceIconConfig, PlacesTheme, MapFont } from '@tomtom-org/maps-sdk/map';
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { ViewportPlaces } from '@tomtom-org/maps-sdk-plugin-viewport-places';
// npm i @tomtom-org/maps-sdk-plugin-viewport-places
```

---

## Search → display on map

```ts
const placesModule = await PlacesModule.create(map);

const places = await discoverPlaces({ query: 'coffee shop', geoBias: { position: [4.9, 52.4] }, limit: 20 });
await placesModule.show(places);

// `events` covers every surface the module draws; `events.places` is the pins alone, typed as Place
placesModule.events.places.on('click', (place, lngLat) => {
    console.log(place.properties.poi?.name, place.properties.address.freeformAddress);
});

await placesModule.clear();
```

---

## Geocode → display on map

```ts
// Single result — throws if not found
const place = await geocodeOne('Amsterdam Centraal');
await placesModule.show(place);
map.mapLibreMap.fitBounds(bboxFromGeoJSON(place));

// Multiple candidates
const places = await geocode({ query: 'Paris', limit: 5, countrySet: ['FR'] });
```

---

## Reverse geocode on map click

```ts
map.mapLibreMap.on('click', async (event) => {
    const { lng, lat } = event.lngLat;
    const place = await reverseGeocode({ position: [lng, lat] });
    const address = place.properties.address?.freeformAddress;
    showAddressLabel(address);
});
```

---

## POI category search

```ts
const places = await discoverPlaces({
    poiCategories: ['PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA'],
    geoBias: { position: [4.9, 52.4] },
    limit: 50,
});
await placesModule.show(places);
```

`poiCategories` accepts `POICategory` enum values (e.g. `'ITALIAN_RESTAURANT'`). Discover codes by keyword:

```ts
// Get codes matching a keyword — pass directly to search
const codes = await getPOICategoryCodes({ filters: ['restaurant'] });
const places = await discoverPlaces({ poiCategories: codes, geoBias: { position: [4.9, 52.4] } });

// Full category objects (name, synonyms, childCategoryCodes)
const { poiCategories } = await getPOICategories({ filters: ['gym'] });
poiCategories.forEach(c => console.log(c.code, c.name));
```

---

## Search within a boundary (geocode → geometry → search)

```ts
const area = await geocodeOne('Paris, France');
const boundary = await geometryData({ geometries: area, zoom: 10 });

const places = await discoverPlaces({
    poiCategories: ['ITALIAN_RESTAURANT'],
    geometries: [boundary.features[0].geometry],
    limit: 100,
});

const placesModule = await PlacesModule.create(map);
const geometriesModule = await GeometriesModule.create(map, { theme: 'inverted' });

await placesModule.show(places);
await geometriesModule.show(boundary);
map.mapLibreMap.fitBounds(boundary.bbox);
```

---

## Search within a circle or bounding box

```ts
// Circle
const places = await discoverPlaces({
    query: 'restaurant',
    geometries: [{ type: 'Circle', coordinates: [4.9, 52.4], radius: 2000 }], // radius in meters
});

// Bounding box
const places = await discoverPlaces({
    poiCategories: ['BUS_STOP'],
    geoBias: { boundingBox: [4.72, 52.27, 5.07, 52.43] }, // [west, south, east, north]
});
```

---

## Along-route search — find POIs along a planned route

`discoverPlaces()` dispatches to along-route search when a `route` parameter is provided.

**Route input** accepts three forms:
- `Route` Feature from `calculateRoute` (most common)
- `LineString` GeoJSON geometry
- `Position[]` — plain array of `[longitude, latitude]` pairs

```ts
import { calculateRoute, geocodeOne, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import type { Waypoint } from '@tomtom-org/maps-sdk/core';

// Most common: use a Route Feature from calculateRoute
const waypoints: Waypoint[] = await Promise.all(['Amsterdam', 'Utrecht'].map(geocodeOne));
const routes = await calculateRoute({ locations: waypoints });

const evStations = await discoverPlaces({
    route: routes.features[0],          // Route Feature
    maxDetourTimeSeconds: 600,          // required — positive integer
    poiCategories: ['CHARGING_LOCATION'],
    limit: 10,
});

// Or pass a LineString geometry directly
const cafes = await discoverPlaces({
    route: routes.features[0].geometry, // LineString
    maxDetourTimeSeconds: 300,
    query: 'cafe',
    sortBy: 'detourOffset',             // 'detourTime' | 'detourOffset'
});

// Or pass a plain coordinate array
const stops = await discoverPlaces({
    route: [[4.9, 52.37], [4.95, 52.28], [5.1, 52.09]], // Position[]
    maxDetourTimeSeconds: 600,
    poiCategories: ['FUEL_STATION'],
});
```

**Display on map:**

```ts
const placesModule = await PlacesModule.create(map);
await placesModule.show(evStations);
```

**Parameters unique to along-route search:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `route` | Yes | `Route \| LineString \| Position[]` — the route to search along |
| `maxDetourTimeSeconds` | Yes | Max allowed detour in seconds (positive integer) |
| `sortBy` | No | `'detourTime'` (default) or `'detourOffset'` (position along route) |

All [common search parameters](#poi-category-search) (`query`, `poiCategories`, `limit`, `language`, etc.) also apply.

**Gotcha:** `route` and `geometries` are mutually exclusive — do not pass both.

---

## Place details — full details with opening hours

```ts
const place = await getPlaceDetails({
    entityId: feature.properties.id,
    openingHours: 'nextSevenDays',
});

if (place) {
    const hours = place.properties.poi?.openingHours;
    if (hours?.alwaysOpenThisPeriod) {
        console.log('Open 24/7');
    } else {
        hours?.timeRanges.forEach(({ start, end }) => {
            console.log(`${start.date.toLocaleString()} – ${end.date.toLocaleString()}`);
        });
    }
}
```

**Pattern: map POI click → fetch details**

```ts
const poisModule = await POIsModule.get(map);

poisModule.events.on('click', async (feature) => {
    const place = await getPlaceDetails({
        entityId: feature.properties.id,
        openingHours: 'nextSevenDays',
    });
    if (place) showDetailsPanel(place);
});
```

---

## EV charging — search, availability, display

> Gated — the availability calls (`evChargingStationsAvailability`, `getPlace(s)WithEVAvailability`) need an API key with EV Charging Stations Availability access, which Freemium and Pay As You Grow (PAYG) keys do not have; the developer requests it from TomTom Sales. Searching for stations does not. `getPlace(s)WithEVAvailability` swallow a failed request, so a key without access shows up as stations with no `availability`, not as an error.

```ts
const stations = await discoverPlaces({
    poiCategories: ['CHARGING_LOCATION'],
    connectors: ['IEC62196Type2CCS'],
    minPowerKW: 50,
    geoBias: { position: [4.9, 52.4] },
});

const withAvailability = await getPlacesWithEVAvailability(stations);
await placesModule.show(withAvailability);

withAvailability.features.forEach(station => {
    if (hasChargingAvailability(station.properties.chargingPark)) {
        const { statusCounts } = station.properties.chargingPark.availability.chargingPointAvailability;
        console.log(`Available connectors: ${statusCounts.Available ?? 0}`);
    }
});
```

---

## POIsModule — filter and interact with map's built-in POIs

```ts
const poisModule = await POIsModule.get(map, { visible: true });

poisModule.filterCategories({ show: 'all-except', values: ['FOOD_DRINKS_GROUP', 'PARKING_GROUP'] });
poisModule.filterCategories(undefined); // reset
poisModule.setVisible(false);

poisModule.events.on('click', (feature, lngLat) => {
    // feature.properties: id, name, category, group
});
```

Category groups: `FOOD_DRINKS_GROUP`, `SHOPPING_GROUP`, `TRANSPORTATION_GROUP`, `HEALTH_GROUP`, `PARKING_GROUP`, `HOLIDAY_TOURISM_GROUP`, `EV_CHARGING_STATIONS_GROUP`, `GAS_STATIONS_GROUP`, `ACCOMMODATION_GROUP`, `ENTERTAINMENT_GROUP`, `EDUCATION_GROUP`, `GOVERNMENT_GROUP`, `SPORTS_LEISURE_GROUP`

---

## ViewportPlaces — live search as map moves

```ts
const viewportPlaces = new ViewportPlaces(map);

// Sync base-map POI categories (shows same icons as map, but interactive)
await viewportPlaces.addPOICategories({
    id: 'ev-stations',
    categories: ['CHARGING_LOCATION'],
    minZoom: 10,
});

// Custom search options
await viewportPlaces.add({
    id: 'restaurants',
    searchOptions: { poiCategories: ['ITALIAN_RESTAURANT'], limit: 50 },
    minZoom: 12,
});

await viewportPlaces.update({ id: 'restaurants', searchOptions: { limit: 30 } });
viewportPlaces.remove('restaurants'); // update and remove both throw for an unknown ID
```

---

## Multiple PlacesModule instances — different styling per category

```ts
const restaurants = await PlacesModule.create(map, { icon: { iconColor: '#e74c3c' } });
const hotels      = await PlacesModule.create(map, { icon: { iconColor: '#3498db' } });

await restaurants.show(await discoverPlaces({ poiCategories: ['RESTAURANT'], position }));
await hotels.show(await discoverPlaces({ poiCategories: ['HOTEL_OR_MOTEL'], position }));
```

---

## PlacesModule — themes and styling

### Theme

```ts
// At init time
const places = await PlacesModule.create(map, { theme: 'base-map' });
// Available themes: 'pin' | 'circle-icon' | 'base-map' (default: 'pin')
// - 'pin': classic teardrop pin markers
// - 'circle-icon': centered circular POI icons (same sprites as base-map's POI layer)
// - 'base-map': full base-map POI styling (POI + POI - Micro at the respective zooms).
//   To render micro-only, hide `main` via `layers.main.layout.visibility = 'none'`.

// At runtime
places.applyTheme('pin');
places.applyTheme('circle-icon');
places.applyTheme('base-map');
```

### MapLibre layer paint overrides

```ts
const places = await PlacesModule.create(map, {
    theme: 'base-map',
    layers: {
        main:     { paint: { 'text-color': '#AA0000', 'icon-opacity': 0.75 } },
        selected: { paint: { 'text-color': 'red' } },
        // zoom-based visibility:
        // main: { minzoom: 15 }
    },
});
```

### Custom category icons

```ts
import myLogo from './myLogo.png';

const iconConfig: PlaceIconConfig = {
    categoryIcons: [
        { id: 'CHARGING_LOCATION', image: myLogo, pixelRatio: 1 },
        { id: 'CAFE_PUB', image: 'https://example.com/icon.png', pixelRatio: 1, offsetX: 0, offsetY: -10 },
    ],
};

places.applyIconConfig(iconConfig);
// or: pass as icon: { ... } at get() time using the same shape
```

`offsetX`/`offsetY` (pixels, `CustomImage`) shift a custom icon from its coordinate. Scope:
only a `categoryIcons` entry that also has `image` — no `image` (existing sprite by `id`
alone) means the offset is a no-op. Also honoured by
`RoutingModule` charging stop `customIcons` (see routing.md). Not wired for
`PlaceIconConfig.default.image`, even though it also accepts `CustomImage`.

### Custom text and extra feature properties

```ts
// Custom title function
places.applyTextConfig({ title: (place) => place.properties.poi?.name ?? '' });

// Multi-line label using MapLibre format expression
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
const label: DataDrivenPropertyValueSpecification<string> = [
    'format',
    ['get', 'title'], { 'font-scale': 0.9 }, '\n', {},
    ['get', 'phone'], { 'font-scale': 0.8, 'text-color': '#3125d1' },
];
places.applyTextConfig({ title: label });

// Inject dynamic properties accessible in expressions via ['get', 'propName']
places.applyExtraFeatureProps({
    phone: (place) => `Tel: ${place.properties.poi?.phone}`,
    staticProp: 'Some static value',
});
```

### Programmatic hover/click state (sync list ↔ map)

```ts
// Trigger hover state on a pin from outside the map (e.g. list mouseenter)
places.putEventState({ id: place.id, state: 'hover', mode: 'put' });

// Clear all event states (e.g. list mouseleave)
places.cleanEventStates();

// Read current config
const config = places.getConfig();
```

### Entry points (entrances) of places

Off unless `entryPoints` is set; then each shown place's `properties.entryPoints` (search, geocode,
reverse geocode) draws as a dot per entrance (larger for `type: 'main'`) plus a dotted line to the place.

```ts
const places = await PlacesModule.create(map, {
    entryPoints: {
        showFor: 'clicked', // 'all' | 'selected' (hover or click, default) | 'clicked'
        minZoom: 16,        // default 15
        layers: { line: { layout: { visibility: 'none' } } }, // MapLibre overrides: point, line
    },
});
// 'selected'/'clicked' need event states: register any handler (or use putEventState)
places.events.on('click', () => {});
places.updateConfig({ entryPoints: { showFor: 'all' } }); // keeps the rest; entryPoints: undefined stops them

// Payload: Feature<Point> at the entrance (dot or line hit alike), parent place by reference
places.events.entryPoints.on('click', (entryPoint) => {
    const { type, functions, entryPointIndex, placeID, place } = entryPoint.properties;
    // entryPoint is a valid route location: calculateRoute({ locations: [origin, entryPoint] })
});
```

- Hovering or clicking an entry point keeps its place's entry points drawn only if a handler covers
  them (`events` or `events.entryPoints`; `events.places` alone does not); under `selected` a
  `recently-hovered` pin counts too (see `user-events.md`).
- Dots draw over the pins, lines under them. `theme: 'pin-clustered'` raises `minZoom` to 18.
- `reverseGeocode` geometry is the queried point: set `geometry.coordinates` to
  `properties.originalPosition` (the matched address) before `show`.

### BYOD — display your own GeoJSON as places

```ts
import type { Places } from '@tomtom-org/maps-sdk/core';

const data: Places = await fetch('https://your-api.com/data.json').then(r => r.json());

const places = await PlacesModule.create(map, {
    theme: 'base-map',
    icon: { mapping: { to: 'poiCategory', fn: () => 'COMPANY' } }, // map all to one icon
    text: { title: (place) => place.properties['Name'] },
    layers: { main: { minzoom: 15 } },
});

await places.show(data);
```

---

## Search — additional options

```ts
// Brand-based search
const places = await discoverPlaces({ poiBrands: ['Starbucks'], geoBias: { position: [4.9, 52.4] } });

// Typeahead (partial query)
const places = await discoverPlaces({ query: 'amst', typeahead: true, geoBias: { position: [4.9, 52.4] } });

// Search for administrative geographies (e.g. to get geometry IDs for municipalities)
const places = await discoverPlaces({
    countries: ['ESP'],
    geographyTypes: ['Municipality'],
    limit: 16,
});
```

---

## Search suggestions — places, brands and categories for a search box

Use this for a search box. `getSearchSuggestions()` calls search and autocomplete in parallel and merges them
into one ranked list, so `'italian'` returns the cuisine *category* and *Ristorante Italiano down
the road* together. Not typeahead-only: a complete query works as well as a partial one.

```ts
const { suggestions } = await getSearchSuggestions({
    query: 'italian',
    maxResults: 5,                // default 5, capped at 10
    origin: [4.9, 52.4],          // biases both arms; distances are measured from here
    filters: { countries: ['NLD'] },
    signal: controller.signal,    // one signal for both calls
});

for (const result of suggestions) {
    if (result.kind === 'brand' || result.kind === 'category') {
        // A refinement, not a location: no geometry. Run the follow-up it describes.
        const narrowed = await result.refine();            // === discoverPlaces(result.refineParams)
        const adjusted = await discoverPlaces({ ...result.refineParams, limit: 50 });
    } else {
        const place = await result.resolve();               // the full Place, on pick
        map.flyTo({ center: place.geometry.coordinates });
    }
}
```

`kind` is `'place' | 'address' | 'street' | 'area'` (a location: `id`, `title`, `subtitles`,
`distanceInMeters`, and `resolve()` for the full `Place`) or `'brand' | 'category'` (a refinement:
`refine()` and `refineParams`, no position). Narrow on `kind`; there is no geometry until `resolve()`.
`title` is a POI's name or an address's first line; `subtitles` are the remaining address lines, ending
with the country only when it isn't the one the search is in (`['Rue du Moulin 26', '7800 Ath', 'Belgium']`).

`filters`: `kinds` (result kinds; also decides which arms run), `countries` (both arms), `poiTypes`, `areaTypes`,
`boundingBox` (search arm only; with `origin` too, the box restricts and `origin` only measures distance; `refine()` keeps the box).

The blend follows Places Search v3: at most one brand or category, first, and only when the whole
query names it from a word start (`pizz` → Pizzeria; `baker st`, `amster` → none). A brand also needs
a leading place carrying it. Places follow in search order. Asking only for `brand`/`category` via
`filters.kinds` returns every recognised refinement instead. The blend is the SDK's heuristic.

Brand and category suggestions alone — no places — are one request:

```ts
const { suggestions } = await getSearchSuggestions({ query: 'star', filters: { kinds: ['brand', 'category'] } });

for (const refinement of suggestions) {
    if (refinement.kind === 'brand' || refinement.kind === 'category') {
        const places = await discoverPlaces({ ...refinement.refineParams, geoBias: { boundingBox: map.getBBox() } });
    }
}
```

---

## Fields that may be absent

Not guaranteed — the type is the contract, so guard an optional property rather than assuming a
value.

| Field | What it carries |
| --- | --- |
| `places.properties.totalResults` | Total matches beyond the page returned |
| `places.properties.fuzzyLevel` | How loosely the query was matched |
| `places.properties.geoBias` | The position results were biased towards |
| `places.properties.queryIntent` (fuzzy search) | Coordinates, what3words and "near X" detection |
| `place.properties.score` | Relevance score, for thresholding and merging |
| `places.bbox` | Bounding box, on results covering an area |

```ts
const { offset, numResults, totalResults } = results.properties;
const hasMore = totalResults !== undefined && offset + numResults < totalResults;
```

`fuzzyLevel` absent means "not reported", **not** `0`/exact match.

---

## Gotchas

- `boundingBox`: `[west, south, east, north]`
- `place.properties.poi?.categories` — `POICategory[]` (standardized enum, e.g. `'ITALIAN_RESTAURANT'`)
- `place.properties.poi?.localizedCategories` — `string[]` (human-readable, e.g. `'restaurant'`)
- `applyExtraFeatureProps` properties are accessible in MapLibre expressions via `['get', 'propName']`
- An `extraFeatureProps` entry is a JSON value or a `(place) => jsonValue` callback. To have the
  callbacks typed for a narrower place shape, name it on the config:
  `PlacesModuleConfig<EVChargingStationWithAvailabilityPlaceProps>`
- `applyTextConfig` / `applyIconConfig` / `applyTheme` are runtime methods — apply after `get()`
- `getSearchSuggestions()` costs **two requests** per call unless `filters.kinds` keeps to one side
  (refinement kinds only, or location kinds only), and does no debouncing or caching — that belongs
  in your input loop. A failure on either arm rejects the whole call, as service `SearchSuggestions`. It takes no
  `customServiceBaseURL`, since the call spans two endpoints
- Guard the optional fields rather than assuming them: `place.properties.score`, `places.bbox`,
  and `places.properties.totalResults` / `.fuzzyLevel` / `.geoBias` / `.queryIntent`
