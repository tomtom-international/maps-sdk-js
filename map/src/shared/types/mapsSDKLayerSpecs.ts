import type {
    BackgroundLayerSpecification,
    CircleLayerSpecification,
    LayerSpecification,
    LineLayerSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import type { mapStyleLayerIDs } from '../layers/layerIDs';
import type { GeoJSONSourceWithLayers, StyleSourceWithLayers } from '../SourceWithLayers';

/**
 * Layer specification that supports a data source.
 * @ignore
 */
export type LayerSpecWithSource = Exclude<LayerSpecification, BackgroundLayerSpecification>;

/**
 * @ignore
 */
export type HasBeforeID = {
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
 * Layer to be added to the existing style, and may include extra config such as the ID of the layer to add it under.
 * * e.g. GeoJSON layers.
 * @ignore
 */
export type ToBeAddedLayerSpec<L extends LayerSpecification = LayerSpecification> = L & HasBeforeID;

/**
 * Layer specification with optional positioning for custom layer ordering.
 *
 * @typeParam L - The MapLibre layer specification type (defaults to any LayerSpecification)
 *
 * @remarks
 * This type allows you to define layers with precise control over their
 * rendering order in the map's layer stack. Each layer can optionally specify
 * another layer to be positioned before/under from.
 *
 * **Layer Ordering:**
 * - Layers are rendered in order from bottom to top
 * - Use `beforeID` to insert a layer before (below) an existing layer. The provided ID will be above (so the current layer will be under 'beforeID').
 * - Omit `beforeID` to place the layer on top of all existing layers
 *
 * @group Shared
 */
export type ToBeAddedLayerSpecTemplate<L extends LayerSpecification = LayerSpecification> = LayerSpecTemplate<L> &
    HasBeforeID;

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
 * Configuration for adding custom layers to a map module based on its controlled source data.
 *
 * @group Shared
 */
export type HasAdditionalLayersConfig = {
    /**
     * Additional custom layers to be added alongside the predefined ones.
     *
     * @remarks
     * Allows for further customization by specifying extra layers that
     * complement the standard route visualization layers.
     *
     * Use these if you want to add extra visuals to a specific module part, be it lines, symbols, or any MapLibre supported layer.
     *
     * You can define 'beforeID' in the additional layers to place them under predefined ones (or other of your additional layers).
     */
    additional?: Record<
        string,
        ToBeAddedLayerSpecTemplate<SymbolLayerSpecification | LineLayerSpecification | CircleLayerSpecification>
    >;
};
