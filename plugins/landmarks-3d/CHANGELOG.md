# Changelog

## 0.1.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** `Landmarks3D` takes its look as knobs, each one following the base map's 3D buildings until you set it
  
  - `color`, `opacity`, `verticalGradient`, `visible`, `minZoom` and `maxZoom` are knobs in the new `landmarks3DKnobCatalogue`. Set them with `applyConfig`, `updateConfig`, or the SDK's `setKnob` and `setKnobs`, read them with `getConfig` and `getKnob`, and unset them with `resetKnob` and `resetConfig`
  - A knob left unset follows the base map's `3D - Building` layer through `setStyle` and whatever restyles it: the map colours, such as `setMapColors({ artificial })`, or a paint property set on the layer directly
  - **Breaking:** the plugin no longer shows the `3D - Building` layer, which it used to turn visible on every style load over the `BaseMapModule`'s `buildings3D` group. For the 3D city around the landmarks, show that group: `BaseMapModule.get(map, { groups: { buildings3D: { visible: true } } })`
  - `displayMode`, `setDisplayMode`, `getDisplayMode` and `Landmarks3DDisplayMode` are removed. For `'dark'` use `updateConfig({ color: 'hsl(210, 9%, 17%)' })`, for `'light'` use `updateConfig({ color: 'hsl(38, 6%, 90%)' })`, and for `'inherited'` use `resetConfig()`
  - `setVisible` returns `void` instead of a promise, and stores `visible` in the configuration
  - The plugin needs `@tomtom-org/maps-sdk` 1.0.0-rc.2 or later
  - examples: `landmarks-3d-plugin` sets the landmark knobs and a built-up colour they follow, `landmarks-3d-plugin` and `multiple-maps-landmarks` show the `buildings3D` group themselves, and `3d-terrain` drops `displayMode`

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Plugins are side-effect free, so your bundler drops every part of a plugin your app doesn't use
  
  - Each plugin declares `"sideEffects": false`, and its knob catalogue and other module-level tables are dropped when nothing reads them
  - flyover takes `@turf/turf` as a peer dependency, the copy the SDK already requires, instead of bundling its own
  - The plugins' bundles keep their module-level names, as the SDK's do, so Sandpack and builds that transpile `node_modules` with Babel run their loops correctly

## 0.0.13

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - A still map with landmarks loaded stops redrawing every frame.
  - The layer asks for a frame only when a tile arrives, and works out the tiles in view only when the camera moves or the map's data changes
  - After writing a `landmarks.layer` field yourself, call `map.mapLibreMap.triggerRepaint()`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency moves up to `^6.13.0`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - license: the privacy clause of `LICENSE.txt` now links the TomTom Privacy Policy, https://www.tomtom.com/privacy/

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - tests: each package's unit test run now fails when its coverage drops below the goals in `TESTING.md`

## 0.0.12

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - No code change: this version is on the `latest` npm tag, which the previous one missed

## 0.0.11

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - No code change: this version is on the `latest` npm tag, which the previous one missed

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
