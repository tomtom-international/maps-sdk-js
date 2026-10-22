# Changelog

## 0.2.1

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README links the repository's security policy page, which sends a vulnerability report to TomTom's HackerOne program

## 0.2.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** the `maplibre-gl` peer dependency moves up to `^6.15.0`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** The Basis Universal transcoder ships as its two files in `dist/`, which your app's bundler emits with your build, instead of a 780 KB chunk of `data:` URLs, and `Landmarks3D` takes a `transcoderPath` to load them from your own host
  - A strict Content Security Policy no longer needs `data:` in `connect-src`.
  - If your bundler doesn't emit the files a `new URL('./file', import.meta.url)` names, copy `basis_transcoder.js` and `basis_transcoder.wasm` from the plugin's `dist/` to your host and set `transcoderPath` to their path.
  - On the Vite 7 dev server, add `@tomtom-org/maps-sdk-plugin-landmarks-3d` to `optimizeDeps.exclude`, beside the SDK, or upgrade to Vite 8. Pre-bundled, the plugin moves away from its two files.

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - landmarks-3d: `Buildings3D` windows mirror the facades across the street, the sky and a glint of the sun, as much as the new `reflections.intensity` knob sets, and the `roadLabels.occluded` and `pois.occluded` knobs draw those labels under the buildings, which hide them where they cover them
  
  - landmarks-3d: the reflection takes the place of the glass's own colour, each pane mirroring its own slice of the street and of the facades across it, whose windows slide past as the camera moves, under the scene's sun and sky light, at no extra texture or pass. A pane in shadow loses the sun's glint
  - landmarks-3d: landmarks drawn among the buildings mirror a little of the same street and sky, their darker windows the most and their roofs barely, and catch the sun's glint
  - landmarks-3d: an occluded label layer moves under the buildings' layer, at no cost per frame, and goes back to its place in the style's order once the knob is off. A hidden POI still keeps other labels off its place, and the labels moved under give way to the ones above them where they collide
  - landmarks-3d: on a style without 3D buildings of its own, `Buildings3D` draws under every label, road names included, where it drew over them
  - examples: `buildings-3d-plugin-playground` adds the glass reflections slider and the two label toggles, and `cinematic-city-flyby` hides its road names with `roadLabels.occluded`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Draw the base map's buildings in 3D with `Buildings3D`: windows on every wall, a sun or a moon that casts shadows, lit windows at night and a preset for each standard style, every part of it a knob
  - Shadows reach 5 km from the map's centre, fading out over the last kilometre, however far a tilted view reaches
  - Landmarks among the buildings share their sun and shadows, casting theirs on the buildings and catching the buildings' ones, and take their wall colour, with their own stonework and windows as facade detail
  - `Buildings3D` is in Public Preview and works with any API key, while the landmarks stay in Private Preview
  - examples: `landmarks-3d-plugin` builds its landmark controls from `landmarks3DKnobCatalogue`, adding the zoom range, flies to landmarks in seven cities, and adds a toggle that draws `Buildings3D` around them
  - examples: `buildings-3d-plugin-playground` tunes the buildings' look live over Manhattan, plays a day through, and adds the landmarks behind a Landmarks toggle
  - examples: `cinematic-city-orbit` circles the Empire State Building in eight looks, each mixing the 3D buildings and landmarks with bloom, depth of field and a map theme

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `Landmarks3D` and the fly-over marker add their layers through the SDK's `map.addCustomLayer`, which keeps them placed through style switches
  
  - landmarks-3d: module layers placed at `'poi'` now go under the landmarks, even when added after `Landmarks3D`, where one added later drew over them
  - flyover: module layers placed at `'top'`, such as the default of `CustomGeoJSONModule`, now go under the marker, even when added after it, where one added later drew over it

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Both plugins need `@tomtom-org/maps-sdk` 1.0.0-rc.4 or later, since they line their layers up with the map through its `localFrameMatrix`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - landmarks-3d: draw the landmarks in their own colours with the new `texture` knob, set to `color`, still lit by the style light's colour and intensity, or by a `Buildings3D`'s sun, sky and shadows
  
  - landmarks-3d: `texture` takes one of `landmarkTextureUses`. `mask` only carves the silhouette, `detail` adds the texture's light and shade over `color`, and `color` takes the texture's colours in place of it. Unset, it's `mask`, or `detail` while a `Buildings3D` draws, as before
  - landmarks-3d: `opacity` and `verticalGradient` keep applying with every texture use
  - examples: `landmarks-3d-plugin` adds a Texture control

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `license` field reads `SEE LICENSE IN LICENSE.txt`, the form npm and license scanners recognise, so they point to the package's own `LICENSE.txt` instead of reporting an unknown license

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Installs beside `@tomtom-org/maps-sdk` 1.0.0 and every later 1.x release: the peer range on the SDK runs up to `<2.0.0` instead of stopping below 1.0.0

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
