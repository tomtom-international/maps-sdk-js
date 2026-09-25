# Map Effects Plugin Reference

Practical post-processing over a `TomTomMap`, computed from the rendered pixels — style-independent, works on custom styles, survives style releases. Package `@tomtom-org/maps-sdk-plugin-map-effects`. Use it for **muting the base map under data**, **emphasis on dark/driving styles (bloom)**, **focus (fog, edge blur, vignette)** and **depth on a tilted 3D map (depth of field)** — never for "artistic" looks.

## Imports

```ts
import { MapEffects, type MapEffectsSettings, type EffectKnobId, effectKnobIds } from '@tomtom-org/maps-sdk-plugin-map-effects';
```

## Setup

```ts
const map = new TomTomMap({
    style: 'standardDark',
    mapLibre: {
        container: 'map',
        // REQUIRED for bloom, the depth of field and capture (they read the canvas back). The plugin warns once if missing.
        canvasContextAttributes: { preserveDrawingBuffer: true },
    },
});
const effects = new MapEffects(map);                      // everything off
const effects = new MapEffects(map, { 'tint.opacity': 0.2 }); // with initial settings
```

## Set / get / reset

```ts
effects.set({ 'grade.saturation': 0.4, 'grade.brightness': 0.85, 'tint.opacity': 0.15 }); // mute under data
effects.set({ 'bloom.intensity': 0.5, 'bloom.threshold': 0.6 });                         // glow on dark styles
effects.set({ 'vignette.intensity': -0.4, 'edgeBlur.intensity': 8 });                    // focus the centre

effects.get('bloom.intensity');    // current value or default
effects.reset('bloom.intensity');  // one knob to default (off)
effects.reset();                   // all off
effects.getConfig();               // overridden knobs only — plain JSON
effects.applyConfig(settings);     // replace all
effects.remove();                  // detach from the map
```

Out-of-range values throw `RangeError`; unknown ids throw `Error`. Nothing is touched on a failed `set`.

## Knob ids

| Group | Ids | Range | Default |
| --- | --- | --- | --- |
| bloom | `bloom.intensity`, `bloom.threshold` / `bloom.radius` | 0–1 / 2–40 px | 0 (off), 0.55 / 12 |
| bloom scope | `bloom.only` / `bloom.onlyTolerance` | list of styling colour knobs, groups, CSS colours / 0–1 | `[]` (whole frame) / 0.15 |
| grade | `grade.brightness`, `grade.contrast` / `grade.saturation` | 0.5–1.5 / 0–1.5 | 1 |
| tint | `tint.color` / `tint.opacity` | colour / 0–1 | `#1f2937` / 0 (off) |
| fog | `fog.intensity`, `fog.reach` | 0–1 | 0 (off), 0.4 |
| edgeBlur | `edgeBlur.intensity` / `edgeBlur.reach` | 0–30 px / 0–1 | 0 (off) / 0.5 |
| depthOfField | `depthOfField.intensity` / `depthOfField.focus`, `depthOfField.band`, `depthOfField.bokeh` | 0–30 px / 0–1 | 0 (off) / 0, 0.3, 0.5 |
| vignette | `vignette.intensity` (− darkens, + lightens) / `vignette.reach` | −1–1 / 0–1 | 0 (off) / 0.45 |

**fog vs edgeBlur** — both blur the rim and take a `reach`; the difference is the rim's colour. `fog` also washes it out towards the colour of the air (pale on a light style, dark on a dark one, following `map.styleLightDarkTheme`), so it reads as distance. `edgeBlur` leaves colour alone, so it reads as a lens — use it when the rim's colour still carries data. They compound if both are on.

**depthOfField** — the only **GPU** effect (a WebGL2 full-screen pass) and the only one that reads the map's **camera**. For a plane, `1/z` is affine in the screen row, so pitch + vertical FOV give the whole depth of the frame as one ramp (`2·tan(fov/2)·tan(pitch)`, normalised); the circle of confusion then grows with distance from the plane of focus, per pixel. `focus` runs 0 = nearest ground (bottom) → 1 = farthest the frame shows (top); `band` is the share of that depth held sharp; `intensity` is the widest circle of confusion in CSS px; `bokeh` decides whether a defocused highlight fades or returns as a disc.

```ts
await TerrainModule.get(map, { elevation: true });   // the relief to defocus
effects.set({ 'depthOfField.intensity': 18, 'depthOfField.focus': 0, 'depthOfField.band': 0.3, 'depthOfField.bokeh': 0.5 });
```

- **Needs `preserveDrawingBuffer: true`** on the map, like bloom and `capture()`: the pass reads the rendered map back as a texture.
- **A flat map switches it off by geometry** — ramp 0, no pass run, no pitch check anywhere. Tilt the map and it returns; the pass redraws on the map's `render`, coalesced to one draw per animation frame.
- `focus: 0` needs nothing detected: the nearest thing in a tilted frame is the bottom edge. Mid `focus` with a small `band` is the tilt-shift look.
- The same `band` holds more of the view at a gentle tilt, because it is a share of depth rather than of height.
- **Bloom reads the defocused picture** when this is on, so a blurred highlight glows as a disc rather than a pinpoint.

## Scoping bloom — `bloom.only`

A list of the colours bloom may light; entries mix freely, and `[]` (the default) lights the whole frame:

```ts
effects.set({ 'bloom.intensity': 0.9, 'bloom.only': ['traffic'] });                          // a group: every traffic colour knob
effects.set({ 'bloom.only': ['traffic.incidents.majorColor', 'traffic.incidents.closedColor'] }); // single knobs
effects.set({ 'bloom.only': ['traffic', '#1a73e8'] });                                        // + a CSS colour, e.g. a route's mainColor
```

- **Named entries**: a `StylingColorKnobId` (`stylingColorKnobIds` from `@tomtom-org/maps-sdk/map`) or a dotted group of them (`StylingColorKnobGroup`, from the plugin: `traffic`, `traffic.incidents`, `colors`, `pois`…).
  - Resolved against the loaded style, so a recolour or style switch moves the scope on its own.
  - `describe()` lists every name in the knob's `options`; any other entry must parse as a CSS colour, or `set` throws `RangeError`.
- **CSS colours** cover what the styling module does not paint: routes (`RoutingModule`'s `mainColor`), places, your own layers.
- **Colour, not layers**: anything else wearing those colours glows too.
  - A knob the style paints with an expression scopes to nothing: bloom lights everything, with one console warning.
  - The TomTom styles give flow and incidents one palette (`traffic.flow.stationaryColor` *is* `traffic.incidents.majorColor`), so `traffic.flow` also keys those incidents.
- **Brightness is not compared** (`bloom.threshold` owns level); `bloom.onlyTolerance` covers antialiased edges.
  - A scope usually wants a **lower `bloom.threshold`**: `monoDark`'s major jam `hsl(0, 100%, 28%)` keeps 64/255 above a `0.45` cut, 110/255 above `0.25`.

## Catalogue — `describe()`

Same descriptor shape as `StylingModule.describe()` (`id, kind, description, default, current, overridden, range, options, available, appliesTo`) plus `useCase`. A panel or agent tool built for the styling catalogue reads it unchanged.

```ts
for (const knob of effects.describe().knobs) { /* knob.kind is 'number' or 'color' */ }
```

## Capture (high-DPI)

```ts
const canvas = await effects.capture({ pixelRatio: 3 }); // map + effects, re-rendered at 3×
canvas.toBlob((blob) => upload(blob), 'image/png');
```

Re-renders (never resamples), waits for `idle`, reads back, restores the device ratio. MapLibre clamps to `maxCanvasSize` — measure `canvas.width / map.mapLibreMap.getCanvas().clientWidth` for the ratio you actually got.

## Gotchas

- Without `preserveDrawingBuffer: true`, bloom is blank, the depth of field does nothing, and capture returns an empty map.
- Effects are DOM overlays under the map controls with `pointer-events: none`; they do not affect hit-testing or SDK events.
- Effects change the *frame*, `StylingModule` changes the *style*; compose them (e.g. `styling.applyPreset('data-viz')` + `effects.set({ 'grade.saturation': 0.4 })`).
- Bloom redraws on every map `render` (coalesced per animation frame) at a quarter of the pixels; keep `bloom.radius` moderate on large canvases.
