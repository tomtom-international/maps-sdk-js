# Places & Search Reference

## Imports

```ts
import {
    search, searchOne, geocode, geocodeOne, reverseGeocode,
    autocompleteSearch, placeById, geometryData,
    getPlacesWithEVAvailability, hasChargingAvailability,
    getPOICategories, getPOICategoryCodes,
} from '@tomtom-org/maps-sdk/services';
import { PlacesModule, POIsModule, GeometriesModule } from '@tomtom-org/maps-sdk/map';
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
    const result = await reverseGeocode({ position: [lng, lat] });
    const address = result.features[0]?.properties.address?.freeformAddress;
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

## Autocomplete

```ts
const suggestions = await autocompleteSearch({ query: 'amster', position: [4.9, 52.4] });
```

---

## Gotchas

- `boundingBox`: `[west, south, east, north]`
- `place.properties.poi?.categories` — `POICategory[]` (standardized enum, e.g. `'ITALIAN_RESTAURANT'`)
- `place.properties.poi?.localizedCategories` — `string[]` (human-readable, e.g. `'restaurant'`)
