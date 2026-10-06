# Changelog

## 0.0.10

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README's Project setup link opens the page again, and its quickstart shows the dark display mode, hiding the landmarks, and the constructor options

## 0.0.9

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - landmarks-3d: a tile refused because the API key lacks Orbis 3D Landmarks access warns that the key needs it, linking the Private Preview terms, and where to request it

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency moves up to `^6.12.0`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The package ships without source maps, so a stack trace through the plugin points into its minified bundle
  - An app's own source maps still lead a trace to the plugin's frames (`dist/index.es.js:1:2345`); share such a trace in a report and TomTom maps it back to the source

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: each standard style ID is the Orbis style it loads, in camelCase
  - map: `standardLight`, `standardDark`, `drivingLight`, `drivingDark` and `satellite` are `streetLight`, `streetDark`, `streetLightDriving`, `streetDarkDriving` and `streetSatellite`; `monoLight` and `monoDark` stay
  - agent-toolkit: `setMapStandardStyle` takes the new IDs, `resetState` reverts to `streetLight`, and the plugin needs SDK 1.0.0-rc.0
  - map-theme, landmarks-3d: their docs name the new IDs

## 0.0.8

### Patch Changes

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - Fixes:
  - The Basis Universal transcoder that decodes the landmarks' KTX2 textures ships with the plugin, in a chunk loaded with the first landmark tile, instead of loading from unpkg.com; `transcoderPath` still serves your own copy
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.62.0

## 0.0.7

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency requires `^6.11.2`
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.58.0

## 0.0.6

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)!
  
  - Landmarks stand on 3D terrain: each one is lowered onto the lowest ground under its footprint
  - `inherited` mode mirrors the opacity and vertical gradient of the basemap 3D buildings too, and shades like them from every angle
  - Landmark edges no longer tremble while zooming: mesh positions are kept relative to a scene origin
  - Landmarks leave the screen together with the basemap buildings of the same area
  - `maplibre-gl` is a declared peer dependency, the one the SDK already requires
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.57.0

## 0.0.5

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)!
  
  - Read the camera transform from the composed camera of maplibre-gl v6
  - Compose the basemap building filter through the SDK `LayerFilterComposer` instead of editing the layer filter in place
  - Accept every SDK release below 1.0: the peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.55.1 <1.0.0` instead of an exact version
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.56.0

## [0.0.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-landmarks-3d-v0.0.3...maps-sdk-plugin-landmarks-3d-v0.0.4) (2026-07-24)


### Bug Fixes

* **landmarks-3d:** render POIs on top of 3D landmark meshes ([79b0922](https://github.com/tomtom-international/maps-sdk-js/commit/79b092201562e4452ac31f2890ac8046fdf3b27e))

## [0.0.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-landmarks-3d-v0.0.2...maps-sdk-plugin-landmarks-3d-v0.0.3) (2026-07-03)


### Bug Fixes

* **landmarks-3d:** send session credentials so tiles load behind a proxy ([dc7b78c](https://github.com/tomtom-international/maps-sdk-js/commit/dc7b78c0d614571b63f0d4f27620bbe1155e971a))

## [0.0.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-landmarks-3d-v0.0.1...maps-sdk-plugin-landmarks-3d-v0.0.2) (2026-06-25)


### Features

* **plugins:** add landmarks-3d plugin for Orbis 3D Landmarks ([ef5ed89](https://github.com/tomtom-international/maps-sdk-js/commit/ef5ed899e9a396701668bd324799f6ddad96291c))
