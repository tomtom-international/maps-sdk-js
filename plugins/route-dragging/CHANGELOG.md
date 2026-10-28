# @tomtom-org/maps-sdk-plugin-route-dragging

## 0.0.3

### Patch Changes

- The package ships its `CHANGELOG.md`, as the SDK does, so you can read what changed between two releases from `node_modules`

- A pin drags from where it is drawn, and a drop after a failed plan plans again
  
  - A clear drops the route plans still in flight, and nothing plans after `remove()`
  - A line drag that can't extend the route keeps it as it was

## 0.0.2

### Patch Changes

- The README links the repository's security policy page, which sends a vulnerability report to TomTom's HackerOne program

## 0.0.1

### Patch Changes

- Installs beside `@tomtom-org/maps-sdk` 1.0.0 and every later 1.x release: the peer range on the SDK runs up to `<2.0.0` instead of stopping below 1.0.0

- New plugin: edit a route on a `RoutingModule` by dragging with `RouteDragging`, and watch the route re-plan as you drag
  
  - Move a stop by its pin, or pull a new stop off a route line, between the two stops its detour fits best
  - The route re-plans every `planIntervalMS` during the drag and once more on the drop, through your own `plan` if you pass one, and `onRoutes` gets the answers in order
  - With `showOnMap: false`, it shows nothing itself and reports each change to `onWaypointsChange`, for an app that keeps its stops in its own state
