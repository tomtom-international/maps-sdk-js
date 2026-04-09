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
  allFeatures: MapGeoJSONFeature[], // every feature at the event point
  source: SourceWithLayers,        // source/layer configuration
) => void
```

`lngLat`, `allFeatures`, and `source` are optional — omit trailing args you don't need.

---

## Unsubscribe — `events.off()`

```ts
// Remove all handlers for a type
placesModule.events.off('click');
placesModule.events.off('hover');
```

Unlike module lifecycle events, user events do not return an individual unsubscribe function — `off(type)` removes all handlers registered for that type.

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

- `events.off(type)` removes **all** handlers for that type — there is no per-handler removal for user events. For individual removal, use module lifecycle events (`config-change`, `shown-features`) which do return unsubscribe functions.
- `'hover'` fires each time the cursor moves to a different feature of the same module — not once per enter/leave cycle.
- `'long-hover'` will not fire if the map is moving; use `longHoverDelayAfterMapMoveMS` to tune the grace period.
