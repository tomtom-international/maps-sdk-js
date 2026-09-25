# Changelog

## 0.0.3

### Patch Changes

- 1bea71f: Features:
  - `bloom.only` scopes bloom to styling colour knobs, groups of them (`traffic`) or CSS colours, resolved against the loaded style; `bloom.onlyTolerance` sets how close a pixel's colour must be (#2175)
  
  Requires `@tomtom-org/maps-sdk` 0.56.0 or later, for `stylingColorKnobIds`.
- 9e1d080: Accept every SDK release below 1.0: the peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.55.1 <1.0.0` instead of an exact version.
- Updated dependencies [9e1d080]
- Updated dependencies [1bea71f]
  - @tomtom-org/maps-sdk@0.56.0

## [0.0.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-map-effects-v0.0.1...maps-sdk-plugin-map-effects-v0.0.2) (2026-09-21)


### Features

* **map:** styling GA phase 2 - view knobs, presets, map-effects plugin ([#2090](https://github.com/tomtom-international/maps-sdk-js/issues/2090)) ([a672ffb](https://github.com/tomtom-international/maps-sdk-js/commit/a672ffbe5f9d2c61e009674e44ac49a4b9e0c980))
