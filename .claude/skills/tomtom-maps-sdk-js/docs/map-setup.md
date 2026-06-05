# Map Setup Reference

## Imports

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, BaseMapModule, HillshadeModule, PlacesModule } from '@tomtom-org/maps-sdk/map';
import { calculatePaddedBBox, calculatePaddedCenter, calculateFittingBBox } from '@tomtom-org/maps-sdk/map';
import { type StandardStyleID, standardStyleIDs } from '@tomtom-org/maps-sdk/map';
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

## Vite projects — required build target

MapLibre GL v5 uses native class fields. Vite's default esbuild target downcompiles these into a `__publicField()` helper that isn't available inside MapLibre's web workers. The result: routes, layers, and sources silently fail to render with no error in the console.

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
    build: { target: 'esnext' },
    optimizeDeps: { esbuildOptions: { target: 'esnext' } },
});
```

This only applies when MapLibre is bundled by Vite (not loaded from a CDN). The SDK's own examples avoid this by loading MapLibre via CDN import maps.

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

### Init from a bounding box instead of center/zoom

```ts
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';

const map = new TomTomMap({
    mapLibre: {
        container: 'map',
        bounds: bboxFromGeoJSON(places),          // [west, south, east, north]
        fitBoundsOptions: { padding: 100 },
    },
});
```

### Style switcher with `standardStyleIDs`

```ts
// standardStyleIDs is a readonly array of all valid style IDs
const select = document.querySelector('#style-select') as HTMLSelectElement;
standardStyleIDs.forEach(id => select.add(new Option(id)));
select.addEventListener('change', (e) =>
    map.setStyle((e.target as HTMLSelectElement).value as StandardStyleID)
);
```

### Non-interactive map (e.g. thumbnail / embed)

```ts
const map = new TomTomMap({
    mapLibre: {
        container: 'map',
        bounds: geometry.bbox,
        interactive: false,       // disables pan/zoom/click
    },
});
```

### Partial style loading (load only base tiles, add overlays lazily)

```ts
const map = new TomTomMap({
    mapLibre: { container: 'map', zoom: 13, center: [2.14, 41.4] },
    style: { type: 'standard', include: [] },  // no overlays initially
});

// Load modules on demand
const trafficFlow = await TrafficFlowModule.get(map, { visible: true });
```

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

Use these when surrounding UI panels (sidebars, search boxes, info panels) occupy part of the viewport — they account for the obscured area so the map content stays centred in the visible region.

All three accept `surroundingElements` as an array of CSS selectors or `HTMLElement` references, plus an optional `paddingPX` (extra padding inside the visible area).

### `calculatePaddedBBox` — visible bbox, excluding panels

Returns the bounding box of the unobstructed map area. Use it as a search boundary so results only come from the area the user can actually see:

```ts
const visibleBBox = calculatePaddedBBox({
    map,
    surroundingElements: ['#sidebar', '#search-bar'],
    paddingPX: 10,
});

if (visibleBBox) {
    const places = await search({ query: 'coffee', boundingBox: visibleBBox });
}
```

### `calculateFittingBBox` — fit content into the visible area

Returns a bbox padded so that when you `fitBounds()` with it, the content lands inside the visible area (i.e. not hidden under panels). Use this to focus the map on a set of results or a route while keeping them fully visible:

```ts
const contentBBox = bboxFromGeoJSON(places); // the bbox of your data

const fittingBBox = calculateFittingBBox({
    map,
    bbox: contentBBox,
    surroundingElements: ['#sidebar'],
    paddingPX: 40,
});

if (fittingBBox) {
    map.mapLibreMap.fitBounds(fittingBBox);
}
```

### `calculatePaddedCenter` — visual centre of the unobstructed area

Returns the geographic centre of the visible (unobstructed) viewport. Use it to place a pin or fly-to point that appears centred to the user:

```ts
const visibleCenter = calculatePaddedCenter({
    map,
    surroundingElements: ['#bottom-sheet'],
});

if (visibleCenter) {
    map.mapLibreMap.flyTo({ center: visibleCenter, zoom: 14 });
}
```

All three return `null` if the visible area is too small to be usable.

---

## HillshadeModule

```ts
await HillshadeModule.get(map, { visible: true });
```
