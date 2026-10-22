# Map Theme Plugin

This plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) themes a `TomTomMap` from wherever a look comes from. That's a brand's colours, a website's, a described mood, an artist's palette or an image. It assigns them to the SDK's ten map colours, plus the accent that routes, geometries and pins take. Then `StylingFoundationsModule.setMapColors` applies them.

> **Public preview.** This plugin is in [Public Preview](https://docs.tomtom.com/legal/public-preview) until its 1.0.0 release.

| Function | From | To |
| --- | --- | --- |
| `deriveMapColors` | A handful of CSS colours | The map colours, `accent` included |
| `deriveMapColorsFromCss` | A stylesheet's text — a website's CSS, design tokens, an uploaded `.css` file | The map colours, through the colours it paints with most |
| `cssColors` | A stylesheet's text | Hex colours, most used first |
| `deriveMapColorsFromImage` | An image — `File`, `Blob`, `<img>`, `ImageBitmap`, CORS-readable URL or raw pixels | The map colours, through its dominant colours |
| `dominantColors` | Raw pixels | Hex colours, largest area first |
| `mapColorsLightDark` | The map colours | `'light'` or `'dark'`. Switch to a style of the same kind (`streetDark` for a dark theme) before you apply them |

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/map-theme
- Example: https://docs.tomtom.com/maps-sdk-js/examples/map-theme

## Quickstart

This plugin declares `@tomtom-org/maps-sdk` and `culori` as peer dependencies, so install both in your project too.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl culori @tomtom-org/maps-sdk-plugin-map-theme
```

Then, with your initialized `TomTomMap` as `map` (see the SDK [Project setup](https://docs.tomtom.com/maps-sdk-js/introduction/project-setup) or the Map [quickstart](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart)):

```ts
import { StylingFoundationsModule } from '@tomtom-org/maps-sdk/map';
import { deriveMapColors, deriveMapColorsFromCss, deriveMapColorsFromImage } from '@tomtom-org/maps-sdk-plugin-map-theme';

const styling = await StylingFoundationsModule.get(map);
styling.setMapColors(deriveMapColors(['#1d3f8a', '#e63312', '#f5d000', '#111111', '#f4f1ea']));
styling.setMapColors(deriveMapColorsFromCss(await cssFileInput.files[0].text()));
styling.setMapColors(await deriveMapColorsFromImage(fileInput.files[0], { mode: 'dark' }));
```

## License

See `LICENSE.txt`.

## Security

To report a security vulnerability, follow our [security policy](https://github.com/tomtom-international/maps-sdk-js/security/policy), which keeps it private.
