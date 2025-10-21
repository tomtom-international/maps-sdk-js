import type { BackgroundLayerSpecification, LayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { mapStyleLayerIDs } from '../layers/layerIDs';
import type { GeoJSONSourceWithLayers, StyleSourceWithLayers } from '../SourceWithLayers';

/**
 * Layer specification that supports a data source.
 * @ignore
 */
export type LayerSpecWithSource = Exclude<LayerSpecification, BackgroundLayerSpecification>;

/**
 * Layer to be added to the existing style, and may include extra config such as the ID of the layer to add it under.
 * * e.g. GeoJSON layers.
 * @ignore
 */
export type ToBeAddedLayerSpec<L extends LayerSpecification = LayerSpecification> = L & {
    /**
     * The ID of an existing layer to insert the new layer before,
     * resulting in the new layer appearing visually beneath the existing layer.
     * If this argument is not specified, the layer will be appended to the end of the layers array
     * and appear visually above all other layers.
     * @see Map.addLayer
     */
    beforeID?: string;
};

/**
 * TomTom Maps SDK layer specifications do not come with the source ID initialized yet.
 * @ignore
 */
export type ToBeAddedLayerSpecWithoutSource<L extends LayerSpecification = LayerSpecification> = Omit<
    ToBeAddedLayerSpec<L>,
    'source'
>;

/**
 * TomTom Maps SDK layer specifications template, without ID nor source, to be still initialized in some map module.
 * @ignore
 */
export type LayerSpecTemplate<L extends LayerSpecification> = Omit<L, 'id' | 'source'>;

/**
 * @ignore
 */
export type SymbolLayerSpecWithoutSource = Omit<SymbolLayerSpecification, 'source'>;

/**
 * Function signature to filter layers.
 * @ignore
 */
export type LayerSpecFilter = (layerSpec: LayerSpecification) => boolean;

/**
 * TomTom Maps SDK layer specifications template, without ID nor source, to be still initialized in some map module.
 * @ignore
 */
export type SourceWithLayers = StyleSourceWithLayers | GeoJSONSourceWithLayers;

/**
 * @ignore
 */
export type SourcesWithLayers = { [name: string]: SourceWithLayers };

/**
 * Contains the IDs of a source and its related layers.
 *
 * @remarks
 * This type provides a convenient way to reference a MapLibre source and all its associated
 * layers. Using these IDs, you can customize the source and layers directly through the
 * MapLibre API.
 *
 * **Common Use Cases:**
 * - Accessing layers for custom styling
 * - Modifying layer properties at runtime
 * - Removing or updating data sources
 * - Debugging layer hierarchies
 *
 * @example
 * ```typescript
 * // Get source and layer IDs from a module
 * const { sourceID, layerIDs } = routeModule.getSourceWithLayerIDs();
 *
 * // Update layer paint properties
 * for (const layerID of layerIDs) {
 *   map.setPaintProperty(layerID, 'line-opacity', 0.5);
 * }
 *
 * // Remove all layers and source
 * layerIDs.forEach(id => map.removeLayer(id));
 * map.removeSource(sourceID);
 * ```
 *
 * @group Shared
 */
export type SourceWithLayerIDs = {
    /**
     * The unique identifier of the MapLibre data source.
     *
     * @remarks
     * Use this ID to access or modify the source via MapLibre's source API.
     *
     * @example
     * ```typescript
     * const source = map.getSource(sourceID);
     * ```
     */
    sourceID: string;

    /**
     * Array of layer IDs associated with this source.
     *
     * @remarks
     * All layers in this array use the same source. The order typically represents
     * the rendering order, but check the actual map style for definitive ordering.
     *
     * @example
     * ```typescript
     * // Hide all layers from this source
     * layerIDs.forEach(id => {
     *   map.setLayoutProperty(id, 'visibility', 'none');
     * });
     * ```
     */
    layerIDs: string[];
};

/**
 * Known layer ID from the TomTom map style.
 *
 * @remarks
 * These are predefined layer IDs that exist in the TomTom vector map style.
 * Use these constants when you need to position custom layers relative to
 * standard map layers (e.g., placing a layer below labels).
 *
 * **Available Layer IDs include:**
 * - Label layers (e.g., `'lowestLabel'`, `'POI'`)
 * - Road layers (e.g., `'Road'`, `'Motorway'`)
 * - Building layers (e.g., `'Building'`)
 * - And many more defined in the style
 *
 * @example
 * ```typescript
 * // Add a custom layer below POI labels
 * const beforeLayer: MapStyleLayerID = 'POI';
 * map.addLayer({
 *   id: 'my-custom-layer',
 *   type: 'fill',
 *   source: 'my-source'
 * }, beforeLayer);
 *
 * // Position geometry below all labels
 * const geometryConfig = {
 *   beforeLayerConfig: 'lowestLabel' as MapStyleLayerID
 * };
 * ```
 *
 * @see {@link mapStyleLayerIDs} for the complete list of available layer IDs
 *
 * @group Shared
 */
export type MapStyleLayerID = keyof typeof mapStyleLayerIDs;

/**
 * Layer specifications with optional positioning for custom layer ordering.
 *
 * @typeParam L - The MapLibre layer specification type (defaults to any LayerSpecification)
 *
 * @remarks
 * This type allows you to define custom layers with precise control over their
 * rendering order in the map's layer stack. Each layer can optionally specify
 * another layer to be positioned above.
 *
 * **Layer Ordering:**
 * - Layers are rendered in order from bottom to top
 * - Use `beforeID` to insert a layer before (below) an existing layer
 * - Omit `beforeID` to place the layer on top of all existing layers
 *
 * **Use Cases:**
 * - Customizing route visualization layers
 * - Creating themed map overlays
 * - Building custom traffic or POI visualizations
 * - Layering multiple data visualizations with precise z-order control
 *
 * @example
 * ```typescript
 * // Define custom route layers with specific ordering
 * const customLayers: LayerSpecsWithOrder<LineLayerSpecification> = [
 *   {
 *     id: 'route-casing',
 *     layerSpec: {
 *       type: 'line',
 *       paint: {
 *         'line-color': '#000',
 *         'line-width': 10
 *       }
 *     },
 *     beforeID: 'lowestLabel' // Place below labels
 *   },
 *   {
 *     id: 'route-line',
 *     layerSpec: {
 *       type: 'line',
 *       paint: {
 *         'line-color': '#0080FF',
 *         'line-width': 6
 *       }
 *     },
 *     beforeID: 'lowestLabel' // Also below labels, but above casing
 *   }
 * ];
 *
 * // Custom symbol layers for waypoints
 * const waypointLayers: LayerSpecsWithOrder<SymbolLayerSpecification> = [
 *   {
 *     id: 'waypoint-icons',
 *     layerSpec: {
 *       type: 'symbol',
 *       layout: {
 *         'icon-image': 'waypoint-marker',
 *         'icon-size': 1.5
 *       }
 *     }
 *     // No beforeID - will be on top
 *   }
 * ];
 * ```
 *
 * @group Shared
 */
export type LayerSpecsWithOrder<L extends LayerSpecification = LayerSpecification> = Array<{
    /**
     * Unique identifier for the layer.
     *
     * @remarks
     * Must be unique across all layers in the map style. Used to reference
     * the layer in MapLibre API calls.
     */
    id: string;

    /**
     * MapLibre layer specification template.
     *
     * @remarks
     * Defines the visual properties and behavior of the layer. The `id` and `source`
     * properties are omitted from the template as they are provided separately by
     * the SDK.
     *
     * @see {@link LayerSpecTemplate}
     */
    layerSpec: LayerSpecTemplate<L>;

    /**
     * ID of an existing layer to position this layer before (below).
     *
     * @remarks
     * **Positioning behavior:**
     * - If specified: Layer is inserted before the referenced layer (appears below it)
     * - If omitted: Layer is added on top of all existing layers
     *
     * **Tips:**
     * - Use {@link MapStyleLayerID} constants for TomTom style layers
     * - Use `'lowestLabel'` to place below all text labels
     * - Use `'POI'` to place below POI icons
     *
     * @example
     * ```typescript
     * // Place below all labels
     * beforeID: 'lowestLabel'
     *
     * // Place below POI layer
     * beforeID: 'POI'
     *
     * // Place on top (omit beforeID)
     * // beforeID: undefined
     * ```
     */
    beforeID?: string;
}>;
