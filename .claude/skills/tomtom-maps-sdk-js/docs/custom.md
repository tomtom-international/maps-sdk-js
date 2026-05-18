# Custom GeoJSON Module Reference

`CustomGeoJSONModule` renders arbitrary GeoJSON with caller-authored MapLibre layer specs, while inheriting the SDK lifecycle behaviour: style-change restoration, per-source user/module events, and managed source/layer IDs. Reach for it when no opinionated module (`PlacesModule`, `GeometriesModule`, …) fits your visualization but you still want the SDK conveniences on top of your own layers.

## Imports

```ts
import { CustomGeoJSONModule, mapStyleLayerIDs } from '@tomtom-org/maps-sdk/map';
import type { CustomGeoJSONModuleConfig, CustomGeoJSONSourceSpec } from '@tomtom-org/maps-sdk/map';
import type { FeatureCollection, Point, Polygon } from 'geojson';
```

---

## Basic usage

```ts
const module = await CustomGeoJSONModule.get(map, {
    sources: {
        points: {
            layers: [{ type: 'circle', paint: { 'circle-radius': 4, 'circle-color': '#0a3653' } }],
        },
    },
});

await module.show(featureCollection, 'points');
module.events.points.on('click', (feature, lngLat) => { /* ... */ });
```

`config.sources` is required and must contain at least one named source; each source needs at least one layer.

---

## Typed multi-source modules

Pass a generic to get type-safe `show` / `clear` / `getShown` / `events` per source name:

```ts
type Sources = {
    heatmap: FeatureCollection<Point>;
    buildings: FeatureCollection<Polygon, { name: string }>;
};

const module = await CustomGeoJSONModule.get<Sources>(map, {
    sources: {
        heatmap:   { layers: [{ type: 'heatmap', paint: { 'heatmap-radius': 12 } }] },
        buildings: { layers: [{ type: 'fill',    paint: { 'fill-color': '#5a5' } }] },
    },
});

await module.show(heatmapData, 'heatmap');     // typed FeatureCollection<Point>
await module.show(buildingsData, 'buildings'); // typed FeatureCollection<Polygon, { name: string }>
```

Without the generic, every source defaults to `FeatureCollection`.

**Same data on every source** — omit the source name to apply `data` to all sources at once. Best when every source carries the same `FeatureCollection` shape (e.g. a heatmap + markers rendering the same points):

```ts
await module.show(buildingsData); // shown on every source
```

---

## Feature IDs (auto-normalized)

The module normalizes `feature.id` and `feature.properties.id` at `show()` time, generating an index-based ID when both are missing. Important because MapLibre disables `promoteId` for clustered sources — without normalization, every clustered point has `feature.id === undefined`, and `findFeatureById` in the SDK's event pipeline collapses every click onto the first matching feature.

- Explicit `feature.id` is preserved; `properties.id` is forced to match.
- Explicit `feature.properties.id` is preserved; `feature.id` is forced to match.
- If neither is set, both default to the array index.

If you want stable, externally-meaningful IDs, set them yourself. Otherwise, leave them off — the module handles it.

## Source and layer IDs

Both source and layer IDs are optional. Auto-generation rules:

| Field           | Default                                                       |
|-----------------|---------------------------------------------------------------|
| Source ID       | `custom-geojson-${instanceIndex}-${sourceName}`               |
| Layer ID        | `${sourceID}-layer-${layerIndex}`                             |

Provide explicit IDs when you intend to mutate the layer set at runtime via `applyConfig`, or when you need a stable reference for external `queryRenderedFeatures` / `setPaintProperty` calls. The resolved IDs are available on `module.sourceAndLayerIDs`:

```ts
const ids = module.sourceAndLayerIDs;
// { points: { sourceID: '...', layerIDs: ['...'] }, heatmap: { ... } }
```

---

## Method surface

```ts
class CustomGeoJSONModule<TSources extends Record<string, FeatureCollection> = Record<string, FeatureCollection>> {
    static async get<TSources>(map: TomTomMap, config: CustomGeoJSONModuleConfig<TSources>): Promise<CustomGeoJSONModule<TSources>>;

    async show<K extends keyof TSources>(data: TSources[K], name?: K): Promise<void>;
    async clear(name?: keyof TSources): Promise<void>;
    getShown(): { [K in keyof TSources]: TSources[K] };
    setVisible(visible: boolean): void;

    applyConfig(config: CustomGeoJSONModuleConfig<TSources> | undefined): void;
    getConfig(): CustomGeoJSONModuleConfig<TSources> | undefined;

    get sourceAndLayerIDs(): Record<keyof TSources, { sourceID: string; layerIDs: string[] }>;
    get events(): { [K in keyof TSources]: CombinedEvents<MapGeoJSONFeature, CustomGeoJSONModuleConfig<TSources>, TSources[K]> };
}
```

`show()` automatically reveals layers when the feature collection is non-empty and hides them when empty. `setVisible(false)` overrides that for every layer across every source — subsequent `show()` calls will reveal them again.

---

## Events — per source

`module.events.{sourceName}` returns a `CombinedEvents` for that source covering both user interactions and module lifecycle:

```ts
const unsubscribe = module.events.points.on('click', (feature, lngLat, features) => { /* ... */ });
module.events.points.on('hover',         (feature) => { /* ... */ });
module.events.points.on('long-hover',    (feature) => { /* ... */ });
module.events.points.on('contextmenu',   (feature, lngLat) => { /* ... */ });
module.events.points.on('shown-features',(data)    => { /* ... */ });
module.events.points.on('config-change', (config)  => { /* ... */ });

unsubscribe();
module.events.points.off('click');
```

`config-change` handlers are module-wide — every source's `events` shares the same handler list. `shown-features` handlers fire only for their own source.

---

## Multiple layers per source

Order in the `layers` array reflects MapLibre draw order. Common patterns:

```ts
// Dot + label
markers: {
    layers: [
        { type: 'circle', paint: { 'circle-radius': 6, 'circle-color': '#0a3653' } },
        {
            type: 'symbol',
            layout: {
                'text-field': ['get', 'name'],
                'text-offset': [0, 1.2],
                'text-anchor': 'top',
                'text-optional': true,
            },
            paint: { 'text-color': '#0a3653', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
        },
    ],
},
```

```ts
// Fill + outline
polygons: {
    layers: [
        { type: 'fill', paint: { 'fill-color': '#5a5', 'fill-opacity': 0.3 } },
        { type: 'line', paint: { 'line-color': '#2a2', 'line-width': 2 } },
    ],
},
```

---

## Symbol layers with custom icons — `config.images`

If a symbol layer references `icon-image: 'my-icon'`, declare the image in `config.images`. The module registers each entry **before** sources/layers are created on init, and re-registers them on every style change as part of its own restoration pass — so you don't write a `StyleChangeHandler` and the symbol layer never renders against a missing image.

```ts
const module = await CustomGeoJSONModule.get(map, {
    sources: {
        markers: {
            layers: [{ type: 'symbol', layout: { 'icon-image': 'my-marker', 'text-field': ['get', 'name'] } }],
        },
    },
    images: {
        'my-marker': { image: myImageBitmap, options: { pixelRatio: 2 } },
    },
});
```

`image` accepts anything MapLibre's `addImage` accepts: `HTMLImageElement`, `ImageBitmap`, `ImageData`, `StyleImageInterface`, or `{ width, height, data: Uint8Array | Uint8ClampedArray }`. **Asynchronous sources (URLs, raw SVG strings) are not handled** — pre-load them and pass a fully loaded `HTMLImageElement` instead. `options` is the standard `Partial<StyleImageMetadata>` (`pixelRatio`, `sdf`, `stretchX`, `stretchY`, `content`), forwarded verbatim.

Images already present on the map (`map.hasImage(id) === true`) are skipped, so multiple modules registering the same icon ID is safe.

---

## Clustering

Forward MapLibre cluster options per source. Layer filters can target cluster vs non-cluster features:

```ts
incidents: {
    cluster: { cluster: true, clusterRadius: 50, clusterMaxZoom: 14 },
    layers: [
        { type: 'circle', filter: ['has', 'point_count'],         paint: { 'circle-radius': 18 } },
        { type: 'symbol', filter: ['!', ['has', 'point_count']],  layout: { 'icon-image': 'marker' } },
    ],
},
```

Cluster options are fixed at module creation; to change them, recreate the module.

---

## Updating layers at runtime via applyConfig

Layer specs live in `config.sources`, so `applyConfig` can change them. The diff is ID-based:

- Same ID present in old and new → **update** paint/layout/filter/zoom (no re-add).
- New ID only → **add** the layer.
- Old ID only → **remove** the layer.

```ts
module.applyConfig({
    sources: {
        points: {
            layers: [
                { id: 'points-dot',   type: 'circle', paint: { 'circle-radius': 6 } },
                { id: 'points-label', type: 'symbol', layout: { 'text-field': ['get', 'name'] } },
            ],
        },
    },
});
```

When you intend to mutate layers via `applyConfig`, **provide explicit `id`s**. Auto-generated IDs are position-based and shift if you reorder the array. `applyConfig` does not support adding/removing source names or changing cluster options — recreate the module for those.

---

## Style-change restoration — what you get for free

`CustomGeoJSONModule` inherits `AbstractMapModule`'s restoration. On `map.setStyle(...)`:

1. Custom images declared in `config.images` are re-registered first.
2. Sources and layers are re-added with the same IDs.
3. Last `show()` data per source is replayed automatically.
4. Event handlers (user and module) keep firing without re-registration.

You don't write a `StyleChangeHandler` yourself — declare icons in `config.images` so the module restores them too.

---

## When to use this module vs. alternatives

| Need                                              | Use                                              |
|---------------------------------------------------|--------------------------------------------------|
| Render typed TomTom-shaped points                 | `PlacesModule`                                   |
| Render polygon geometry with TomTom theming       | `GeometriesModule`                               |
| Render custom GeoJSON with SDK lifecycle on top   | **`CustomGeoJSONModule`**                        |
| One-off layer with no events or restoration       | `map.mapLibreMap.addSource` + `.addLayer` direct |

---

## Common gotchas

- **`config.sources` is required** and must contain at least one source; each source needs at least one layer.
- **Cluster options aren't mutable** via `applyConfig`. Same for source-name changes.
- **`setVisible(false)` is overridden by `show()`** — calling `show(nonEmptyData, name)` re-reveals that source's layers. Call `setVisible(false)` after the next `show` to keep them hidden.
- **Custom images go in `config.images`**, not raw `map.addImage`. The module registers them on init and re-registers them on every style change. URLs and SVG strings aren't accepted — pre-load to `HTMLImageElement`/`ImageBitmap`/`ImageData`.
- **Auto-generated layer IDs are position-based** — if you plan to mutate the layer list with `applyConfig`, give each layer a stable `id`.
- **Cluster features (synthetic) aren't in the source's shown-features list**, so the first argument to `events.{name}.on('click', …)` is `undefined` for cluster clicks. Fall back to the third argument `features[0]` (the raw MapLibre `MapGeoJSONFeature`) — it always contains the rendered cluster with `cluster: true`, `cluster_id`, `point_count`, `point_count_abbreviated`.
