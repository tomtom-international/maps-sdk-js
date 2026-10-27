# Landmarks 3D Plugin

This plugin for the [TomTom Maps SDK for JavaScript](https://docs.tomtom.com/maps-sdk-js/introduction/overview) renders TomTom Orbis 3D Landmarks on a `TomTomMap` with Three.js. The landmarks are high-detail building meshes, streamed as tiles. It also draws the base map's own buildings in 3D, with windows, lights and shadows, and gives the map's flat colours a surface: water that ripples and mirrors the sky, forests, fields, dunes and asphalt, and 3D trees on its green.

> **Private preview.** The [Orbis 3D Landmarks API](https://developer.tomtom.com/map-display-api/documentation/tomtom-orbis-maps/3d/landmarks) is in Private Preview, so your API key needs Orbis 3D Landmarks entitlements. `Buildings3D` and `GLSurfaces` are in [Public Preview](https://docs.tomtom.com/legal/public-preview) and work with any key.

## Docs & examples

- Developer guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d
- 3D landmarks guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d-landmarks
- 3D buildings guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d-buildings
- Whole 3D city example: https://docs.tomtom.com/maps-sdk-js/examples/landmarks-3d-city
- Example: https://docs.tomtom.com/maps-sdk-js/examples/landmarks-3d-plugin
- 3D buildings example: https://docs.tomtom.com/maps-sdk-js/examples/buildings-3d-plugin-playground
- Textured surfaces guide: https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d-gl-surfaces
- Textured surfaces example: https://docs.tomtom.com/maps-sdk-js/examples/gl-surfaces-playground

## Features

- Streams 3D landmark tiles for the current viewport.
- Hides basemap extruded buildings flagged with `has_landmark` so they don't clip through the landmark meshes.
- Shades the landmarks like the base map's 3D buildings, and follows whatever restyles them, such as the map colours. Set a knob, such as `color` or `opacity`, for a look of your own.
- Restores itself automatically across map style changes.
- Draws the base map's buildings in 3D with procedural facades, a light that casts shadows and lit windows at night, with a preset for every standard style. The light follows the map's own, which `GLSurfaces` shares, its trees standing in the buildings' shadows.
- Paints every building and landmark a little differently: a shade of its own, or a colour from a palette, such as brick and stucco or the map theme's own colours.
- Lights up the building or landmark under the pointer, reports it to your hover and click handlers, and paints the ones you pick by id.
- Textures the style's water, land cover, built-up ground and roads with WebGL materials in its own colours, for the season you pick, and grows 3D trees on its woods, parks and meadows.

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

`new Landmarks3D(map, { color, palette, paletteMode, paletteIntensity, variation, hover, click, texture, opacity, verticalGradient, visible, minZoom, maxZoom })` sets the same knobs up front. Left out, the colour, opacity, gradient and zoom range follow the base map's 3D buildings, and the `hover` and `click` colours the map's accent. Set `texture: 'color'` to draw each landmark in its own colours, still lit by the map's light.

### 3D buildings

`Buildings3D` draws the base map's buildings with windows on their walls, a sun or a moon that casts shadows, and windows lit from inside on a dark map. A preset per standard style sets its look, and every part of it is a knob you can set. With `Landmarks3D` on the same map, the landmarks take the buildings' sun, sky and wall colour, with their own stonework and windows as facade detail, or their own colours with `texture: 'color'`.

```ts
import { Buildings3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';

const buildings = new Buildings3D(map); // takes the place of the style's own 3D buildings

// optional: glass towers under a low evening sun
buildings.updateConfig({ facade: { pattern: 'glass' }, light: { direction: 260, altitude: 12 } });

// optional: brick and stucco walls and slate roofs, each building its own shade
buildings.updateConfig({
    walls: { palette: ['#b5654a', '#c47f5e', '#d2a98c'], variation: 0.3 },
    roofs: { palette: ['#5b6770', '#77808a'] },
});

// optional: paint the building or the landmark you click
buildings.events.on('click', (building) => buildings.setBuildingColors({ [building.id]: '#e4572e' }));
landmarks.events.on('click', (landmark) => landmarks.setLandmarkColors({ [landmark.id]: '#e4572e' }));
```

### Textured surfaces and 3D trees

`GLSurfaces` gives the flat colours of the map a surface. Lakes ripple in the wind and mirror the sky, waves roll in onto the shore, forests show sunlit tree crowns, and farmland breaks into field parcels. 3D trees grow on the woods, parks and meadows, from conifers to poplars and stone pines, leaving the paths and streams through them in view. Everything draws in the style's own colours for the season you pick, under the labels, bridges and buildings, and takes its sun from the map's light, as `Buildings3D` does.

| Surface | Drawn over | Looks like |
| --- | --- | --- |
| `water` | Lakes, rivers, streams and seas | Waves that move with the wind and roll in onto open shores, the sky mirrored towards the horizon, glints of sun |
| `ice` | Glaciers, snow and ice | Snow drifts, bare blue ice and crevasses |
| `forest` | Woodland | Broadleaf crowns and firs, with leaf clumps and shadows up close |
| `grass` | Parks, grassland, sport and outdoor areas, cemeteries | Mown lawns in stripes and flowered meadows, swaying in gusts |
| `scrub` | Shrubland and heath | Bushes in clumps, each with its shadow |
| `farmland` | Agricultural land | Field parcels with furrows, tracks and hedges |
| `sand` | Sandy land | Dunes shaded by the sun, ripples across the wind, wet sand along the water |
| `mud` | Mud flats and beds that run dry | Creeks and puddles that mirror the sky |
| `gravel` | Shingle | Banks of stones in every shade |
| `rock` | Other bare land, breakwaters | Ridged stone |
| `paving` | Squares, pedestrian streets, platforms, piers | Slabs and bricks in staggered rows |
| `urban` | Built-up areas and land-use grounds | Faint lots and stains |
| `roads` | Streets and roads, car parks, runways | Smooth asphalt, softly streaked along each road, with wheel paths up close |

```ts
import { setKnob } from '@tomtom-org/maps-sdk/map';
import { GLSurfaces } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import { glSurfacesKnobCatalogue } from '@tomtom-org/maps-sdk-plugin-landmarks-3d/knobs';

const surfaces = new GLSurfaces(map);
surfaces.updateConfig({ wind: { direction: 270, speedFactor: 2 } });
setKnob(surfaces, glSurfacesKnobCatalogue, 'surfaces.roads.intensity', 0);
```

## License

See `LICENSE.txt`.

## Security

To report a security vulnerability, follow our [security policy](https://github.com/tomtom-international/maps-sdk-js/security/policy), which keeps it private.
