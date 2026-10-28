# Changelog

## 0.5.10

### Patch Changes

- The package ships its `CHANGELOG.md`, as the SDK does, so you can read what changed between two releases from `node_modules`

- A `maxZoom` of 0 is honoured, and `update()` rebuilds the places layers only when it is given a places config

- `new ViewportPlaces(map, { onError })` hands you a refresh on map move that fails, as the search's `SDKError` or the map's `TomTomMapError`, instead of only logging it

## 0.5.9

### Patch Changes

- The README links the repository's security policy page, which sends a vulnerability report to TomTom's HackerOne program

## 0.5.8

### Patch Changes

- The `license` field reads `SEE LICENSE IN LICENSE.txt`, the form npm and license scanners recognise, so they point to the package's own `LICENSE.txt` instead of reporting an unknown license

- Installs beside `@tomtom-org/maps-sdk` 1.0.0 and every later 1.x release: the peer range on the SDK runs up to `<2.0.0` instead of stopping below 1.0.0

- The package page on npm and the API reference of its entry points say the plugin is in Public Preview until its 1.0.0 release, as its guides already do

- A refresh on map move, or the clear on `remove`, that fails is logged as a warning instead of leaving an unhandled rejection, for example while the map's style failed to load

## 0.5.7

### Patch Changes

- Plugins are side-effect free, so your bundler drops every part of a plugin your app doesn't use
  
  - Each plugin declares `"sideEffects": false`, and its knob catalogue and other module-level tables are dropped when nothing reads them
  - flyover takes `@turf/turf` as a peer dependency, the copy the SDK already requires, instead of bundling its own
  - The plugins' bundles keep their module-level names, as the SDK's do, so Sandpack and builds that transpile `node_modules` with Babel run their loops correctly

## 0.5.6

### Patch Changes

- license: the privacy clause of `LICENSE.txt` now links the TomTom Privacy Policy, https://www.tomtom.com/privacy/

- tests: each package's unit test run now fails when its coverage drops below the goals in `TESTING.md`

## 0.5.5

### Patch Changes

- No code change: this version is on the `latest` npm tag, which the previous one missed

## 0.5.4

### Patch Changes

- No code change: this version is on the `latest` npm tag, which the previous one missed

## 0.5.3

### Patch Changes

- The README's Project setup link opens the page again, and its quickstart shows a POI category search and updating or removing a place module

## 0.5.2

### Patch Changes

- The package ships without source maps, so a stack trace through the plugin points into its minified bundle
  - An app's own source maps still lead a trace to the plugin's frames (`dist/index.es.js:1:2345`); share such a trace in a report and TomTom maps it back to the source

## 0.5.1

### Patch Changes

- Modules keep the `base-map` marker type under the renamed `markerType`, which needs `@tomtom-org/maps-sdk` `>=0.61.0`.
  
  - Modules keep drawing as `base-map` by default under the renamed `markerType`
  - The peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.61.0 <1.0.0`, the first release with `markerType`
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.61.0

## 0.5.0

### Minor Changes

- Requires `@tomtom-org/maps-sdk` `>=0.59.0 <1.0.0`: each module's viewport searches run through the SDK's new `createLatestRequest`, with no change to what the plugin shows or cancels

- **Breaking:** `searchOptions` takes the SDK's grouped `filters` — `searchOptions: { filters: { poiCategories } }` — and `update()` merges `filters` member by member, like the rest of `searchOptions`. It takes no `cursor`: every module searches the first page of the current viewport

## 0.4.0

### Minor Changes

- **Breaking:** `ViewportPlaces.remove` throws for an unknown ID, as `update` does, instead of logging to the console

### Patch Changes

- Built with the latest minor releases of the plugin build toolchain; no change to the plugin's API or peer dependencies

- Viewport searches call `discoverPlaces`, following the SDK renaming `search`
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.58.0

## 0.3.0

### Minor Changes

- **Breaking:** `searchOptions` no longer accepts `geoBias`; each module always searches the current viewport
- A new viewport cancels the search a module still has in flight
- Accept every SDK release below 1.0: the peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.55.1 <1.0.0` instead of an exact version

### Patch Changes

- Updated dependencies:
  - @tomtom-org/maps-sdk@0.56.0

## [0.2.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.2.0...maps-sdk-plugin-viewport-places-v0.2.1) (2026-04-30)


### Features

* improve api reference types, adjust syntax for agent toolkit plugin, and improve agents.md

## [0.2.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.1.8...maps-sdk-plugin-viewport-places-v0.2.0) (2026-03-16)


### ⚠ BREAKING CHANGES

* improve poi categories relationship with search

### Features

* improve poi categories relationship with search
* incident details service improvements and added agent tools

## [0.1.8](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.1.7...maps-sdk-plugin-viewport-places-v0.1.8) (2026-02-16)


### Bug Fixes

* omit bounding box and position from search options in viewport places plugin since they should be automatically set

## [0.1.6](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.1.5...maps-sdk-plugin-viewport-places-v0.1.6) (2026-01-30)


### Features

* **viewport-places:** improve types


### Bug Fixes

* improve release workflow and update documentation

## [0.1.5](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.1.4...maps-sdk-plugin-viewport-places-v0.1.5) (2026-01-30)


### Bug Fixes

* improve release workflow and update documentation

## [0.1.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.1.3...maps-sdk-plugin-viewport-places-v0.1.4) (2026-01-30)


### Features

* **viewport-places:** improve types

## [0.1.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.1.2...maps-sdk-plugin-viewport-places-v0.1.3) (2026-01-30)


### Features

* **viewport-places:** improve TSDocs

## [0.1.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.1.1...maps-sdk-plugin-viewport-places-v0.1.2) (2026-01-29)


### Features

* simplify viewport places method name, and improve api reference docs

## [0.1.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-viewport-places-v0.1.0...maps-sdk-plugin-viewport-places-v0.1.1) (2026-01-29)


### Features

* add plugins workspace with first plugin to easily display search-powered layers of places on the map
