# Landmarks 3D Plugin Reference

Renders TomTom Orbis **3D Landmarks** — high-detail building meshes streamed as GLB tiles — on a `TomTomMap`, drawn with Three.js through a MapLibre custom layer and shaded to blend with the basemap's 3D buildings.

> Private preview — package is `@tomtom-org/maps-sdk-plugin-landmarks-3d`. Tiles need an API key with Orbis 3D Landmarks entitlements.

## Imports

```ts
import {
    Landmarks3D,
    type Landmarks3DOptions,
    type Landmarks3DDisplayMode,
} from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
```

## Installation

```bash
npm i @tomtom-org/maps-sdk @tomtom-org/maps-sdk-plugin-landmarks-3d three
```

`three` and `@tomtom-org/maps-sdk` are peer dependencies — the app installs both; the plugin never bundles them.

## Quick start

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';

TomTomConfig.instance.put({ apiKey: 'YOUR_API_KEY' });

const map = new TomTomMap({
    mapLibre: { container: 'sdk-map', center: [4.9003, 52.3791], zoom: 16, pitch: 60 },
});

// Starts rendering once the map is ready; the tile URL is built from TomTomConfig.
const landmarks = new Landmarks3D(map);
```

Use a **pitched camera** (`pitch > 0`) to see the meshes. The plugin enables the standard style's hidden `3D - Building` layer automatically, so landmarks sit in a full 3D city context.

## Constructor & options

`new Landmarks3D(map: TomTomMap, options?: Landmarks3DOptions)` — no `await`; rendering starts when the map becomes ready.

| Option | Type | Default | Meaning |
|---|---|---|---|
| `displayMode` | `'inherited' \| 'dark' \| 'light'` | `'inherited'` | How landmarks are shaded (see below) |
| `visible` | `boolean` | `true` | Initial visibility |
| `minZoom` | `number` | basemap 3D building layer's min (≈10) | Zoom at which landmarks appear |
| `maxZoom` | `number` | basemap 3D building layer's max (≈22) | Zoom at which landmarks disappear |

When `minZoom`/`maxZoom` are omitted the range tracks the basemap 3D building layer, so landmarks appear and disappear together with it.

## Display modes

Every mode renders landmarks as maplibre-style fill-extrusion buildings.

- `inherited` (default) — mirrors the **colour** of the basemap 3D building layer, so landmarks blend in.
- `dark` — the 3D-building look of the standard dark style.
- `light` — the 3D-building look of the standard light style.

## Methods

```ts
await landmarks.setDisplayMode('dark'); // change shading at runtime
landmarks.getDisplayMode();             // 'inherited' | 'dark' | 'light'

await landmarks.setVisible(false);      // hide / show
landmarks.isVisible();                  // boolean

landmarks.layer;                        // the underlying ModelsLayer (advanced use)
```

## How it works

- Adds a MapLibre **custom layer** (`ModelsLayer`) that fetches the GLB tiles covering the viewport and renders them with Three.js, keeping lighting in sync with the map style light.
- Shows the standard style's hidden `3D - Building` layer for city context, and filters basemap extrusions flagged `has_landmark` out of that layer so they don't clip through the high-detail meshes.
- The layer, its visibility, and the filter are all re-applied after map style changes.

## Gotchas

- **Entitlement**: tiles load only with an API key entitled for Orbis 3D Landmarks (private preview); otherwise the map renders without landmarks.
- **Pitch**: with a top-down camera the meshes look flat — pitch the camera.
- **Tile URL**: built automatically from `TomTomConfig` (`apiKey`, `commonBaseURL`); proxy mode (empty `apiKey`) omits the `key` param. `buildLandmarksTileURL()` is exported if you need the template directly.
- **Peer deps**: `three` must be present in the app's dependency tree.
