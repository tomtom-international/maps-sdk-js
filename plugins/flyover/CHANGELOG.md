# @tomtom-org/maps-sdk-plugin-flyover

## 0.0.7

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `RouteFlyover` can fly a route once, and seek by time or distance
  
  - `loop: false` stops the flight at the destination and calls the new `onArrive`. `start()` from there flies the route again from its departure. The flight still loops by default.
  - `seek` also takes a `RouteProgressQuery`, as `getCoordinateAtRouteProgress` does: a time or distance travelled, or a clock time. A point outside the route moves the flight to the nearer end.

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Plugins are side-effect free, so your bundler drops every part of a plugin your app doesn't use
  
  - Each plugin declares `"sideEffects": false`, and its knob catalogue and other module-level tables are dropped when nothing reads them
  - flyover takes `@turf/turf` as a peer dependency, the copy the SDK already requires, instead of bundling its own
  - The plugins' bundles keep their module-level names, as the SDK's do, so Sandpack and builds that transpile `node_modules` with Babel run their loops correctly

## 0.0.6

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency moves up to `^6.13.0`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - license: the privacy clause of `LICENSE.txt` now links the TomTom Privacy Policy, https://www.tomtom.com/privacy/

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - tests: each package's unit test run now fails when its coverage drops below the goals in `TESTING.md`

## 0.0.5

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README's install line adds the `maplibre-gl` peer dependency, and it links the developer guide and the playground example up front

## 0.0.4

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency moves up to `^6.12.0`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The package ships without source maps, so a stack trace through the plugin points into its minified bundle
  - An app's own source maps still lead a trace to the plugin's frames (`dist/index.es.js:1:2345`); share such a trace in a report and TomTom maps it back to the source

## 0.0.3

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map, services: internals that were exported without documentation are no longer exported
  - map: `EventsProxy`, `sharedInstance`, `TomTomMapSource`, `InternalTomTomMapParams`, `poiLayerIDs`, `buildRoutingLayers` and `ROUTE_LINE_OUTLINE_COLOR`, whose value the upgrade guide gives
  - services: the geometry data wire-format types `GeometryDataResponseAPI` and `AdditionalDataAPI`
  - flyover: the arrow marker keeps its default fill, now defined in the plugin rather than imported from the SDK
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.64.0

## 0.0.2

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `LICENSE.txt` is the SDK's current license agreement, the same file `@tomtom-org/maps-sdk` ships, in place of the 29 May 2026 version
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.61.0

## 0.0.1

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - New plugin: `RouteFlyover` flies a camera along a calculated route — it aims ahead, frames the next junctions, keeps clear of the terrain it crosses, eases every change on a critically damped spring, and parks the followed position where you want it on screen (`anchorForPitch`), marked with a themeable arrow or an image of your own (`setMarker`)
