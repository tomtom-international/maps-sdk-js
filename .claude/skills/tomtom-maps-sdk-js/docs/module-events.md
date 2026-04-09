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
| `shown-features` | After `show()` / `showRoutes()` / `showWaypoints()` completes | PlacesModule, GeometriesModule, RoutingModule, TrafficAreaAnalyticsModule |

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

```ts
// PlacesModule — Place | Place[] | Places
places.events.on('shown-features', (features) => {
    fitMapToResults(features);
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

## RoutingModule — separate `events.module` namespace

RoutingModule keeps user events and module events in separate namespaces:

```ts
// Module lifecycle events
const unsubConfig = routing.events.module.on('config-change', (config) => { ... });

const unsubShown = routing.events.module.on('shown-features', (features) => {
    if ('routes' in features) {
        // { routes: Route | Routes }
    } else {
        // { waypoints: PlanningWaypoint[] | Waypoints }
    }
});

// User interaction events (different namespace)
routing.events.user.mainLines.on('click', (route, lngLat) => { ... });
routing.events.user.waypoints.on('hover', (waypoint, lngLat) => { ... });
```

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

`TrafficFlowModule`, `TrafficIncidentsModule`, `HillshadeModule`, `BaseMapModule`, `POIsModule` — these control existing map data and have no `show()` method.

---

## Gotchas

- `config-change` is **not** fired during `Module.get()` initialization — only on subsequent config mutations.
- RoutingModule uses `events.module.on(...)` for lifecycle events, not the bare `events.on(...)` used by all other modules.
- `shown-features` fires synchronously inside `show()` after the source data is updated — you can safely read `module.getShown()` inside the handler.
