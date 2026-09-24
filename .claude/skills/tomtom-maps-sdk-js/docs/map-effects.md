# Map Effects Plugin Reference

Practical post-processing over a `TomTomMap`, computed from the rendered pixels — style-independent, works on custom styles, survives style releases. Package `@tomtom-org/maps-sdk-plugin-map-effects`. Use it for **muting the base map under data**, **emphasis on dark/driving styles (bloom)** and **focus (fog, edge blur, vignette)** — never for "artistic" looks.

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
        // REQUIRED for bloom and capture (they read the canvas back). The plugin warns once if missing.
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
| grade | `grade.brightness`, `grade.contrast` / `grade.saturation` | 0.5–1.5 / 0–1.5 | 1 |
| tint | `tint.color` / `tint.opacity` | colour / 0–1 | `#1f2937` / 0 (off) |
| fog | `fog.intensity`, `fog.reach` | 0–1 | 0 (off), 0.4 |
| edgeBlur | `edgeBlur.intensity` / `edgeBlur.reach` | 0–30 px / 0–1 | 0 (off) / 0.5 |
| vignette | `vignette.intensity` (− darkens, + lightens) / `vignette.reach` | −1–1 / 0–1 | 0 (off) / 0.45 |

**fog vs edgeBlur** — both blur the rim and take a `reach`; the difference is the rim's colour. `fog` also washes it out towards the colour of the air (pale on a light style, dark on a dark one, following `map.styleLightDarkTheme`), so it reads as distance. `edgeBlur` leaves colour alone, so it reads as a lens — use it when the rim's colour still carries data. They compound if both are on.

## Catalogue — `describe()`

Same descriptor shape as `StylingModule.describe()` (`id, kind, description, default, current, overridden, range, available, appliesTo`) plus `useCase`. A panel or agent tool built for the styling catalogue reads it unchanged.

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

- Without `preserveDrawingBuffer: true`, bloom is blank and capture returns an empty map.
- Effects are DOM overlays under the map controls with `pointer-events: none`; they do not affect hit-testing or SDK events.
- Effects change the *frame*, `StylingModule` changes the *style*; compose them (e.g. `styling.applyPreset('data-viz')` + `effects.set({ 'grade.saturation': 0.4 })`).
- Bloom redraws on every map `render` (coalesced per animation frame) at a quarter of the pixels; keep `bloom.radius` moderate on large canvases.
