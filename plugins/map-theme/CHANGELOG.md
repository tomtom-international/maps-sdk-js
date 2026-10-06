# @tomtom-org/maps-sdk-plugin-map-theme

## 0.3.2

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README's install line adds the `culori` peer dependency, and its quickstart links the SDK setup it starts from

## 0.3.1

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The package ships without source maps, so a stack trace through the plugin points into its minified bundle
  - An app's own source maps still lead a trace to the plugin's frames (`dist/index.es.js:1:2345`); share such a trace in a report and TomTom maps it back to the source

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: each standard style ID is the Orbis style it loads, in camelCase
  - map: `standardLight`, `standardDark`, `drivingLight`, `drivingDark` and `satellite` are `streetLight`, `streetDark`, `streetLightDriving`, `streetDarkDriving` and `streetSatellite`; `monoLight` and `monoDark` stay
  - agent-toolkit: `setMapStandardStyle` takes the new IDs, `resetState` reverts to `streetLight`, and the plugin needs SDK 1.0.0-rc.0
  - map-theme, landmarks-3d: their docs name the new IDs

## 0.3.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: a shape's edge is its outline and a label's is its halo, in every module
  - map: the map colour `labelOutline` is `labelHalo`, knob id `colors.labelHalo`
  - map: PlacesModule `cluster.badge.strokeColor` and `strokeWidth` are `outlineColor` and `outlineWidth`, knob ids `cluster.badge.outlineColor` and `cluster.badge.outlineWidth`
  - map-theme: `deriveMapColors`, `deriveMapColorsFromCss` and `deriveMapColorsFromImage` return `labelHalo` in place of `labelOutline`, and need SDK 0.64.0

### Patch Changes

- Updated dependencies:
  - @tomtom-org/maps-sdk@0.64.0

## 0.2.3

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map-theme: the docs point the derived colours at `StylingFoundationsModule.setMapColors`, the module's new name
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.63.0

## 0.2.2

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `LICENSE.txt` is the SDK's current license agreement, the same file `@tomtom-org/maps-sdk` ships, in place of the 29 May 2026 version

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README points to `LICENSE.txt`, as the other plugins' READMEs do
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.61.0

## 0.2.1

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - The API reference of `deriveMapColorsFromCss` and `deriveMapColorsFromImage` carries a usage example, and the guide names the inputs that make them throw

## 0.2.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** `deriveMapColors`, `deriveMapColorsFromCss` and `deriveMapColorsFromImage` return `accent`, which `setMapColors` rejects before `@tomtom-org/maps-sdk` 0.59.0
  - `deriveMapColors`, `deriveMapColorsFromCss` and `deriveMapColorsFromImage` derive `accent`, the colour routes, geometries and place pins take: the most colourful colour left that reads 3:1 on land and sits 30° of hue from the major roads, else their complement
  - The peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.59.0 <1.0.0`, the first release with the accent

## 0.1.0

### Minor Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - First release: theme a TomTomMap from a brand's colours, a website's, a described mood, an artist's palette or an image, by assigning them to the SDK's ten map colours

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - New plugin: `deriveMapColors` assigns a few colours (a brand, a website, an artist, a mood) to the ten map colours, `deriveMapColorsFromCss` does it from the colours a stylesheet paints with most (`cssColors`), and `deriveMapColorsFromImage` from an image's `dominantColors`; apply the result with `styling.setMapColors`, after switching to the style `mapColorsLightDark` names light or dark
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.58.0
