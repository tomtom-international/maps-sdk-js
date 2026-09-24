# Map Effects Plugin

Plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) that adds practical post-processing to a `TomTomMap`: effects computed from the rendered map's own pixels, so they work on every style (custom ones included), survive every style release, and cannot be reproduced by editing the style.

Every effect is named by the problem it solves, and off by default:

| Effect | Knobs | Solves |
| --- | --- | --- |
| Bloom | `bloom.intensity`, `bloom.radius`, `bloom.threshold` | Emphasis on dark and driving styles — lit roads, traffic tubes, route lines glow |
| Grade | `grade.brightness`, `grade.contrast`, `grade.saturation` | Muting the base map under a data overlay |
| Tint | `tint.color`, `tint.opacity` | Muting the base map; matching a brand |
| Fog | `fog.intensity`, `fog.reach` | Depth cue and de-emphasis of far context |
| Edge blur | `edgeBlur.intensity`, `edgeBlur.reach` | Focus on the centre of the view |
| Vignette | `vignette.intensity`, `vignette.reach` | Focus on the centre of the view |

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/map-effects
- Example: https://docs.tomtom.com/maps-sdk-js/examples/map-effects-playground

## Quickstart

Note: this plugin declares `@tomtom-org/maps-sdk` and `maplibre-gl` as peer dependencies — ensure both are installed in your project.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl @tomtom-org/maps-sdk-plugin-map-effects
```

1. Follow the SDK [Project setup](https://docs.tomtom.com/maps-sdk-js/guides/introduction/project-setup) or the Map [quickstart](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart) to create and initialize a `TomTomMap`. For bloom and capture, create it with `mapLibre: { canvasContextAttributes: { preserveDrawingBuffer: true } }`.

2. Import and use the plugin:

```ts
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';

// assume `map` is your initialized TomTomMap instance
const effects = new MapEffects(map);

// A quiet base under your own data layers:
effects.set({ 'grade.saturation': 0.4, 'grade.brightness': 0.85, 'tint.opacity': 0.15 });

// Emphasis on a dark style:
effects.set({ 'bloom.intensity': 0.5, 'bloom.threshold': 0.6 });

effects.reset();                 // everything off
effects.describe();              // the knob catalogue, same shape as StylingModule.describe()
await effects.capture({ pixelRatio: 3 }); // map + effects as a canvas, for print
```

## License

See `LICENSE.txt`.
