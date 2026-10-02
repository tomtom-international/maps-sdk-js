# Map Setup Reference

## Imports

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, BaseMapModule, TerrainModule, PlacesModule } from '@tomtom-org/maps-sdk/map';
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

## Vite projects — exclude MapLibre from pre-bundling

MapLibre GL v6 ships its web worker as a separate module (`dist/maplibre-gl-worker.mjs`) that the entry locates at runtime through `import.meta.url`. Vite's dependency pre-bundler doesn't emit that sibling into `.vite/deps`, so the worker fails to load and the map never finishes initializing — a blank map with no error in the console:

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: { exclude: ['maplibre-gl'] },
});
```

Excluding it lets MapLibre load from its own package directory, where the worker resolves.

The same constraint applies when serving MapLibre from a CDN: point at the published `dist/maplibre-gl.mjs` (e.g. jsDelivr, which mirrors the tarball as-is), **not** a re-bundling CDN such as esm.sh — it serves the entry from a rewritten path where the worker sibling doesn't exist, so the worker 404s and the map paints a blank background.

---

## Map initialization

```ts
import './style.css';

const map = new TomTomMap({
    style: 'standardLight',   // see styles below
    language: 'en-GB',        // affects map labels
    geopoliticalView: 'IN',   // geopolitical view of disputed borders and names; defaults to the global one
    mapLibre: {
        container: 'map',     // HTML element id — must have CSS height set
        center: [4.9, 52.4],  // [longitude, latitude]
        zoom: 12,
    },
});

map.setStyle('monoDark');    // switch style dynamically — preserves all module state
map.setLanguage('fr-FR');    // change map label language dynamically
map.setGeopoliticalView('PK'); // redraw disputed borders and names; services keep the global view (see services-config.md)
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

All map modules are async, and the factory name tells you who owns the layers being controlled:

- **Data-owned** (`PlacesModule`, `RoutingModule`, `GeometriesModule`, `CustomGeoJSONModule`, `TrafficIncidentOverlayModule`, `TrafficAreaAnalyticsModule`) — `await Module.create(map, optionalConfig)`. Each call returns a **new independent instance** owning its own sources, layers and images, so several can coexist on one map, each managing its own data.
- **Style-owned** (`BaseMapModule`, `POIsModule`, `TrafficFlowModule`, `TrafficIncidentsModule`, `TerrainModule`) — `await Module.get(map, optionalConfig)`. These control layers the style already provides under fixed global IDs, so every instance is a handle on the **same shared state**.

```ts
const placesModule = await PlacesModule.create(map, optionalConfig);   // data-owned
const poisModule = await POIsModule.get(map, optionalConfig);          // style-owned

placesModule.setVisible(true);
placesModule.getShown();                              // current data on the map
placesModule.events.on('click', (feature, lngLat) => { });
placesModule.events.on('hover', (feature, lngLat) => { });
placesModule.events.off('click', handler);
```

### Who owns what — where each change lives

| You want to change… | Where | How |
|---|---|---|
| **Whether** a style part is shown: a base-map layer group, traffic flow or incidents, a POI category, the hillshade, the 3D surface | Its style-owned module | `BaseMapModule.setVisible(…, { layerGroups })`, `TrafficFlowModule`/`TrafficIncidentsModule` `setVisible` and `filter`, `POIsModule.filterCategories`, `TerrainModule.setHillshadeVisible` / `setElevationEnabled` |
| **How** the style draws it: sizes, road widths, the map colours, traffic colours, POI size and zoom, hillshade lighting, globe, sky | `StylingModule` knobs (see `map-styling.md`) | `styling.set('traffic.flow.slowColor', …)`, `setMapColors`, `applyPreset` |
| Anything a data-owned module draws itself: routes, places, geometries, your GeoJSON, the incident overlay, area analytics | That module's own config | `create(map, config)`, `applyConfig` / `updateConfig`, its part-setters |
| The map's colour identity: the accent routes, places and geometries default to | `StylingModule` publishes it; each data-owned module reads it | `setMapColors`, `styling.set('colors.accent', …)`; a colour set on the module wins |

- **Never look for colours or sizes on a style-owned module**, and never style a data-owned module's layers through knobs: knobs don't reach them.
- **Three meeting points:**
  - The `basemap.<group>` / `buildings.*` / `roads.shields` knobs write through `BaseMapModule`, so `styling.get` and `baseMap.isVisible` read one state. The later call wins, across `setStyle` too: `baseMap.setVisible` over a group removes its knob from `styling.getConfig()`.
  - `pois.microMarkers` and `roads.arrows` / `roads.restricted` / `roads.underConstruction` / `roads.exitNumbers` only hide inside what `POIsModule` / `BaseMapModule` shows: `true` never shows a layer its module hid, and the module showing again keeps a knob's `false`.
  - `pois.zoomShift` composes with `POIsModule.filterCategories`.

### Appearance vocabulary — one name per concept

A concept has the same name on every module that has it; a module missing from a row lacks it.

| Concept | Name and rule | Where |
|---|---|---|
| Module colour | top-level `color`; unset → the map's accent (`colors.accent`, `map.mapColors.accent`) → module default; part colours override it | Routing `color` (under `layers.*`) · Geometries `color` (under `fill.palette`, `fill.color`, `line.color`, feature `color`) · Places `color` (under `icon.default.style.fillColor`, `label.color`, `layers.*`) |
| Labels | `LabelConfig`: `size`, `color`, `haloColor`, `haloWidth`, `opacity`, `font`, plus the module's own content and `offset` | Places `label` (`PlaceLabelConfig`: `title`, `offset` in ems), `applyLabelConfig` · Geometries `label` (`GeometryLabelConfig`: optional `text`, string or expression, default the feature's `title`), `applyLabelConfig`, and `lineLabel` (`GeometryLineLabelConfig`: the same `text`, `minZoom`, `symbolSpacing`, `offset` `[x, y]` ems) · Routing `chargingStops.label` (`ChargingStopLabelConfig`: `visible`, `title` expression; no `LabelConfig` styling) |
| Multipliers | `*Factor`, clamped to a published range; a `'s'`/`'m'`/`'l'` preset picks the base | Routing `widthFactor`, `waypointSizeFactor` (both 0.5–2), `sections.<type>.widthFactor`, `sections.<type>.icon.sizeFactor` (0.25–2) · overlay `focus.widthFactor` (1–1.8) · knobs `labels.sizeFactor`, `symbols.sizeFactor`, `pois.sizeFactor`, `roads.widthFactor`, `traffic.flow.widthFactor`, `traffic.incidents.widthFactor` |
| Absolute units | MapLibre's name, in pixels; other units in the name; opacity 0–1; label offsets in ems | pixels: `LabelConfig.size`/`haloWidth`, Geometries `line.width`, `lineLabel.symbolSpacing` · metres: Area Analytics `maxHeightMeters`/`minHeightMeters` · `TerrainModule.elevationExaggeration` (surface height) ≠ knob `hillshade.exaggeration` (shading) |
| Marker type / fill style / theme | *theme* = the map-wide look only | Places `markerType` (`placesMarkerTypes`), `applyMarkerType` · Geometries `fillStyle` (`geometryFillStyles`), per feature `properties.fillStyle` · map theme: `setMapColors` + map-theme plugin `deriveMapColors*` |
| Fill colour vs palette | a colour field never takes a palette name | Geometries `fill.color` (colour or expression), `fill.palette` (`colorPaletteIDs`) |
| Zoom thresholds | `minZoom` / `maxZoom` | Places `entryPoints.minZoom` · Geometries `lineLabel.minZoom` · Routing `sections.<type>.sign.minZoom`, `countryCrossings.minZoom` · knobs `pois.minZoom`, `hillshade.maxZoom` |
| Borrowed looks | follow the knobs restyling what they borrow; a module setting wins | Places `base-map`/`circle-icon`/`pin-clustered`, Routing `sections.traffic`, the incident overlay — knob list in `map-styling.md` |
| Visibility | `visible` + `setVisible` + `isVisible`; `isVisible` is the setting, as the `visible` knob reads; data-owned: hiding keeps data, `show`/`clear` leave it hidden, `getShown` is what's shown; style-owned unset: `isVisible` reads what the style draws, traffic `false` | all three on Places, Routing, Geometries, CustomGeoJSON, incident overlay, Area Analytics, POIs, traffic flow, traffic incidents (+ `icons.visible`) · BaseMap `visible`, `groups.<group>.visible`, `{ layerGroups }` · Routing per part too (`chargingStops`, `summaryBubbles`, `countryCrossings`, `sections.<type>` `.visible`) · Terrain `setHillshadeVisible`, `setElevationEnabled` |
| Layer position | `beforeLayerConfig`: `'top'` or a named style layer, or a `{ all, <part> }` record (`PartsBeforeLayerConfig`) | Geometries `fill`/`line` · Routing `mainLines`/`instructionLines`/`icons` · Area Analytics one part per display mode · overlay flat only · CustomGeoJSON per-layer `beforeID` |

### Every setting as data — `KnobEntry` and `KnobKind`

Each module's knob catalogue (`baseMapKnobCatalogue`, `poisKnobCatalogue`, `routingKnobCatalogue`,
the traffic ones, `stylingKnobCatalogue`; the map-effects plugin's `effectKnobCatalogue`) is a list
of `KnobEntry`s: `{ id, kind, description, default?, range?, options? }`, static, no map needed. `id`
is the setting's path in the config; a number indexes a list (`filters.any.0.…`). The union over
`kind` makes a kind's fields required:

| `kind` (`KnobKind`) | Value (`KnobValueOf<kind>`) | Fields |
|---|---|---|
| `toggle` | `boolean` | — |
| `factor` | number, `1` = the style's own | `range` |
| `number` | number | `range` |
| `offset` | `[x, y]`, x right, y down; unit in `description` | `range`, per component |
| `color` | CSS colour | — |
| `enum` | one of `options` | `options` |
| `enums` | list of `options`; `description` says when order matters | `options` |
| `colors` | list of CSS colours or `options` names | `options`, optional |
| `image` | sprite image id | — |
| `text` | any string | — |

- `range` is the span a control offers (`step` for a slider). Its required `bounds` says which ends
  hold: `hard` both (opacities, `*Factor`s), `hard-min` only `min` (heights in metres: none below
  0, any above `max`), `soft` neither (offsets).
- `default` only where one value holds everywhere; otherwise `description` says what decides.
- Expressions, callbacks and structured objects stay out; a setting that also takes an expression is
  in with its plain values. Every module's `…KnobValueOf<ID>` is that plain value, never the
  expression or object the config also takes at the path.
- A UI switching on `kind` must handle every member: a new kind is a breaking change.

`setKnob(module, catalogue, id, value)` validates, then applies the config with the value at the
id's path, the rest kept; the value is typed from the path. `validateKnobValue(entry, value)` is the
check alone, for untrusted input (forms, LLM tool calls). Both throw `RangeError` and change
nothing. `StylingModule` uses its own `set`, same check.

```ts
import { setKnob, trafficFlowKnobCatalogue, validateKnobValue } from '@tomtom-org/maps-sdk/map';

setKnob(trafficFlow, trafficFlowKnobCatalogue, 'filters.any.0.roadCategories.values', ['motorway', 'trunk']);

const knob = trafficFlowKnobCatalogue.find(({ id }) => id === 'filters.any.0.roadCategories.values')!;
validateKnobValue(knob, ['motorway', 'cart track']); // RangeError: … 'cart track' is not
```

---

## BaseMapModule — layer control and background click detection

One shared module per map — a second `get(map)` returns the same instance. Name the layer groups
per call instead:

```ts
// `visible` first, then each `groups` entry in order; an entry without `visible` keeps the style's own
const baseMap = await BaseMapModule.get(map, { groups: { buildings3D: { visible: true } } });

baseMap.setVisible(false, {
    layerGroups: {
        mode: 'include',    // 'include' | 'exclude' (exclude leaves the named groups as they were)
        names: ['roads', 'buildings2D'],
    },
});
baseMap.getConfig(); // { groups: { buildings3D: { visible: true }, roads: { visible: false }, buildings2D: { visible: false } } }
baseMap.isVisible({ layerGroups: { mode: 'include', names: ['buildings3D'] } });
baseMap.getLayerIds('roadLabels');

// Detect clicks on non-feature areas (e.g. to deselect)
baseMap.events.on('click', (feature, lngLat) => { clearSelection(); });
```

- Every `setVisible` call is kept in `getConfig().groups` and restored by `setStyle`; a call without groups replaces the record with `{ visible }`.
- `isVisible` reads those settings, not the layers: `visible`, then `groups` and the styling toggles, the later winning; a layer none of them reaches reports what the style draws.
- `applyConfig` **replaces**: what the new config leaves out goes back to the style. Merge with `updateConfig`.
- Showing a group shows every layer in it, including ones the style ships hidden (detailed road markings).

Layer group names: `land`, `water`, `borders`, `buildings2D`, `buildings3D`, `houseNumbers`, `roads`, `railways`, `ferries`, `natureLabels`, `roadLabels`, `roadShields`, `allPlaceLabels`, `smallerTownLabels`, `cityLabels`, `capitalLabels`, `stateLabels`, `countryLabels`

### Every knob as data — `baseMapKnobCatalogue`

Every `BaseMapModuleConfig` setting, static and readable with no map: all `toggle`s, with no
`default`, since unset leaves a layer as the style ships it. The id is the setting's path in the
config; `baseMapKnobIds` lists them in catalogue order.

```ts
import { baseMapKnobCatalogue, type BaseMapKnobId } from '@tomtom-org/maps-sdk/map';

const groupToggles = baseMapKnobCatalogue.filter(({ id }) => id.startsWith('groups.'));
// [{ id: 'groups.land.visible', kind: 'toggle', description: 'The `land` layer group: …' }, …]
const id: BaseMapKnobId = 'groups.buildings3D.visible';
```

- Ids: `visible`, then per group in `baseMapLayerGroupNames` order: `groups.land.visible`,
  `groups.water.visible`, `groups.buildings2D.visible`, `groups.roads.visible`,
  `groups.railways.visible`, `groups.ferries.visible`, `groups.borders.visible`,
  `groups.buildings3D.visible`, `groups.natureLabels.visible`, `groups.roadLabels.visible`,
  `groups.roadShields.visible`, `groups.houseNumbers.visible`, `groups.smallerTownLabels.visible`,
  `groups.stateLabels.visible`, `groups.cityLabels.visible`, `groups.allPlaceLabels.visible`,
  `groups.capitalLabels.visible`, `groups.countryLabels.visible`.
- The `StylingModule` toggle on the same group is `basemap.<group>`, except `buildings2D`
  (`buildings.footprints`), `buildings3D` (`buildings.3d`) and `roadShields` (`roads.shields`).
  Both write one state, and a `basemap.<group>` entry's description is this catalogue's for the
  group; see *Three meeting points* above for which call wins.
- Entries are `KnobEntry`s, the shape `stylingKnobCatalogue` and `routingKnobCatalogue` share.

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
const module = await PlacesModule.create(map, {
    events: { cursorOnHover: 'crosshair' },
});
```

Event types across all modules: `'click'`, `'hover'`, `'long-hover'`, `'contextmenu'`

---

## MapLibre direct access

Use `map.mapLibreMap` for anything not covered by SDK modules:

```ts
import { NavigationControl } from 'maplibre-gl';

// Controls
map.mapLibreMap.addControl(new NavigationControl(), 'top-right');

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
    const places = await discoverPlaces({ query: 'coffee', boundingBox: visibleBBox });
}
```

### `calculateFittingBBox` — fit content into the visible area

Returns a bbox padded so that when you `fitBounds()` with it, the content lands inside the visible area (i.e. not hidden under panels). Use this to focus the map on a set of results or a route while keeping them fully visible:

```ts
const contentBBox = bboxFromGeoJSON(places); // the bbox of your data

const fittingBBox = calculateFittingBBox({
    map,
    toBeContainedBBox: contentBBox,
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

## TerrainModule

Hillshade shading and 3D elevation, both drawn from the elevation data of the `hillshade` style part. `get()` adds that part when the style lacks it. The style parts the SDK adds — traffic flow, traffic incidents and the hillshade — are hidden until you show them, so without a config the hillshade is hidden and the surface stays as the style draws it (flat on TomTom styles; a custom style's own `terrain` is kept until `elevation` is set). Both are re-applied after `setStyle`.

```ts
const terrain = await TerrainModule.get(map, { hillshade: true, elevation: true, elevationExaggeration: 1.5 });

terrain.setHillshadeVisible(false);
terrain.setElevationEnabled(false);   // flat again; the exaggeration is kept for next time
terrain.setElevationExaggeration(2);  // 1 = true elevation
terrain.isHillshadeVisible();        // the `hillshade` setting; false unset
terrain.isElevationEnabled();        // the `elevation` setting; unset: whether the map's own terrain is raised
terrain.events.on('config-change', (config) => { });   // lifecycle events only: the raster relief has no features
```

- 3D elevation needs a pitched camera: `mapLibre: { pitch: 70, maxPitch: 85 }` (MapLibre's default `maxPitch` is 60).
- The surface reads `TERRAIN_SOURCE_ID`, a copy of `HILLSHADE_SOURCE_ID` the module adds when elevation is first enabled (MapLibre degrades both when they share one source). Don't `setTerrain` on `HILLSHADE_SOURCE_ID` yourself.
- The shading's look (method, light, strength, max zoom, colours) is the `hillshade.*` styling knobs, and the sky above a tilted horizon is `view.sky` (`map-styling.md`). `hillshade.exaggeration` is shading strength (0–1) and raises nothing; `elevationExaggeration` / `setElevationExaggeration` is the vertical scale of the 3D surface (`1` = true elevation). "Exaggerate the terrain" in 3D means the latter.
- Basemap 3D buildings (`buildings3D` layer group) and the Landmarks 3D plugin stand on the raised surface.

### Every knob as data — `terrainKnobCatalogue`

Every `TerrainModuleConfig` setting as a `TerrainKnob` (the shared `KnobEntry` shape), static and
readable with no map: `id`, `kind`, `description`, a `range` for the number and, where one value
holds everywhere, a `default`. The id is the setting's path in the config; `terrainKnobIds` lists
them, `TerrainKnobId` is their union and `TerrainKnobValueOf<ID>` the plain value one takes.

```ts
import { setKnob, terrainKnobCatalogue } from '@tomtom-org/maps-sdk/map';

const exaggeration = terrainKnobCatalogue.find(({ id }) => id === 'elevationExaggeration');
// { id: 'elevationExaggeration', kind: 'number', range: { min: 0.5, max: 3, step: 0.1, bounds: 'hard-min' }, default: 1, description: '…' }
setKnob(terrain, terrainKnobCatalogue, 'elevationExaggeration', 2); // RangeError below 0.5
```

| Id | Kind | Default |
|---|---|---|
| `hillshade` | toggle | `false` |
| `elevation` | toggle | — the map's own terrain; flat on TomTom styles |
| `elevationExaggeration` | number, `hard-min` 0.5 (slider to 3) | `1`, true elevation |

- Not knobs: `events`. How the hillshade looks is the `hillshade.*` styling knobs (`stylingKnobCatalogue`).
- Entry shape and kinds: § Every setting as data — `KnobEntry` and `KnobKind`, above.
