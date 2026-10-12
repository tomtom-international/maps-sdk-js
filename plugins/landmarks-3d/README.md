# Landmarks 3D Plugin

This plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) renders TomTom Orbis 3D Landmarks on a `TomTomMap` with Three.js. The landmarks are high-detail building meshes, streamed as tiles.

> **Private Preview.** The [Orbis 3D Landmarks API](https://developer.tomtom.com/map-display-api/documentation/tomtom-orbis-maps/3d/landmarks) is in Private Preview, so your API key needs Orbis 3D Landmarks entitlements.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d
- Example: https://docs.tomtom.com/maps-sdk-js/examples/landmarks-3d-plugin

## Features

- Streams 3D landmark tiles for the current viewport.
- Shows the basemap 3D building layer (hidden by default in the standard styles) for full 3D city context.
- Hides basemap extruded buildings flagged with `has_landmark` so they don't clip through the landmark meshes.
- Three display modes: `inherited` (the default, mirrors the basemap building colour and opacity), `dark` and `light`.
- Restores itself automatically across map style changes.

## Quickstart

This plugin declares `@tomtom-org/maps-sdk`, `maplibre-gl` and `three` as peer dependencies, so install all three in your project too.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl three @tomtom-org/maps-sdk-plugin-landmarks-3d
```

1. Follow the SDK [Project setup](https://docs.tomtom.com/maps-sdk-js/introduction/project-setup) or the Map [quickstart](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart) to create and initialize a `TomTomMap`. For the best result, use a pitched camera. The plugin turns on the standard style's 3D building layer for you.

2. Import and use the plugin (plugin-specific steps only):

```ts
import { Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';

// assume `map` is your initialized TomTomMap instance
const landmarks = new Landmarks3D(map);

// optional: give the landmarks the dark style's building look instead of the base map's
await landmarks.setDisplayMode('dark');

// optional: hide them, and bring them back with setVisible(true)
await landmarks.setVisible(false);
```

`new Landmarks3D(map, { displayMode, visible, minZoom, maxZoom })` sets the same options up front. By default, the zoom range matches that of the base map's 3D building layer.

## License

See `LICENSE.txt`.
