# Landmarks 3D Plugin

This plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) renders TomTom Orbis 3D Landmarks on a `TomTomMap` with Three.js. The landmarks are high-detail building meshes, streamed as tiles.

> **Private Preview.** The [Orbis 3D Landmarks API](https://developer.tomtom.com/map-display-api/documentation/tomtom-orbis-maps/3d/landmarks) is in Private Preview, so your API key needs Orbis 3D Landmarks entitlements.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d
- Example: https://docs.tomtom.com/maps-sdk-js/examples/landmarks-3d-plugin

## Features

- Streams 3D landmark tiles for the current viewport.
- Hides basemap extruded buildings flagged with `has_landmark` so they don't clip through the landmark meshes.
- Shades the landmarks like the base map's 3D buildings, and follows whatever restyles them, such as the map colours. Set a knob, such as `color` or `opacity`, for a look of your own.
- Restores itself automatically across map style changes.

## Quickstart

This plugin declares `@tomtom-org/maps-sdk`, `maplibre-gl` and `three` as peer dependencies, so install all three in your project too.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl three @tomtom-org/maps-sdk-plugin-landmarks-3d
```

1. Follow the SDK [Project setup](https://docs.tomtom.com/maps-sdk-js/introduction/project-setup) or the Map [quickstart](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart) to create and initialize a `TomTomMap`. For the best result, use a pitched camera.

2. Import and use the plugin (plugin-specific steps only):

```ts
import { BaseMapModule } from '@tomtom-org/maps-sdk/map';
import { Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';

// assume `map` is your initialized TomTomMap instance
// the 3D city around the landmarks, hidden in most standard styles
await BaseMapModule.get(map, { groups: { buildings3D: { visible: true } } });
const landmarks = new Landmarks3D(map);

// optional: a colour of your own, while the other knobs keep following the base map
landmarks.updateConfig({ color: '#c8b28a' });

// optional: hide them, and bring them back with setVisible(true)
landmarks.setVisible(false);
```

`new Landmarks3D(map, { color, opacity, verticalGradient, visible, minZoom, maxZoom })` sets the same knobs up front. Each one you leave out follows the base map's 3D buildings, zoom range included.

## License

See `LICENSE.txt`.
