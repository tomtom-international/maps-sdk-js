# Places & Search Reference

## Imports

```ts
import {
    search, searchOne, geocode, geocodeOne, reverseGeocode,
    autocompleteSearch, placeById, geometryData,
    getPlacesWithEVAvailability, hasChargingAvailability,
    getPOICategories, getPOICategoryCodes,
} from '@tomtom-org/maps-sdk/services';
import type { AutocompleteSearchBrandSegment, AutocompleteSearchCategorySegment } from '@tomtom-org/maps-sdk/services';
import { PlacesModule, POIsModule, GeometriesModule } from '@tomtom-org/maps-sdk/map';
import type { PlaceIconConfig, PlacesTheme, MapFont } from '@tomtom-org/maps-sdk/map';
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { ViewportPlaces } from '@tomtom-org/maps-sdk-plugin-viewport-places';
// npm i @tomtom-org/maps-sdk-plugin-viewport-places
```

---

## Search → display on map

```ts
const placesModule = await PlacesModule.get(map);

const places = await search({ query: 'coffee shop', position: [4.9, 52.4], limit: 20 });
await placesModule.show(places);

placesModule.events.on('click', (place, lngLat) => {
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
const places = await search({
    poiCategories: ['PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA'],
    position: [4.9, 52.4],
    limit: 50,
});
await placesModule.show(places);
```

`poiCategories` accepts `POICategory` enum values (e.g. `'ITALIAN_RESTAURANT'`). Discover codes by keyword:

```ts
// Get codes matching a keyword — pass directly to search
const codes = await getPOICategoryCodes({ filters: ['restaurant'] });
const places = await search({ poiCategories: codes, position: [4.9, 52.4] });

// Full category objects (name, synonyms, childCategoryCodes)
const { poiCategories } = await getPOICategories({ filters: ['gym'] });
poiCategories.forEach(c => console.log(c.code, c.name));
```

---

## Search within a boundary (geocode → geometry → search)

```ts
const area = await geocodeOne('Paris, France');
const boundary = await geometryData({ geometries: area, zoom: 10 });

const places = await search({
    poiCategories: ['ITALIAN_RESTAURANT'],
    geometries: [boundary.features[0].geometry],
    limit: 100,
});

const placesModule = await PlacesModule.get(map);
const geometriesModule = await GeometriesModule.get(map, { theme: 'inverted' });

await placesModule.show(places);
await geometriesModule.show(boundary);
map.mapLibreMap.fitBounds(boundary.bbox);
```

---

## Search within a circle or bounding box

```ts
// Circle
const places = await search({
    query: 'restaurant',
    geometries: [{ type: 'Circle', coordinates: [4.9, 52.4], radius: 2000 }], // radius in meters
});

// Bounding box
const places = await search({
    poiCategories: ['BUS_STOP'],
    boundingBox: [4.72, 52.27, 5.07, 52.43], // [west, south, east, north]
});
```

---

## Along-route search — find POIs along a planned route

`search()` dispatches to along-route search when a `route` parameter is provided.

**Route input** accepts three forms:
- `Route` Feature from `calculateRoute` (most common)
- `LineString` GeoJSON geometry
- `Position[]` — plain array of `[longitude, latitude]` pairs

```ts
import { calculateRoute, geocodeOne, search } from '@tomtom-org/maps-sdk/services';
import type { Waypoint } from '@tomtom-org/maps-sdk/core';

// Most common: use a Route Feature from calculateRoute
const waypoints: Waypoint[] = await Promise.all(['Amsterdam', 'Utrecht'].map(geocodeOne));
const routes = await calculateRoute({ locations: waypoints });

const evStations = await search({
    route: routes.features[0],          // Route Feature
    maxDetourTimeSeconds: 600,          // required — positive integer
    poiCategories: ['ELECTRIC_VEHICLE_STATION'],
    limit: 10,
});

// Or pass a LineString geometry directly
const cafes = await search({
    route: routes.features[0].geometry, // LineString
    maxDetourTimeSeconds: 300,
    query: 'cafe',
    sortBy: 'detourOffset',             // 'detourTime' | 'detourOffset'
});

// Or pass a plain coordinate array
const stops = await search({
    route: [[4.9, 52.37], [4.95, 52.28], [5.1, 52.09]], // Position[]
    maxDetourTimeSeconds: 600,
    poiCategories: ['GAS_STATION'],
});
```

**Display on map:**

```ts
const placesModule = await PlacesModule.get(map);
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

## Place by ID — full details with opening hours

```ts
const place = await placeById({
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
    const place = await placeById({
        entityId: feature.properties.id,
        openingHours: 'nextSevenDays',
    });
    if (place) showDetailsPanel(place);
});
```

---

## EV charging — search, availability, display

```ts
const stations = await search({
    poiCategories: ['ELECTRIC_VEHICLE_STATION'],
    connectors: ['IEC62196Type2CCS'],
    minPowerKW: 50,
    position: [4.9, 52.4],
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

poisModule.filterCategories({ show: 'all_except', values: ['FOOD_DRINKS_GROUP', 'PARKING_GROUP'] });
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
    categories: ['ELECTRIC_VEHICLE_STATION'],
    minZoom: 10,
});

// Custom search options
await viewportPlaces.add({
    id: 'restaurants',
    searchOptions: { poiCategories: ['ITALIAN_RESTAURANT'], limit: 50 },
    minZoom: 12,
});

await viewportPlaces.update({ id: 'restaurants', searchOptions: { limit: 30 } });
viewportPlaces.remove('restaurants');
```

---

## Multiple PlacesModule instances — different styling per category

```ts
const restaurants = await PlacesModule.get(map, { icon: { iconColor: '#e74c3c' } });
const hotels      = await PlacesModule.get(map, { icon: { iconColor: '#3498db' } });

await restaurants.show(await search({ poiCategories: ['RESTAURANT'], position }));
await hotels.show(await search({ poiCategories: ['HOTEL_MOTEL'], position }));
```

---

## PlacesModule — themes and styling

### Theme

```ts
// At init time
const places = await PlacesModule.get(map, { theme: 'base-map' });
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
const places = await PlacesModule.get(map, {
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
        { id: 'ELECTRIC_VEHICLE_STATION', image: myLogo, pixelRatio: 1 },
        { id: 'CAFE_PUB', image: 'https://example.com/icon.png', pixelRatio: 1 },
    ],
};

places.applyIconConfig(iconConfig);
// or: pass as icon: { ... } at get() time using the same shape
```

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

### BYOD — display your own GeoJSON as places

```ts
import type { Places } from '@tomtom-org/maps-sdk/core';

const data: Places = await fetch('https://your-api.com/data.json').then(r => r.json());

const places = await PlacesModule.get(map, {
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
const places = await search({ poiBrands: ['Starbucks'], position: [4.9, 52.4] });

// Typeahead (partial query)
const places = await search({ query: 'amst', typeahead: true, position: [4.9, 52.4] });

// Search for administrative geographies (e.g. to get geometry IDs for municipalities)
const places = await search({
    countries: ['ESP'],
    geographyTypes: ['Municipality'],
    limit: 16,
});
```

---

## Autocomplete with segment filtering

```ts
const response = await autocompleteSearch({ query: 'star', limit: 5 });

// Segments: 'category' | 'brand' | 'plaintext'
for (const result of response.results) {
    const seg = result.segments[0] as AutocompleteSearchBrandSegment | AutocompleteSearchCategorySegment;

    if (seg.type === 'category') {
        // seg.category is a POICategory value — pass to search({ poiCategories: [seg.category] })
        const places = await search({ poiCategories: [seg.category], boundingBox: map.getBBox() });
    } else if (seg.type === 'brand') {
        // seg.value is the brand name — pass to search({ poiBrands: [seg.value] })
        const places = await search({ poiBrands: [seg.value], boundingBox: map.getBBox() });
    }
}
```

---

## Gotchas

- `boundingBox`: `[west, south, east, north]`
- `place.properties.poi?.categories` — `POICategory[]` (standardized enum, e.g. `'ITALIAN_RESTAURANT'`)
- `place.properties.poi?.localizedCategories` — `string[]` (human-readable, e.g. `'restaurant'`)
- `applyExtraFeatureProps` properties are accessible in MapLibre expressions via `['get', 'propName']`
- `applyTextConfig` / `applyIconConfig` / `applyTheme` are runtime methods — apply after `get()`
