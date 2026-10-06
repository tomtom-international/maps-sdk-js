# Changelog

## 0.2.1

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map-effects: the TSDoc of `EffectKnobId` and `EffectKnob` names the SDK's `setKnob` and `getKnob` in place of the removed `MapEffects.set` and `MapEffects.get`
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.64.0

## 0.2.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map-effects: `MapEffects` loses `set`, `get` and `reset`: one knob goes through the SDK's `setKnob`, `getKnob` and `resetKnob` with `effectKnobCatalogue`, several through `updateConfig(settings)`, and `resetConfig()` turns everything off
  - map-effects: `applyConfig` checks every value before it replaces any, so a refused value leaves the effects as they were instead of clearing them
  - map-effects: the peer range starts at `@tomtom-org/maps-sdk` 0.63.0
  - agent-toolkit: `setMapStyling` sets and resets knobs through the SDK's `setKnob` and `resetKnob`, and the peer range starts at `@tomtom-org/maps-sdk` 0.63.0

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map-effects: `bloom.only` names the style colour knobs by their map-wide ids (`'traffic.incidents.colors.major'`, `'pois.label.color'`), and `StylingColorKnobGroup` is `StyleColorKnobGroup`
  - map-effects: the scope reads the colours with the SDK's `getStyleColor`, so it no longer needs a `StylingFoundationsModule` on the map
  - agent-toolkit: `setMapStyling` sets the look knobs on the module owning each (Styling, BaseMap road markings, POIs, traffic flow and incidents, the terrain hillshade) by its map-wide id, and its `preset` applies a map preset with `applyMapPreset`

### Patch Changes

- Updated dependencies:
  - @tomtom-org/maps-sdk@0.63.0

## 0.1.2

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - agent-toolkit and map-effects check knob values with the SDK's `validateKnobValue`.
  
  - agent-toolkit: `toggleTilesPOIs` checks `filterCategories.values` with the SDK's `validateKnobValue`, so its error names every refused value the way the map does
  - map-effects: `set` checks values with the SDK's `validateKnobValue`, so a `color` knob refuses a string that is no CSS colour, and the peer range starts at `@tomtom-org/maps-sdk` 0.61.0
  - map-effects: every `effectKnobCatalogue` range has `bounds: 'hard'`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `LICENSE.txt` is the SDK's current license agreement, the same file `@tomtom-org/maps-sdk` ships, in place of the 29 May 2026 version
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.61.0

## 0.1.1

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `BloomScopeEntry` docs name `RoutingModule`'s route colour by its `color` option
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.60.0

## 0.1.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** `MapEffects.describe()` is removed, together with the `MapEffectsCatalogue` and `MapEffectsKnobDescriptor` types. `effectKnobCatalogue` lists every effect knob's kind, description, default, range or options and use case as static data, and `effects.get(id)` reads the value in force.

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency requires `^6.11.2`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - `addPass` / `removePass` run a GLSL fragment pass of your own (`MapEffectsPass`: its `fragment`, `float` / `vec2` `uniforms` and a `placement` before or after the depth of field) inside the effects chain, so bloom, grade, fog, edge blur, tint, vignette and `capture()` all work on what it drew
  - A shader that fails to compile is reported once, with the compiler's log, instead of on every frame
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.58.0

## 0.0.3

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `bloom.only` scopes bloom to styling colour knobs, groups of them (`traffic`) or CSS colours, resolved against the loaded style; `bloom.onlyTolerance` sets how close a pixel's colour must be
  Requires `@tomtom-org/maps-sdk` 0.56.0 or later, for `stylingColorKnobIds`.

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - Accept every SDK release below 1.0: the peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.55.1 <1.0.0` instead of an exact version.
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.56.0

## [0.0.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-map-effects-v0.0.1...maps-sdk-plugin-map-effects-v0.0.2) (2026-09-21)


### Features

* **map:** styling GA phase 2 - view knobs, presets, map-effects plugin ([a672ffb](https://github.com/tomtom-international/maps-sdk-js/commit/a672ffbe5f9d2c61e009674e44ac49a4b9e0c980))
