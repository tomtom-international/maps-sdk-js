# @tomtom-org/maps-sdk-plugin-route-dragging

## 0.0.2

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README links the repository's security policy page, which sends a vulnerability report to TomTom's HackerOne program

## 0.0.1

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - Installs beside `@tomtom-org/maps-sdk` 1.0.0 and every later 1.x release: the peer range on the SDK runs up to `<2.0.0` instead of stopping below 1.0.0

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - New plugin: edit a route on a `RoutingModule` by dragging with `RouteDragging`, and watch the route re-plan as you drag
  
  - Move a stop by its pin, or pull a new stop off a route line, between the two stops its detour fits best
  - The route re-plans every `planIntervalMS` during the drag and once more on the drop, through your own `plan` if you pass one, and `onRoutes` gets the answers in order
  - With `showOnMap: false`, it shows nothing itself and reports each change to `onWaypointsChange`, for an app that keeps its stops in its own state
