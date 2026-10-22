# @tomtom-org/maps-sdk-plugin-map-theme

## 0.3.8

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README links the repository's security policy page, which sends a vulnerability report to TomTom's HackerOne program

## 0.3.7

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `license` field reads `SEE LICENSE IN LICENSE.txt`, the form npm and license scanners recognise, so they point to the package's own `LICENSE.txt` instead of reporting an unknown license

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map-theme: `deriveMapColors` picks `land` by OKLCH chroma and from the theme's side of mid-lightness, so a cream stays the land of a light theme and a navy the land of a dark one
  
  - map-theme: a colour of OKLCH chroma 0.08 or less can be `land`, where an HSL saturation of 0.4 or less was the bar, which left out pale creams HSL rates as saturated and gave their light themes a dark grey land
  - map-theme: a dark theme takes a dark colour as `land` before a light neutral, and a light theme a light colour before a dark neutral

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Installs beside `@tomtom-org/maps-sdk` 1.0.0 and every later 1.x release: the peer range on the SDK runs up to `<2.0.0` instead of stopping below 1.0.0

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The package page on npm and the API reference of its entry points say the plugin is in Public Preview until its 1.0.0 release, as its guides already do

## 0.3.6

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Plugins are side-effect free, so your bundler drops every part of a plugin your app doesn't use
  
  - Each plugin declares `"sideEffects": false`, and its knob catalogue and other module-level tables are dropped when nothing reads them
  - flyover takes `@turf/turf` as a peer dependency, the copy the SDK already requires, instead of bundling its own
  - The plugins' bundles keep their module-level names, as the SDK's do, so Sandpack and builds that transpile `node_modules` with Babel run their loops correctly

## 0.3.5

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - license: the privacy clause of `LICENSE.txt` now links the TomTom Privacy Policy, https://www.tomtom.com/privacy/

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - tests: each package's unit test run now fails when its coverage drops below the goals in `TESTING.md`

## 0.3.4

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - No code change: this version is on the `latest` npm tag, which the previous one missed

## 0.3.3

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - No code change: this version is on the `latest` npm tag, which the previous one missed

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
