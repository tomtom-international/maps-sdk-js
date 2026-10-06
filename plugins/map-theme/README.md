# Map Theme Plugin

Plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) that themes a `TomTomMap` from wherever a look comes from: a brand's colours, a website's, a described mood, an artist's palette, or an image. It assigns them to the SDK's ten map colours plus the accent routes, geometries and pins take; `StylingFoundationsModule.setMapColors` applies them.

| Function | From | To |
| --- | --- | --- |
| `deriveMapColors` | A handful of CSS colours | The map colours, `accent` included |
| `deriveMapColorsFromCss` | A stylesheet's text — a website's CSS, design tokens, an uploaded `.css` file | The map colours, through the colours it paints with most |
| `cssColors` | A stylesheet's text | Hex colours, most used first |
| `deriveMapColorsFromImage` | An image — `File`, `Blob`, `<img>`, `ImageBitmap`, CORS-readable URL or raw pixels | The map colours, through its dominant colours |
| `dominantColors` | Raw pixels | Hex colours, largest area first |
| `mapColorsLightDark` | The map colours | `'light'` or `'dark'`: switch to a style of the same (`streetDark` for a dark theme) before applying them |

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/map-theme
- Example: https://docs.tomtom.com/maps-sdk-js/examples/map-theme

## Quickstart

The plugin declares `@tomtom-org/maps-sdk` and `culori` as peer dependencies; npm 7+ and Yarn install them for you.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl @tomtom-org/maps-sdk-plugin-map-theme
```

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
