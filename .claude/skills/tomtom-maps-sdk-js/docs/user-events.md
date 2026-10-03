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
        hoverGracePeriodMS: 400,           // how long a left feature stays 'recently-hovered'
    },
});
```

A GeoJSON-backed feature the pointer leaves is `eventState: 'recently-hovered'` for that period
(a new hover or click replaces it sooner). SDK layers draw it as no state; your own
`['has', 'eventState']` matches it — add `['!=', ['get', 'eventState'], 'recently-hovered']`, or set
`hoverGracePeriodMS: 0`.

Change it on a running map with `updateEventsConfig`, which merges into the current config and
leaves module-level `events` overrides in place; a long hover or grace period already running keeps
its delay:

```ts
map.updateEventsConfig({ longHoverDelayOnStillMapMS: 600, hoverGracePeriodMS: 1000 });
```

---

## Module-level override

```ts
const places = await PlacesModule.create(map, {
    events: { cursorOnHover: 'crosshair', hoverGracePeriodMS: 0 },
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

## Event states — select, highlight and read back features

A click, contextmenu, hover, long-hover or recently-hovered on a feature a handler covers writes
`properties.eventState` on it. Every data-owned module — PlacesModule, RoutingModule,
GeometriesModule, CustomGeoJSONModule, TrafficIncidentDetailsModule, TrafficAreaAnalyticsModule —
has the same four methods to put, clean and read them yourself (e.g. sync a list with the map):

```ts
routing.putEventState({ id: routeID, state: 'click' }); // mode 'put' (default) moves it off any other route
routing.putEventState({ index: 0, state: 'hover', mode: 'add' }); // 'add' keeps the others' states
routing.cleanEventState({ id: routeID });
routing.cleanEventStates({ states: ['hover'] }); // or () for every state
const { click: [selectedID] = [], hover = [] } = routing.getEventStates(); // ids by state, user's and yours
```

- The module methods act on exactly what `getShown()` returns as its main features — Places
  `places` (clustered or not), Routing `mainLines`, Geometries `geometry`, Custom every source,
  TrafficIncidentDetails `incidents`, TrafficAreaAnalytics `hexgrid` + `square` + `heatmap`. So an id
  from `getShown()` or a handler is an id they take.
- `id` matches `properties.id`, else the top-level `id` (string or number). `index` is the position
  in that collection; with several sources, each counts its own.
- A user click/contextmenu clears `click` + `contextmenu` from the other features of the source it
  lands on, a user hover clears `hover` + `hover-move` + `long-hover`, yours included: a selection
  put in code moves on the next click. To let clicks add up, re-put the earlier ids with `mode: 'add'`
  in the click handler.
- Named scopes have the same four methods for their own features (`UserEventsWithStates`):
  `routing.events.waypoints.putEventState(...)`, `places.events.entryPoints`, `custom.events.<source>` —
  use the scope when ids repeat across sources. `scope.where(...)` returns plain events, without them.
- Default look of a hovered or clicked feature (one look for both): place pins larger with the
  label in `color`, plus entry points; routes a wider outline (selected or not); geometries a
  denser fill and wider border in their own colour; details-module incidents the `focus` treatment;
  area-analytics cells outlined. Custom layers draw only what you style by `['get', 'eventState']`.
- Tuning it: Routing `highlight.outlineWidthFactor` (default 1.2, clamped 1–1.25), Geometries
  `highlight.fillOpacityFactor` (2, 1–4) and `highlight.lineWidthFactor` (1.75, 1–3) — knobs in
  their catalogues, multiplying the opacity and width in force, configured ones included; `1` turns
  that look off. Details module: its `focus` config, `focus: false` off.
- A MapLibre layer configured in place of the default is drawn as given: Places `layers.selected`,
  Routing `layers.mainLines.routeOutline` `line-width`, Geometries `line.layer` `line-width`.
- States survive `setVisible`, style and config changes; a new `show()`, `clear()` or `setStyle(…, { resetState: true })`
  drops them — read the selection first and put it back after re-showing.

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
