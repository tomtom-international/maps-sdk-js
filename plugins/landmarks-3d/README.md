# Landmarks 3D Plugin

Plugin for the [TomTom Maps SDK for Javascript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) that renders TomTom Orbis 3D Landmarks — high-detail building meshes streamed as tiles — on a `TomTomMap` using Three.js.

> **Private Preview**: the [Orbis 3D Landmarks API](https://developer.tomtom.com/map-display-api/documentation/tomtom-orbis-maps/3d/landmarks) is in Private Preview. Your API key needs Orbis 3D Landmarks entitlements.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d
- Example: https://docs.tomtom.com/maps-sdk-js/examples/landmarks-3d-plugin

## Features

- Streams 3D landmark tiles for the current viewport.
- Shows the basemap 3D building layer (hidden by default in the standard styles) for full 3D city context.
- Hides basemap extruded buildings flagged with `has_landmark` so they don't clip through the landmark meshes.
- Display modes: `inherited` (default, mirrors the basemap building colour/opacity), `dark`, and `light`.
- Restores itself automatically across map style changes.

## Quickstart

Note: this plugin declares `@tomtom-org/maps-sdk` and `three` as peer dependencies — ensure both are installed in your project.

```bash
npm install @tomtom-org/maps-sdk maplibre-gl three @tomtom-org/maps-sdk-plugin-landmarks-3d
```

1. Follow the SDK [Project setup](https://docs.tomtom.com/maps-sdk-js/guides/introduction/project-setup) or the Map [quickstart](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart) to create and initialize a `TomTomMap`. Use a pitched camera for the best result; the plugin enables the standard style's 3D building layer automatically.

2. Import and use the plugin (plugin-specific steps only):

```ts
import { Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';

// assume `map` is your initialized TomTomMap instance
const landmarks = new Landmarks3D(map);

// optional: change how landmarks blend with the base map
await landmarks.setDisplayMode('inherited');
```

## License

See `LICENSE.txt`.
