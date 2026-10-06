# @tomtom-org/maps-sdk-plugin-flyover

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
