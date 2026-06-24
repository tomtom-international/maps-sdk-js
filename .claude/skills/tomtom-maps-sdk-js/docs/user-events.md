# User Interaction Events Reference

## Imports

```ts
import { TomTomMap, BaseMapModule, PlacesModule } from '@tomtom-org/maps-sdk/map';
```

---

## Event types

All SDK modules expose `events.on(type, handler)` with four event types:

| Type | Fires when |
|------|-----------|
| `'click'` | User clicks (or taps) a feature |
| `'contextmenu'` | User right-clicks a feature |
| `'hover'` | Cursor enters a feature |
| `'long-hover'` | Cursor stays on a feature for the configured delay |

```ts
placesModule.events.on('click',      (feature, lngLat, allFeatures, source) => { });
placesModule.events.on('contextmenu',(feature, lngLat) => { });
placesModule.events.on('hover',      (feature, lngLat) => { });
placesModule.events.on('long-hover', (feature, lngLat) => { });
```

---

## Handler signature

```ts
(
  feature: T,                      // typed to the module's feature type
  lngLat: LngLat,                  // precise event coordinates
  allFeatures: Feature[],          // this module's features at the point, de-duplicated; [0] === feature
  source: SourceWithLayers,        // source/layer configuration
) => void
```

`lngLat`, `allFeatures`, and `source` are optional — omit trailing args you don't need.

`allFeatures` is scoped to the firing module and de-duplicated (a feature drawn across several
layers/tiles appears once). To inspect **every** feature at the point across all modules — base
map included, with `.source`/`.layer` intact — query MapLibre directly (project `lngLat` first):

```ts
const p = map.mapLibreMap.project(lngLat);
const all = map.mapLibreMap.queryRenderedFeatures([[p.x - 5, p.y + 5], [p.x + 5, p.y - 5]]);
```

---

## Unsubscribe

```ts
// on(type, handler) returns an unsubscribe that removes THAT handler:
const unsub = placesModule.events.on('click', handler);
unsub();

// off(type) removes ALL handlers registered for that type:
placesModule.events.off('click');
placesModule.events.off('hover');
```

`on()` returns a per-handler unsubscribe; `off(type)` clears every handler for that type. Registering
multiple handlers for the same type is supported — they all fire (calling `on()` again does **not**
replace the previous handler).

---

## Map-level event config (applies to all modules)

```ts
const map = new TomTomMap({
    mapLibre: { container: 'map' },
    events: {
        precisionMode: 'box',              // 'box' | 'point' | 'point-then-box'
        paddingBoxPx: 10,                  // hit-test tolerance in pixels
        cursorOnHover: 'pointer',          // CSS cursor when hovering any feature
        cursorOnMap: 'grab',               // default cursor
        cursorOnMouseDown: 'grabbing',     // cursor while dragging
        longHoverDelayAfterMapMoveMS: 800, // delay after panning
        longHoverDelayOnStillMapMS: 300,   // delay on a still map
    },
});
```

---

## Module-level override

```ts
const places = await PlacesModule.get(map, {
    events: { cursorOnHover: 'crosshair' },
});
```

---

## Background clicks — `BaseMapModule`

Use `BaseMapModule` to detect interactions outside SDK-managed features (e.g. to clear a selection):

```ts
const baseMap = await BaseMapModule.get(map, {
    events: { cursorOnHover: 'default' }, // suppress pointer cursor on background
});

baseMap.events.on('click', (feature, lngLat) => {
    clearSelection();
});
```

### Interactive vs. background split

```ts
const interactive = await BaseMapModule.get(map, {
    layerGroupsFilter: { mode: 'include', names: ['roadLines', 'buildings3D'] },
});
const background = await BaseMapModule.get(map, {
    layerGroupsFilter: { mode: 'exclude', names: ['roadLines', 'buildings3D'] },
    events: { cursorOnHover: 'default' },
});

interactive.events.on('click', (feature) => showFeatureDetails(feature));
background.events.on('click', () => clearAllSelections());
```

---

## Event priority (layer order)

The module whose layers render **on top** receives the event first. Events do not bubble to lower layers. Later-initialized modules are typically rendered on top.

---

## RoutingModule user events

RoutingModule exposes user events per source under `events.user`:

```ts
routing.events.user.mainLines.on('click', (route, lngLat) => { });
routing.events.user.waypoints.on('hover', (waypoint, lngLat) => { });
routing.events.user.ferries.on('click', (section, lngLat) => { });
routing.events.user.incidents.on('click', (section, lngLat) => { });
// Also: chargingStops, summaryBubbles, vehicleRestricted, tollRoads, tunnels, instructionLines
```

---

## Gotchas

- `events.off(type)` removes **all** handlers for that type; to remove a single handler, call the unsubscribe function returned by `on(type, handler)`. Registering multiple handlers for one type is supported — they all fire (calling `on()` again does **not** replace the previous one).
- `'hover'` fires each time the cursor moves to a different feature of the same module — not once per enter/leave cycle.
- `'long-hover'` will not fire if the map is moving; use `longHoverDelayAfterMapMoveMS` to tune the grace period.
