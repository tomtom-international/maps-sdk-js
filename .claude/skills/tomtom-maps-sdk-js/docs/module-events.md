# Module Lifecycle Events Reference

## Imports

```ts
import { PlacesModule, GeometriesModule, RoutingModule, TrafficFlowModule } from '@tomtom-org/maps-sdk/map';
```

---

## Two event types

| Event | Fires when | Available on |
|-------|-----------|-------------|
| `config-change` | Any config mutation (`applyConfig`, `setVisible`, any setter) | All modules |
| `shown-features` | After any of a module's `show*()` operations completes | PlacesModule, GeometriesModule, RoutingModule, CustomGeoJSONModule, TrafficIncidentOverlayModule, TrafficAreaAnalyticsModule |

Both live on the module, never on a named scope: a module has one configuration and one `show`
stream, and a scope narrows neither.

---

## `config-change`

```ts
// All modules (except RoutingModule — see below)
const unsub = trafficFlow.events.on('config-change', (config) => {
    toggleEl.checked = config?.visible ?? false;
});

unsub(); // unsubscribe when done
```

Common triggers: `setVisible`, `applyConfig`, `applyTheme`, `moveBeforeLayer`, `filterCategories`, `setMode`, `setMetric`, `setLayerGroupsVisibility`.

---

## `shown-features`

A module with more than one show operation reports them all on one stream; the payload says which
ran.

```ts
// PlacesModule — { places } from show(), { connections } from showConnections()
places.events.on('shown-features', (features) => {
    if ('places' in features) fitMapToResults(features.places);
});

// CustomGeoJSONModule — its show names a source, so the event does too
custom.events.on('shown-features', ({ sourceName, data }) => {
    updatePanel(sourceName, data);
});

// GeometriesModule — PolygonFeatures
geometries.events.on('shown-features', (features) => {
    const bbox = bboxFromGeoJSON(features);
    if (bbox) map.mapLibreMap.fitBounds(bbox, { padding: 40 });
});

// TrafficAreaAnalyticsModule — TrafficAreaAnalytics
trafficAreaAnalytics.events.on('shown-features', (data) => {
    updateAnalyticsPanel(data);
});
```

---

## Named scopes

A module that manages several surfaces also exposes one named scope per surface, covering that
surface's **user** events — `on` / `off` / `where`. Lifecycle events are not on a scope. Modules with
a single surface — BaseMap, POIs, Hillshade, both traffic tile modules, TrafficIncidentOverlay —
have no named scopes; `events` already is that scope.

```ts
// Module lifecycle events, module-wide
const unsubConfig = routing.events.on('config-change', (config) => { ... });

const unsubShown = routing.events.on('shown-features', (features) => {
    if ('routes' in features) {
        // { routes: Route | Routes }
    } else {
        // { waypoints: PlanningWaypoint[] | Waypoints }
    }
});

// User interaction events, on the same surface or narrowed to one scope
routing.events.on('click', (feature, lngLat) => { ... });
routing.events.mainLines.on('click', (route, lngLat) => { ... });
routing.events.waypoints.on('hover', (waypoint, lngLat) => { ... });
```

Scopes by module: RoutingModule has `mainLines`, `waypoints`, `chargingStops`, `summaryBubbles`,
`incidents`, `vehicleRestricted`, `ferries`, `tollRoads`, `tunnels`, `instructionLines`, plus one
`<type>Sections` scope per generated section type (`urbanSections`, `motorwaySections`, …).
PlacesModule has `places` and `connections`. GeometriesModule has `geometry` and `geometryLabel`.
CustomGeoJSONModule uses your own `sources` keys.

---

## Unsubscribe pattern

```ts
// on() always returns () => void
const unsub = module.events.on('config-change', handler);
unsub();  // removes this handler only

// Multiple independent handlers
const unsubA = places.events.on('config-change', handlerA);
const unsubB = places.events.on('config-change', handlerB);
unsubA(); // only removes handlerA
```

---

## Modules that do NOT emit `shown-features`

`TrafficFlowModule`, `TrafficIncidentsModule`, `HillshadeModule`, `BaseMapModule`, `POIsModule` — these control existing map data and have no `show()` method, so `events.on('shown-features', …)` does not compile on them.

---

## Gotchas

- `config-change` is **not** fired during `Module.create()` / `Module.get()` initialization — only on subsequent config mutations.
- Every module uses the same `events.on(...)` for both user and lifecycle events. A named scope carries user events only, so `routing.events.tunnels.on('click', …)` works but `routing.events.tunnels.on('config-change', …)` does not — config belongs to the module.
- `shown-features` fires synchronously inside `show()` after the source data is updated — you can safely read `module.getShown()` inside the handler.
