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
const places = await PlacesModule.create(map, {
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

One base map module per map, two scopes over it:

```ts
const baseMap = await BaseMapModule.get(map);
const names = ['roads', 'buildings3D'];

baseMap.events
    .where({ layerGroups: { mode: 'include', names } })
    .on('click', (feature) => showFeatureDetails(feature));

baseMap.events
    .where({ layerGroups: { mode: 'exclude', names } }, { cursorOnHover: 'default' })
    .on('click', () => clearAllSelections());
```

---

## Event priority (layer order)

The module whose layers render **on top** receives the event first. Events do not bubble to lower layers. Later-initialized modules are typically rendered on top.

---

## Scoping events

`events.where(scope, config?)` narrows to part of what a module covers and returns an events object
for just that part. Each scope takes its own event config, which is how two parts of one module get
different hover cursors.

Every module accepts a **feature predicate**. BaseMapModule additionally accepts
`{ layerGroups }`, because the base-map style is the one place with a stable, typed vocabulary for
its layers — do not expect layer scoping elsewhere.

```ts
// Feature scope, on any module
trafficIncidents.events.where((incident) => incident.properties.magnitude === 'major')
    .on('click', showIncidentDetails);

// Layer-group scope with its own cursor — BaseMapModule only
baseMap.events
    .where({ layerGroups: { mode: 'include', names: ['roadLabels'] } }, { cursorOnHover: 'pointer' })
    .on('click', showRoadName);

// A named scope narrows the same way
routing.events.tunnels.where((section) => section.properties.lengthInMeters > 500)
    .on('click', showLongTunnel);

// Both axes at once — one `where`, not two chained
baseMap.events
    .where({
        layerGroups: { mode: 'include', names: ['roadLabels'] },
        features: (feature) => feature.properties.name?.startsWith('A'),
    })
    .on('click', showRoadName);
```

A predicate filters the whole stack of features under the pointer and promotes the first survivor,
so a click whose top hit is out of scope still reaches a handler when a feature below it matches.

## RoutingModule user events

RoutingModule exposes one named scope per part of a route it draws:

```ts
routing.events.mainLines.on('click', (route, lngLat) => { });
routing.events.waypoints.on('hover', (waypoint, lngLat) => { });
routing.events.ferries.on('click', (section, lngLat) => { });
routing.events.incidents.on('click', (section, lngLat) => { });
// Also: chargingStops, summaryBubbles, countryCrossings, vehicleRestricted, tollRoads, tunnels,
// instructionLines, and one <type>Sections scope per generated section type (urbanSections, …)
// routing.events.on('click', ...) covers all of them at once.
```

---

## Gotchas

- `events.off(type)` removes **all** handlers for that type; to remove a single handler, call the unsubscribe function returned by `on(type, handler)`. Registering multiple handlers for one type is supported — they all fire (calling `on()` again does **not** replace the previous one).
- `'hover'` fires each time the cursor moves to a different feature of the same module — not once per enter/leave cycle.
- `'long-hover'` will not fire if the map is moving; use `longHoverDelayAfterMapMoveMS` to tune the grace period.
