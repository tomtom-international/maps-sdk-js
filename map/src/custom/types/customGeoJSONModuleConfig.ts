import type { FeatureCollection } from 'geojson';
import type { StyleImageInterface, StyleImageMetadata } from 'maplibre-gl';
import type { GeoJSONSourceClusterOptions, LayerSpecWithSource, MapModuleCommonConfig } from '../../shared';

// Distributes Omit over a union so each variant retains its variant-specific keys
// (e.g. `filter` on circle/line/symbol but not on background).
type DistributiveOmit<T, K extends string> = T extends unknown ? Omit<T, K> : never;

/**
 * Any image payload accepted by MapLibre's `map.addImage`. Mirrors the parameter type
 * of that method.
 *
 * @group Custom
 */
export type CustomGeoJSONImageData =
    | HTMLImageElement
    | ImageBitmap
    | ImageData
    | StyleImageInterface
    | { width: number; height: number; data: Uint8Array | Uint8ClampedArray };

/**
 * Specification for a single custom image registered on the map by a
 * {@link CustomGeoJSONModule}. The module re-registers every image automatically after
 * every style change, so symbol layers in {@link CustomGeoJSONSourceSpec.layers} can
 * reference an image by ID and survive `setStyle` calls without extra wiring.
 *
 * @group Custom
 */
export type CustomGeoJSONImageSpec = {
    /**
     * The image data, in any format accepted by MapLibre's `addImage`. Asynchronous
     * sources (URLs, SVG strings) are not supported here — pre-load them and pass an
     * `HTMLImageElement` (or `ImageBitmap`/`ImageData`) instead.
     */
    image: CustomGeoJSONImageData;

    /**
     * MapLibre image metadata: `pixelRatio`, `sdf`, `stretchX`, `stretchY`, `content`.
     * Forwarded verbatim to `addImage`.
     */
    options?: Partial<StyleImageMetadata>;
};

/**
 * Specification for a single custom layer attached to a {@link CustomGeoJSONSourceSpec}.
 *
 * Equivalent to a MapLibre layer specification (one of `circle`, `line`, `fill`,
 * `symbol`, `heatmap`, …) with `source` and `id` removed, and an optional `beforeID`
 * for ordering. The variant is preserved by `type`, so variant-specific properties
 * (`filter`, `layout`, `paint`, …) keep their narrow types.
 *
 * `id` is auto-generated as `${sourceID}-layer-${layerIndex}` when omitted. Provide
 * an explicit ID when you want to refer to the layer from outside the module
 * (e.g. to remove it via {@link applyConfig}), or when the layer set is expected to
 * change at runtime and you want a stable identity that is independent of array order.
 *
 * `beforeID` is the ID of an existing map layer the new layer should be inserted
 * before — see MapLibre's `addLayer`.
 *
 * @group Custom
 */
export type CustomGeoJSONLayerSpec = DistributiveOmit<LayerSpecWithSource, 'source' | 'id'> & {
    id?: string;
    beforeID?: string;
};

/**
 * Configuration for one logical source managed by a {@link CustomGeoJSONModule}.
 *
 * Each entry corresponds to a single MapLibre GeoJSON source plus its associated layers.
 *
 * @group Custom
 */
export type CustomGeoJSONSourceSpec = {
    /**
     * Optional MapLibre source ID. Auto-generated as
     * `custom-geojson-${instanceIndex}-${sourceName}` when absent.
     */
    sourceID?: string;

    /**
     * The layers that render this source. At least one layer is required for the source
     * to be visible on the map.
     */
    layers: CustomGeoJSONLayerSpec[];

    /**
     * MapLibre cluster options, forwarded verbatim to the underlying GeoJSON source.
     *
     * @remarks
     * Cluster options are applied at source creation time and cannot be changed via
     * {@link applyConfig}. To change clustering, recreate the module.
     */
    cluster?: GeoJSONSourceClusterOptions;
};

/**
 * Configuration for the {@link CustomGeoJSONModule}.
 *
 * @typeParam TSources - A record describing each source name and the
 * {@link FeatureCollection} type it carries. When omitted, every source defaults to
 * `FeatureCollection`.
 *
 * @example
 * ```typescript
 * type MySources = {
 *     buildings: FeatureCollection<Point, { name: string }>;
 *     parks: FeatureCollection<Polygon>;
 * };
 *
 * const config: CustomGeoJSONModuleConfig<MySources> = {
 *     sources: {
 *         buildings: { layers: [{ type: 'circle', paint: { 'circle-radius': 4 } }] },
 *         parks: { layers: [{ type: 'fill', paint: { 'fill-color': '#5a5' } }] },
 *     },
 * };
 * ```
 *
 * @group Custom
 */
export type CustomGeoJSONModuleConfig<
    TSources extends Record<string, FeatureCollection> = Record<string, FeatureCollection>,
> = MapModuleCommonConfig & {
    /**
     * The sources, keyed by an arbitrary user-defined name, that this module manages.
     *
     * @remarks
     * The set of source names is fixed at module creation time. Calling
     * {@link applyConfig} with new source names or omitting existing ones is **not**
     * supported — only the layer specs and visibility of existing sources can be
     * updated at runtime.
     */
    sources: { [K in keyof TSources]: CustomGeoJSONSourceSpec };

    /**
     * Custom images to register on the map by ID. The module adds each image during
     * setup, before any source or layer is created, and re-adds every image after every
     * style change — so symbol layers referencing an image via `icon-image: '<id>'`
     * survive `setStyle` calls automatically.
     *
     * @remarks
     * - Existing images on the map are not overwritten — the module skips IDs for
     *   which `map.hasImage(id)` is already `true`.
     * - Only synchronous MapLibre image payloads are supported. URLs and raw SVG
     *   strings must be loaded by the caller before being passed in.
     * - `applyConfig` re-runs image registration **additively**: new IDs are added,
     *   already-present IDs are skipped, and removing an entry from `images` does
     *   not unregister it from the map (other layers may still reference it).
     *
     * @example
     * ```typescript
     * const config: CustomGeoJSONModuleConfig = {
     *     sources: {
     *         markers: { layers: [{ type: 'symbol', layout: { 'icon-image': 'my-marker' } }] },
     *     },
     *     images: {
     *         'my-marker': { image: myImageBitmap, options: { pixelRatio: 2 } },
     *     },
     * };
     * ```
     */
    images?: Record<string, CustomGeoJSONImageSpec>;

    /**
     * Initial visibility for all layers across all sources. Defaults to `true`.
     *
     * @remarks
     * After `show(name, data)` is called for a source, layer visibility follows the
     * data state (visible iff the feature collection is non-empty). Use
     * {@link CustomGeoJSONModule.setVisible} to override that automatic behaviour at
     * runtime.
     */
    visible?: boolean;
};
