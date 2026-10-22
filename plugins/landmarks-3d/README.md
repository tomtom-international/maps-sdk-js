# Landmarks 3D Plugin

This plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) renders TomTom Orbis 3D Landmarks on a `TomTomMap` with Three.js. The landmarks are high-detail building meshes, streamed as tiles. It also draws the base map's own buildings in 3D, with windows, lights and shadows.

> **Private Preview.** The [Orbis 3D Landmarks API](https://developer.tomtom.com/map-display-api/documentation/tomtom-orbis-maps/3d/landmarks) is in Private Preview, so your API key needs Orbis 3D Landmarks entitlements. `Buildings3D` is in [Public Preview](https://docs.tomtom.com/legal/public-preview) and works with any key.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d
- Example: https://docs.tomtom.com/maps-sdk-js/examples/landmarks-3d-plugin
- 3D buildings example: https://docs.tomtom.com/maps-sdk-js/examples/buildings-3d-plugin-playground

## Features

- Streams 3D landmark tiles for the current viewport.
- Hides basemap extruded buildings flagged with `has_landmark` so they don't clip through the landmark meshes.
- Shades the landmarks like the base map's 3D buildings, and follows whatever restyles them, such as the map colours. Set a knob, such as `color` or `opacity`, for a look of your own.
- Restores itself automatically across map style changes.
- Draws the base map's buildings in 3D with procedural facades, a light that casts shadows and lit windows at night, with a preset for every standard style.

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

`new Landmarks3D(map, { color, texture, opacity, verticalGradient, visible, minZoom, maxZoom })` sets the same knobs up front. Each one you leave out follows the base map's 3D buildings, zoom range included. Set `texture: 'color'` to draw each landmark in its own colours, still lit by the map's light.

### 3D buildings

`Buildings3D` draws the base map's buildings with windows on their walls, a sun or a moon that casts shadows, and windows lit from inside on a dark map. A preset per standard style sets its look, and every part of it is a knob you can set. With `Landmarks3D` on the same map, the landmarks take the buildings' sun, sky and wall colour, with their own stonework and windows as facade detail, or their own colours with `texture: 'color'`.

```ts
import { Buildings3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';

const buildings = new Buildings3D(map); // takes the place of the style's own 3D buildings

// optional: glass towers under a low evening sun
buildings.updateConfig({ facade: { pattern: 'glass' }, light: { direction: 260, altitude: 12 } });
```

## License

See `LICENSE.txt`.

## Security

To report a security vulnerability, follow our [security policy](https://github.com/tomtom-international/maps-sdk-js/security/policy), which keeps it private.
