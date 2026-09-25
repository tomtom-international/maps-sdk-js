# Changelog

## 0.0.5

### Patch Changes

- 9e1d080: Bug fixes:
  - Read the camera transform from the composed camera of maplibre-gl v6 (#2035)
  - Compose the basemap building filter through the SDK `LayerFilterComposer` instead of editing the layer filter in place (#2089)
  
  Peer dependency:
  - Accept every SDK release below 1.0: the peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.55.1 <1.0.0` instead of an exact version
- Updated dependencies [9e1d080]
- Updated dependencies [1bea71f]
  - @tomtom-org/maps-sdk@0.56.0

## [0.0.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-landmarks-3d-v0.0.3...maps-sdk-plugin-landmarks-3d-v0.0.4) (2026-07-24)


### Bug Fixes

* **landmarks-3d:** render POIs on top of 3D landmark meshes ([#2011](https://github.com/tomtom-international/maps-sdk-js/issues/2011)) ([79b0922](https://github.com/tomtom-international/maps-sdk-js/commit/79b092201562e4452ac31f2890ac8046fdf3b27e))

## [0.0.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-landmarks-3d-v0.0.2...maps-sdk-plugin-landmarks-3d-v0.0.3) (2026-07-03)


### Bug Fixes

* **landmarks-3d:** send session credentials so tiles load behind a proxy ([#1943](https://github.com/tomtom-international/maps-sdk-js/issues/1943)) ([dc7b78c](https://github.com/tomtom-international/maps-sdk-js/commit/dc7b78c0d614571b63f0d4f27620bbe1155e971a))

## [0.0.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-landmarks-3d-v0.0.1...maps-sdk-plugin-landmarks-3d-v0.0.2) (2026-06-25)


### Features

* **plugins:** add landmarks-3d plugin for Orbis 3D Landmarks ([#1772](https://github.com/tomtom-international/maps-sdk-js/issues/1772)) ([ef5ed89](https://github.com/tomtom-international/maps-sdk-js/commit/ef5ed899e9a396701668bd324799f6ddad96291c))
