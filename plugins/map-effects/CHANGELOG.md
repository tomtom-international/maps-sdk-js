# Changelog

## 0.4.2

### Patch Changes

- The package ships its `CHANGELOG.md`, as the SDK does, so you can read what changed between two releases from `node_modules`

- Captures run one at a time and wait for loading tiles, and a failed frame hides the artwork and the bloom and warns once
  
  - `onlyTolerance: 0` lights the key colours, and a negative value counts as 0
  - The depth of field warns when WebGL2 is missing
  - `capture()` rejects with a `RangeError` for a `pixelRatio` that isn't a positive number
  - Render targets are freed when the effects chain drops to one stage or none
  - App layers keep drawing while the effects chain fails
  - A layer whose `draw()` throws part-way is left empty rather than half drawn
  - `capture()` skips a tint whose colour the live overlay can't paint either, rather than filling with the colour drawn before it

## 0.4.1

### Patch Changes

- The README links the repository's security policy page, which sends a vulnerability report to TomTom's HackerOne program

## 0.4.0

### Minor Changes

- **Breaking:** Give the fog an air colour of your own with `fog.color`, and push a blur or a grade past its slider's end
  
  - `fog.color` washes the rim towards your colour, and its lightness brightens or darkens the rim with it. A translucent colour thins both. If you don't set it, the fog keeps the air of the map's light/dark theme
  - `fog.color` has no `default` in `effectKnobCatalogue`, so a `color` knob's `default` is now optional in `EffectKnob`. Code that reads it as a `string` handles `undefined` too
  - `bloom.radius`, `bloom.onlyTolerance`, `glare.length`, `glare.onlyTolerance`, `grade.brightness`, `grade.contrast`, `grade.saturation`, `edgeBlur.intensity` and `depthOfField.intensity` now have `hard-min` bounds: `setKnob` still refuses a value below the minimum, and a value above the maximum applies
  - The map effects playground adds a milky distance use case, and its panel shows `fog.color` following the theme until you pick a colour

- **Breaking:** the `maplibre-gl` peer dependency moves up to `^6.15.0`

### Patch Changes

- The `license` field reads `SEE LICENSE IN LICENSE.txt`, the form npm and license scanners recognise, so they point to the package's own `LICENSE.txt` instead of reporting an unknown license

- Glare makes the colours you name shine like street lamps through a lens, with `glare.*` knobs for the streaks' strength, length, ray count and angle
  
  - `glare.only` names the lights as `bloom.only` does, by style colour knob, group or CSS colour, and defaults to `colors.roadMajor`
  - The glare runs on the GPU, after the depth of field and before a scoped bloom, so a bloom on the same colour glows along the streaks
  - A `bloom.only` scope set before the map's first style loads now resolves once the style is in, where it lit the whole frame
  - The plugin ships its shaders without their comments, so its bundle is smaller with the glare than it was without it
  - The map effects playground adds a street lights use case

- A bloom scoped with `bloom.only` keys and blurs the map on the GPU, so it no longer reads the frame back to the CPU on every render
  
  - The scoped bloom runs as the last stages of the WebGL2 chain, after your own passes and the depth of field. Without WebGL2 it draws no glow and warns once
  - `bloom.radius` blurs in CSS pixels on a high-DPI screen, as its doc and `capture()` already did, where the live bloom blurred in device pixels

- HTML markers sit above every effect, so a marker stays sharp over the edge blur, the tint, the vignette and the depth of field, whether you add it before or after the effects
  
  - To have a pin take the effects, draw it as a symbol layer instead

- `MapEffects` passes take `vec3` and `vec4` uniforms, textures and mip levels, and `addLayer` puts your own 2D layer between the overlays
  
  - A pass uniform is a number, or an array of two to four numbers bound as `vec2` to `vec4`, so a colour goes in as one `vec3`
  - `MapEffectsPass.textures` binds images, canvases, videos or any other `TexImageSource` as named `sampler2D`s, up to 15 per pass. A video or a canvas uploads on every draw, and an image or a bitmap once per object. A source that hasn't loaded skips the pass for that draw
  - `MapEffectsPass.mipmapped` builds the picture's mip levels before your pass runs, for a pass that reads coarser levels with `textureLod`
  - `addLayer({ id, placement, draw })` draws a 2D canvas layer of yours right above the overlay its `placement` names, from `after-bloom` to `after-vignette`, and `capture()` draws it in the same place. `removeLayer(id)` takes it off
  - examples: `mixed-map-effects` paints its watercolour on a paper texture in a `vec3` paper colour, and leaves a bare paper margin around it as a layer

- Map effects draw in the same frame as the map, so the map no longer needs `preserveDrawingBuffer: true`, and the browser stops copying its frame every frame
  
  - Bloom, the glare, the depth of field, your own passes, your layers and `capture()` read the map canvas inside its `render` event. The plugin no longer warns when `preserveDrawingBuffer` is off, and a map that still sets it keeps working
  - A bloom, glare or depth-of-field knob change, or a pass you add or remove, asks the map for one frame and draws in it, so an idle map redraws once. A grade, tint, fog, edge blur or vignette change asks for none
  - A frame the effects fail to draw, such as with a pass texture from another origin loaded without CORS, shows the map without them and warns once, and `capture()` rejects with the error
  - examples: the map effects examples create their maps without `preserveDrawingBuffer`

- Installs beside `@tomtom-org/maps-sdk` 1.0.0 and every later 1.x release: the peer range on the SDK runs up to `<2.0.0` instead of stopping below 1.0.0

- The package page on npm and the API reference of its entry points say the plugin is in Public Preview until its 1.0.0 release, as its guides already do

## 0.3.1

### Patch Changes

- `MapEffects` stops paying for the WebGL chain while nothing runs on it
  - With the depth of field off, or on over a flat map, a map frame no longer measures the map canvas, so it stops forcing a page layout on every frame
  - The chain takes its WebGL2 context on the first pass or depth of field it runs rather than in the constructor, so a `MapEffects` with only bloom or CSS overlays on holds no context

- Plugins are side-effect free, so your bundler drops every part of a plugin your app doesn't use
  
  - Each plugin declares `"sideEffects": false`, and its knob catalogue and other module-level tables are dropped when nothing reads them
  - flyover takes `@turf/turf` as a peer dependency, the copy the SDK already requires, instead of bundling its own
  - The plugins' bundles keep their module-level names, as the SDK's do, so Sandpack and builds that transpile `node_modules` with Babel run their loops correctly

## 0.3.0

### Minor Changes

- **Breaking:** map: a knob id is the path of its setting in the configuration on every module, and `setKnobs` sets several knobs in one checked change
  - map: `setKnobs(module, catalogue, values)` checks every value against its knob, then applies them all in one change and one `config-change`. If it refuses one value, it sets none. `KnobValues<CONFIG, ID>` types the values by id
  - map: `StylingFoundationsModuleConfig` nests each setting along its id, as every other module does: `{ labels: { sizeFactor: 1.2 } }` instead of `{ 'labels.sizeFactor': 1.2 }`. `setKnob`, `setKnobs`, `getKnob`, `resetKnob` and `MapPresetSettings` keep the ids
  - map: `StylingFoundationsModule`'s `updateConfig` merges one level deep, as on every module, so `updateConfig({ colors: { water } })` replaces the colours set before. Set a single colour with `setKnob`. Its `applyConfig` and `updateConfig` no longer check values at run time, as on every module. `setKnob` and `setKnobs` do
  - map: a `KnobTarget` implements `_setKnobValues(values)` instead of `_setKnobValue(id, value)`, and a subclass of `AbstractMapModule` inherits it. For a plugin's own target, `knobValueIn`, `configWithKnobs` and `configWithoutKnob` implement the hooks
  - map-effects: `MapEffectsSettings` is `MapEffectsConfig`, and nests each knob along its id: `new MapEffects(map, { bloom: { intensity: 0.5 } })`. `updateConfig` replaces each effect it names, while `setKnob` and `setKnobs` keep the rest of an effect. The constructor, `applyConfig` and `updateConfig` no longer check values at run time, as on a map module. `setKnob` and `setKnobs` do. The plugin needs SDK 1.0.0-rc.2
  - agent-toolkit: `setMapStyling` reads the styling knobs at their paths, and the plugin needs SDK 1.0.0-rc.2
  - examples: the map effects playground restores its panel from `localStorage` with `setKnobs`

### Patch Changes

- license: the privacy clause of `LICENSE.txt` now links the TomTom Privacy Policy, https://www.tomtom.com/privacy/

- Fog takes the new style's air colour when `setStyle()` switches between a light and a dark style, as `capture()` already did, with no config call needed after the switch

- The `maplibre-gl` peer dependency moves up to `^6.13.0`

- tests: each package's unit test run now fails when its coverage drops below the goals in `TESTING.md`

## 0.2.5

### Patch Changes

- No code change: this version is on the `latest` npm tag, which the previous one missed

## 0.2.4

### Patch Changes

- No code change: this version is on the `latest` npm tag, which the previous one missed

## 0.2.3

### Patch Changes

- The README's Project setup link opens the page again

## 0.2.2

### Patch Changes

- The `maplibre-gl` peer dependency moves up to `^6.12.0`

- The `MapEffects` docs and README stop naming custom styles, which the SDK no longer loads

- The package ships without source maps, so a stack trace through the plugin points into its minified bundle
  - An app's own source maps still lead a trace to the plugin's frames (`dist/index.es.js:1:2345`); share such a trace in a report and TomTom maps it back to the source

## 0.2.1

### Patch Changes

- map-effects: the TSDoc of `EffectKnobId` and `EffectKnob` names the SDK's `setKnob` and `getKnob` in place of the removed `MapEffects.set` and `MapEffects.get`
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.64.0

## 0.2.0

### Minor Changes

- **Breaking:** map-effects: `MapEffects` loses `set`, `get` and `reset`: one knob goes through the SDK's `setKnob`, `getKnob` and `resetKnob` with `effectKnobCatalogue`, several through `updateConfig(settings)`, and `resetConfig()` turns everything off
  - map-effects: `applyConfig` checks every value before it replaces any, so a refused value leaves the effects as they were instead of clearing them
  - map-effects: the peer range starts at `@tomtom-org/maps-sdk` 0.63.0
  - agent-toolkit: `setMapStyling` sets and resets knobs through the SDK's `setKnob` and `resetKnob`, and the peer range starts at `@tomtom-org/maps-sdk` 0.63.0

- **Breaking:** map-effects: `bloom.only` names the style colour knobs by their map-wide ids (`'traffic.incidents.colors.major'`, `'pois.label.color'`), and `StylingColorKnobGroup` is `StyleColorKnobGroup`
  - map-effects: the scope reads the colours with the SDK's `getStyleColor`, so it no longer needs a `StylingFoundationsModule` on the map
  - agent-toolkit: `setMapStyling` sets the look knobs on the module owning each (Styling, BaseMap road markings, POIs, traffic flow and incidents, the terrain hillshade) by its map-wide id, and its `preset` applies a map preset with `applyMapPreset`

### Patch Changes

- Updated dependencies:
  - @tomtom-org/maps-sdk@0.63.0

## 0.1.2

### Patch Changes

- agent-toolkit and map-effects check knob values with the SDK's `validateKnobValue`.
  
  - agent-toolkit: `toggleTilesPOIs` checks `filterCategories.values` with the SDK's `validateKnobValue`, so its error names every refused value the way the map does
  - map-effects: `set` checks values with the SDK's `validateKnobValue`, so a `color` knob refuses a string that is no CSS colour, and the peer range starts at `@tomtom-org/maps-sdk` 0.61.0
  - map-effects: every `effectKnobCatalogue` range has `bounds: 'hard'`

- `LICENSE.txt` is the SDK's current license agreement, the same file `@tomtom-org/maps-sdk` ships, in place of the 29 May 2026 version
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.61.0

## 0.1.1

### Patch Changes

- The `BloomScopeEntry` docs name `RoutingModule`'s route colour by its `color` option
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.60.0

## 0.1.0

### Minor Changes

- **Breaking:** `MapEffects.describe()` is removed, together with the `MapEffectsCatalogue` and `MapEffectsKnobDescriptor` types. `effectKnobCatalogue` lists every effect knob's kind, description, default, range or options and use case as static data, and `effects.get(id)` reads the value in force.

### Patch Changes

- The `maplibre-gl` peer dependency requires `^6.11.2`

- `addPass` / `removePass` run a GLSL fragment pass of your own (`MapEffectsPass`: its `fragment`, `float` / `vec2` `uniforms` and a `placement` before or after the depth of field) inside the effects chain, so bloom, grade, fog, edge blur, tint, vignette and `capture()` all work on what it drew
- A shader that fails to compile is reported once, with the compiler's log, instead of on every frame
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.58.0

## 0.0.3

### Patch Changes

- `bloom.only` scopes bloom to styling colour knobs, groups of them (`traffic`) or CSS colours, resolved against the loaded style; `bloom.onlyTolerance` sets how close a pixel's colour must be
  Requires `@tomtom-org/maps-sdk` 0.56.0 or later, for `stylingColorKnobIds`.

- Accept every SDK release below 1.0: the peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.55.1 <1.0.0` instead of an exact version.
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.56.0

## [0.0.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-map-effects-v0.0.1...maps-sdk-plugin-map-effects-v0.0.2) (2026-09-21)


### Features

* **map:** styling GA phase 2 - view knobs, presets, map-effects plugin
