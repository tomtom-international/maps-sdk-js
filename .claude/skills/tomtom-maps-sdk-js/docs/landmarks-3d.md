# Landmarks 3D Plugin Reference

Renders TomTom Orbis **3D Landmarks** — high-detail building meshes streamed as GLB tiles — on a `TomTomMap`, drawn with Three.js through a MapLibre custom layer and shaded to blend with the basemap's 3D buildings.

> [Private preview](https://docs.tomtom.com/legal/private-preview) — package is `@tomtom-org/maps-sdk-plugin-landmarks-3d`. Tiles need an API key with Orbis 3D Landmarks entitlements.

## Imports

```ts
import {
    Landmarks3D,
    type Landmarks3DOptions,
    type Landmarks3DConfig,
    landmarks3DKnobCatalogue,
    landmarks3DKnobIds,
    type Landmarks3DKnob,
    type Landmarks3DKnobId,
    type Landmarks3DKnobValueOf,
    // advanced: the custom layer and its tile URL, for building the layer yourself
    buildLandmarksTileURL,
    ModelsLayer,
    ModelsSource,
    type ModelsLayerSpecification,
    type ModelsSourceSpecification,
} from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
```

Guide: [Landmarks 3D plugin](https://docs.tomtom.com/maps-sdk-js/guides/plugins/landmarks-3d.md).

## Installation

```bash
npm i @tomtom-org/maps-sdk maplibre-gl @tomtom-org/maps-sdk-plugin-landmarks-3d three
```

`three`, `maplibre-gl` and `@tomtom-org/maps-sdk` are peer dependencies — the app installs them (the SDK already requires `maplibre-gl`); the plugin never bundles them.

## Quick start

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';

TomTomConfig.instance.put({ apiKey: 'YOUR_API_KEY' });

const map = new TomTomMap({
    mapLibre: { container: 'sdk-map', center: [4.9003, 52.3791], zoom: 16, pitch: 60 },
});

// The 3D city around the landmarks: buildings3D ships hidden in every standard style but the driving ones.
await BaseMapModule.get(map, { groups: { buildings3D: { visible: true } } });
// Starts rendering once the map is ready; the tile URL is built from TomTomConfig.
const landmarks = new Landmarks3D(map);
```

Use a **pitched camera** (`pitch > 0`) to see the meshes. The plugin never shows or hides `3D - Building`: its visibility is the `BaseMapModule`'s `buildings3D` group, so show it there for a 3D city context, or leave it out for landmarks alone.

## Constructor & options

`new Landmarks3D(map: TomTomMap, options?: Landmarks3DOptions)` — no `await`; rendering starts when the map becomes ready. `Landmarks3DOptions` is the knobs (`Landmarks3DConfig`) plus:

| Option | Type | Default | Meaning |
|---|---|---|---|
| `withCredentials` | `boolean` | `isProxyCredentialsMode()` | Send `credentials: 'include'` with tile requests (proxy session cookie). Not a knob: `getConfig()` leaves it out |

## Knobs

The look is a flat set of knobs, each id its key in `Landmarks3DConfig`. Every knob but `visible` **follows the base map's `3D - Building` layer while unset**, each on its own:

| Knob | Kind | Range | Unset |
|---|---|---|---|
| `visible` | toggle | — | `true` |
| `color` | color | CSS colour | the 3D buildings' `fill-extrusion-color` (a `match` uses its default operand) |
| `opacity` | number | 0–1 | the 3D buildings' `fill-extrusion-opacity` |
| `verticalGradient` | toggle | — | the 3D buildings' `fill-extrusion-vertical-gradient` |
| `minZoom` | number | 0–22 | the 3D buildings' `minzoom` |
| `maxZoom` | number | 0–22 | the 3D buildings' `maxzoom`; landmarks stay drawn up to the next whole zoom |

- **Follows the style live**: an unset knob is re-read on every MapLibre `styledata`, so it follows `setStyle`, the map colours that recolour the 3D buildings (`styling.setMapColors(...)`, a `colors.artificial`/`colors.land` knob, a map-theme theme) and a raw `setPaintProperty('3D - Building', …)`. It repaints only when the look changed. A knob set always wins.
- **Fallback**: where the style has no `3D - Building` layer (`streetSatellite`, or a custom style), or a paint value is an expression that is not one value, that knob takes the `streetLight` look, `hsl(38, 6%, 90%)`, opacity 0.7, gradient on, and the plugin's own zoom range, 10–22. Every other standard style resolves colour, opacity and gradient from its own buildings.
- Landmark tiles exist at zoom 15 only, so keep `minZoom` near 15 (see Gotchas).

## Methods

```ts
import { getKnob, resetKnob, setKnob, setKnobs } from '@tomtom-org/maps-sdk/map';

landmarks.updateConfig({ color: '#c8b28a', opacity: 0.9 }); // set some, keep the others
landmarks.applyConfig({ opacity: 1 });                      // replace all: color follows the base map again
landmarks.resetConfig();                                    // every knob follows the base map
landmarks.getConfig();                                      // the knobs set only: {}

setKnob(landmarks, landmarks3DKnobCatalogue, 'verticalGradient', false); // validated; RangeError when refused
setKnobs(landmarks, landmarks3DKnobCatalogue, { color: '#1d3f8a', maxZoom: 20 });
getKnob(landmarks, landmarks3DKnobCatalogue, 'opacity');                 // value in force: the base map's when unset
resetKnob(landmarks, landmarks3DKnobCatalogue, 'color');

landmarks.setVisible(false);            // = updateConfig({ visible: false })
landmarks.isVisible();                  // boolean

landmarks.layer;                        // the underlying ModelsLayer (advanced use)
```

`landmarks3DKnobCatalogue` entries carry `id`, `kind`, `description`, `range` and, for `visible`, `default` — static data for a UI or an agent.

## How it works

- Adds a MapLibre **custom layer** (`ModelsLayer`, id `orbis-3d-landmarks`) that fetches the GLB tiles covering the viewport and renders them with Three.js, keeping lighting in sync with the map style light.
- **Frames on demand**: the layer draws when the map draws and requests a frame only when a tile arrives, so a still map stays idle. After writing a `landmarks.layer` field yourself (`diffuseColor`, `visible`), call `map.mapLibreMap.triggerRepaint()`.
- Inserted before `mapStyleLayerIDs.poi` (on top when the style lacks it), so POIs draw over the meshes and roads stay below.
- Filters basemap extrusions flagged `has_landmark` out of `3D - Building` (through `LayerFilterComposer`), so they don't clip through the high-detail meshes. It leaves the layer's visibility to `BaseMapModule`.
- The layer, the filter and the look are all re-applied after map style changes.
- **3D terrain**: with `TerrainModule` elevation on, each landmark is lowered onto the lowest terrain under its footprint every frame, so it follows terrain tiles as they load and exaggeration changes. Nothing to configure.

## Gotchas

- **Entitlement**: tiles load only with an API key entitled for Orbis 3D Landmarks (private preview); otherwise the map renders without landmarks, and the console warns per tile that the key needs that access, with where to request it.
- **Pitch**: with a top-down camera the meshes look flat — pitch the camera.
- **Tile URL**: built automatically from `TomTomConfig` (`apiKey`, `commonBaseURL`); proxy mode (empty `apiKey`) omits the `key` param. `buildLandmarksTileURL()` is exported if you need the template directly.
- **`minZoom` far below 15**: landmark tiles exist at zoom 15 only, so each zoom level below it quadruples the tiles a view needs (16× at zoom 13), more on a pitched camera. With several maps on a page the browser runs out of connections (`ERR_INSUFFICIENT_RESOURCES`). Keep `minZoom` near 15.
- **Several maps**: one `new Landmarks3D(map)` per map, each loading its own view's tiles. Each map is a WebGL context and browsers cap them per page (16 in Chrome), so move the maps you have rather than creating more. Three.js logs `Multiple active KTX2 loaders`; harmless.
- **Framing a tall landmark**: aim at its mid-height with `centerClampedToGround: false` in the map's `mapLibre` options plus a camera `elevation` in metres. MapLibre's `flyTo`/`easeTo` keep the previous `elevation`, so move with `jumpTo({ center, elevation, … })`.
- **Peer deps**: `three` must be present in the app's dependency tree.
- **KTX2 transcoder**: landmark textures are KTX2; the Basis Universal transcoder ships with the plugin in a lazy chunk (no CDN request). A strict CSP needs `data:` in `connect-src` and `blob:` in `worker-src`. `Landmarks3D` always uses the bundled copy; to serve your own, build `new ModelsLayer(layerSpecification, { ...sourceSpecification, transcoderPath })` with `tiles: [buildLandmarksTileURL()]` yourself.
