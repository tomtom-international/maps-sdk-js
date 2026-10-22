# Map Effects Plugin

This plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) adds practical post-processing to a `TomTomMap`. It computes its effects from the rendered map's own pixels, so they work on every style and survive every style release. Editing the style can't reproduce them.

> **Public preview.** This plugin is in [Public Preview](https://docs.tomtom.com/legal/public-preview) until its 1.0.0 release.

Every effect is off by default. Here is each one, with the problem it solves:

| Effect | Knobs | Solves |
| --- | --- | --- |
| Bloom | `bloom.intensity`, `bloom.radius`, `bloom.threshold`, `bloom.only`, `bloom.onlyTolerance` | Emphasis on dark and driving styles. Lit roads, traffic tubes and route lines glow, optionally only in the colours `bloom.only` lists |
| Glare | `glare.intensity`, `glare.length`, `glare.rays`, `glare.angle`, `glare.threshold`, `glare.only`, `glare.onlyTolerance` | Lights that read as lights. The colours `glare.only` lists, the major roads by default, cast streaks as street lamps do through a lens |
| Grade | `grade.brightness`, `grade.contrast`, `grade.saturation` | Muting the base map under a data overlay |
| Tint | `tint.color`, `tint.opacity` | Muting the base map, or matching a brand |
| Fog | `fog.intensity`, `fog.reach`, `fog.color` | Depth cue and de-emphasis of far context, in the air of the map's theme or a colour of your own |
| Edge blur | `edgeBlur.intensity`, `edgeBlur.reach` | Focus on the centre of the view |
| Depth of field | `depthOfField.intensity`, `depthOfField.focus`, `depthOfField.band`, `depthOfField.bokeh` | Depth on a tilted map. A GPU pass blurs more with distance and returns highlights as discs. A flat map has no depth, so the effect ends there |
| Vignette | `vignette.intensity`, `vignette.reach` | Focus on the centre of the view |

Your own stylisation, such as a watercolour or a posterise, runs inside the same GPU chain with `addPass(pass)`. Every effect above then works on your picture. Your own 2D layer, such as a paper texture or film grain, takes a place between the effects with `addLayer(layer)`, and `capture()` keeps it there.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/map-effects
- Example: https://docs.tomtom.com/maps-sdk-js/examples/map-effects-playground
- Example with a pass and a layer of your own: https://docs.tomtom.com/maps-sdk-js/examples/mixed-map-effects

## Quickstart

This plugin declares `@tomtom-org/maps-sdk` and `maplibre-gl` as peer dependencies, so install both in your project too.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl @tomtom-org/maps-sdk-plugin-map-effects
```

1. Follow the SDK [Project setup](https://docs.tomtom.com/maps-sdk-js/introduction/project-setup) or the Map [quickstart](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart) to create and initialize a `TomTomMap`. The effects draw in the same frame as the map, so it needs no `preserveDrawingBuffer`.

2. Import and use the plugin:

```ts
import { setKnob } from '@tomtom-org/maps-sdk/map';
import { effectKnobCatalogue, MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';

// assume `map` is your initialized TomTomMap instance
const effects = new MapEffects(map);

// A quiet base under your own data layers:
effects.updateConfig({ grade: { saturation: 0.4, brightness: 0.85 }, tint: { opacity: 0.15 } });

// Emphasis on a dark style:
effects.updateConfig({ bloom: { intensity: 0.5, threshold: 0.6 } });

// One knob by its id, from a control or a language model, the others kept:
setKnob(effects, effectKnobCatalogue, 'bloom.threshold', 0.4);

effects.resetConfig();                    // everything off
await effects.capture({ pixelRatio: 3 }); // map + effects as a canvas, for print
```

## License

See `LICENSE.txt`.

## Security

To report a security vulnerability, follow our [security policy](https://github.com/tomtom-international/maps-sdk-js/security/policy), which keeps it private.
