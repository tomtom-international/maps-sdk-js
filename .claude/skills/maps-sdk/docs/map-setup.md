# Map Setup Reference

## Imports

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, BaseMapModule, HillshadeModule, PlacesModule } from '@tomtom-org/maps-sdk/map';
import { calculatePaddedBBox, calculatePaddedCenter } from '@tomtom-org/maps-sdk/map';
```

---

## Map initialization

```ts
const map = new TomTomMap({
    style: 'standardLight',   // see styles below
    language: 'en-GB',        // affects map labels
    mapLibre: {
        container: 'map',     // HTML element id — needs explicit CSS dimensions
        center: [4.9, 52.4],  // [longitude, latitude]
        zoom: 12,
    },
});

map.setStyle('monoDark');    // switch style dynamically — preserves all module state
map.setLanguage('fr-FR');    // change map label language dynamically
map.getBBox();               // → [west, south, east, north]
```

**Styles:** `standardLight` (default), `standardDark`, `drivingLight`, `drivingDark`, `monoLight`, `monoDark`, `satellite`

---

## Module architecture

All map modules share the same pattern. Always `await Module.get(map)` before calling any method:

```ts
const module = await ModuleClass.get(map, optionalConfig);
module.setVisible(true);
module.getShown();                                    // current data on the map
module.events.on('click', (feature, lngLat) => { });
module.events.on('hover', (feature, lngLat) => { });
module.events.off('click', handler);
```

Multiple instances of the same module type can coexist on one map — each manages its own data independently.

---

## BaseMapModule — layer control and background click detection

```ts
const baseMap = await BaseMapModule.get(map, {
    layerGroupsFilter: {
        mode: 'include',    // 'include' | 'exclude'
        names: ['roadLines', 'buildings2D'],
    },
    visible: true,
});

// Detect clicks on non-feature areas (e.g. to deselect)
baseMap.events.on('click', (feature, lngLat) => { clearSelection(); });
```

Layer group names: `land`, `water`, `borders`, `buildings2D`, `buildings3D`, `houseNumbers`, `roadLines`, `roadLabels`, `roadShields`, `placeLabels`, `smallerTownLabels`, `cityLabels`, `capitalLabels`, `stateLabels`, `countryLabels`

---

## Events — precision and cursor

Configure at map level; override per module:

```ts
const map = new TomTomMap({
    mapLibre: { container: 'map' },
    events: {
        precisionMode: 'box',         // 'box' | 'point' | 'point-then-box'
        paddingBoxPx: 10,
        cursorOnHover: 'pointer',
    },
});

// Override for a specific module
const module = await PlacesModule.get(map, {
    events: { cursorOnHover: 'crosshair' },
});
```

Event types across all modules: `'click'`, `'hover'`, `'long-hover'`, `'contextmenu'`

---

## MapLibre direct access

Use `map.mapLibreMap` for anything not covered by SDK modules:

```ts
import maplibre from 'maplibre-gl';

// Controls
map.mapLibreMap.addControl(new maplibre.NavigationControl(), 'top-right');

// Custom GeoJSON layer
map.mapLibreMap.addSource('custom', { type: 'geojson', data: myGeoJSON });
map.mapLibreMap.addLayer({
    id: 'custom-layer', type: 'circle', source: 'custom',
    paint: { 'circle-radius': 8, 'circle-color': '#e74c3c' },
});

// Raw map events
map.mapLibreMap.on('moveend', () => { /* viewport changed */ });
map.mapLibreMap.on('click', (e) => { const { lng, lat } = e.lngLat; });
```

---

## Viewport utilities

Calculate the visible map area when UI panels are present:

```ts
const bbox = calculatePaddedBBox({
    map,
    surroundingElements: [document.getElementById('sidebar'), '#header'],
    paddingPX: 10,
});

map.mapLibreMap.fitBounds(bbox);

const center = calculatePaddedCenter({ map, surroundingElements: ['#panel'] });
```

Returns `[west, south, east, north]` or `null` if the visible area is too small.

---

## HillshadeModule

```ts
await HillshadeModule.get(map, { visible: true });
```
