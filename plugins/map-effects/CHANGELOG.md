# Changelog

## 0.3.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: a knob id is the path of its setting in the configuration on every module, and `setKnobs` sets several knobs in one checked change
  - map: `setKnobs(module, catalogue, values)` checks every value against its knob, then applies them all in one change and one `config-change`. If it refuses one value, it sets none. `KnobValues<CONFIG, ID>` types the values by id
  - map: `StylingFoundationsModuleConfig` nests each setting along its id, as every other module does: `{ labels: { sizeFactor: 1.2 } }` instead of `{ 'labels.sizeFactor': 1.2 }`. `setKnob`, `setKnobs`, `getKnob`, `resetKnob` and `MapPresetSettings` keep the ids
  - map: `StylingFoundationsModule`'s `updateConfig` merges one level deep, as on every module, so `updateConfig({ colors: { water } })` replaces the colours set before. Set a single colour with `setKnob`. Its `applyConfig` and `updateConfig` no longer check values at run time, as on every module. `setKnob` and `setKnobs` do
  - map: a `KnobTarget` implements `_setKnobValues(values)` instead of `_setKnobValue(id, value)`, and a subclass of `AbstractMapModule` inherits it. For a plugin's own target, `knobValueIn`, `configWithKnobs` and `configWithoutKnob` implement the hooks
  - map-effects: `MapEffectsSettings` is `MapEffectsConfig`, and nests each knob along its id: `new MapEffects(map, { bloom: { intensity: 0.5 } })`. `updateConfig` replaces each effect it names, while `setKnob` and `setKnobs` keep the rest of an effect. The constructor, `applyConfig` and `updateConfig` no longer check values at run time, as on a map module. `setKnob` and `setKnobs` do. The plugin needs SDK 1.0.0-rc.2
  - agent-toolkit: `setMapStyling` reads the styling knobs at their paths, and the plugin needs SDK 1.0.0-rc.2
  - examples: the map effects playground restores its panel from `localStorage` with `setKnobs`

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - license: the privacy clause of `LICENSE.txt` now links the TomTom Privacy Policy, https://www.tomtom.com/privacy/

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Fog takes the new style's air colour when `setStyle()` switches between a light and a dark style, as `capture()` already did, with no config call needed after the switch

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency moves up to `^6.13.0`

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - tests: each package's unit test run now fails when its coverage drops below the goals in `TESTING.md`

## 0.2.5

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - No code change: this version is on the `latest` npm tag, which the previous one missed

## 0.2.4

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - No code change: this version is on the `latest` npm tag, which the previous one missed

## 0.2.3

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README's Project setup link opens the page again

## 0.2.2

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency moves up to `^6.12.0`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `MapEffects` docs and README stop naming custom styles, which the SDK no longer loads

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The package ships without source maps, so a stack trace through the plugin points into its minified bundle
  - An app's own source maps still lead a trace to the plugin's frames (`dist/index.es.js:1:2345`); share such a trace in a report and TomTom maps it back to the source

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
