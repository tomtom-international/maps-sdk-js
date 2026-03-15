# Map Setup Reference

## Imports

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, BaseMapModule, HillshadeModule, PlacesModule } from '@tomtom-org/maps-sdk/map';
import { calculatePaddedBBox, calculatePaddedCenter } from '@tomtom-org/maps-sdk/map';
```

---

## Full-screen map HTML + CSS boilerplate

The map container **and its parent elements** (`html`, `body`) all need explicit height — without this the map renders with zero height, which is the most common setup issue:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
    <style>
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        #map { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script type="module" src="./index.ts"></script>
</body>
</html>
```

---

## Map initialization

```ts
import './style.css';

const map = new TomTomMap({
    style: 'standardLight',   // see styles below
    language: 'en-GB',        // affects map labels
    mapLibre: {
        container: 'map',     // HTML element id — must have CSS height set
        center: [4.9, 52.4],  // [longitude, latitude]
        zoom: 12,
    },
});

map.setStyle('monoDark');    // switch style dynamically — preserves all module state
map.setLanguage('fr-FR');    // change map label language dynamically
map.getBBox();               // → [west, south, east, north]
```

**Styles:** `standardLight` (default), `standardDark`, `drivingLight`, `drivingDark`, `monoLight`, `monoDark`, `satellite`

When offering style switching, prefer a `<select>` dropdown with all 7 styles over a simple toggle — it showcases the full range and gives users real control. For event handlers like background clicks, provide visible feedback (e.g. a toast notification with coordinates) rather than just `console.log`.

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
