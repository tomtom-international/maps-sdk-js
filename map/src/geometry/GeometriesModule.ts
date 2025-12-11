import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Point } from 'geojson';
import type { SymbolLayerSpecification } from 'maplibre-gl';
import type { SymbolLayerSpecWithoutSource, ToBeAddedLayerSpec } from '../shared';
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, mapStyleLayerIDs } from '../shared';
import { changeLayerProps, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import {
    buildGeometryLayerSpecs,
    buildGeometryTitleLayerSpec,
    prepareGeometryForDisplay,
    prepareTitleForDisplay,
} from './prepareGeometryForDisplay';
import type {
    GeometriesModuleConfig,
    GeometryBeforeLayerConfig,
    GeometryTextConfig,
} from './types/geometriesModuleConfig';

/**
 * IDs of sources and layers from a geometry module.
 */
type GeometrySourcesWithLayers = {
    geometry: GeoJSONSourceWithLayers<PolygonFeatures>;
    geometryLabel: GeoJSONSourceWithLayers<FeatureCollection<Point>>;
};

/**
 * Geometries Module for displaying polygon areas with custom styling on the map.
 *
 * This module enables visualization of geographic areas (polygons) with customizable
 * colors, borders, and labels. Ideal for displaying search results, administrative
 * boundaries, service areas, or any polygon-based geographic data.
 *
 * @remarks
 * **Features:**
 * - Display single or multiple polygon geometries
 * - Customizable fill colors and opacity
 * - Configurable borders (color, width, opacity)
 * - Optional text labels for geometries
 * - Support for data-driven styling via MapLibre expressions
 * - Layer ordering control
 * - Event handling for user interactions
 *
 * **Data Format:**
 * - Accepts GeoJSON Polygon and MultiPolygon features
 * - Supports FeatureCollection for multiple geometries
 * - Compatible with TomTom Search API geometry results
 *
 * **Styling:**
 * - Use predefined color palettes or custom colors
 * - Apply MapLibre expressions for dynamic styling
 * - Per-feature styling via feature properties
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { GeometriesModule } from '@tomtom-international/maps-sdk-js/map';
 *
 * // Initialize module
 * const geometriesModule = await GeometriesModule.get(map);
 *
 * // Display a polygon
 * await geometriesModule.show({
 *   type: 'Feature',
 *   geometry: {
 *     type: 'Polygon',
 *     coordinates: [[[4.88, 52.37], [4.89, 52.37], [4.89, 52.38], [4.88, 52.38], [4.88, 52.37]]]
 *   },
 *   properties: {
 *     title: 'Area of Interest'
 *   }
 * });
 * ```
 *
 * @example
 * Custom styling:
 * ```typescript
 * const geometriesModule = await GeometriesModule.get(map, {
 *   colorConfig: {
 *     fillColor: '#FF5733',
 *     fillOpacity: 0.3
 *   },
 *   lineConfig: {
 *     lineColor: '#C70039',
 *     lineWidth: 3
 *   },
 *   textConfig: {
 *     textField: ['get', 'name']
 *   }
 * });
 *
 * await geometriesModule.show(polygonFeatures);
 * ```
 *
 * @example
 * Multiple geometries with different colors:
 * ```typescript
 * await geometriesModule.show({
 *   type: 'FeatureCollection',
 *   features: [
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'Polygon', coordinates: [...] },
 *       properties: { color: '#FF0000', title: 'Red Zone' }
 *     },
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'Polygon', coordinates: [...] },
 *       properties: { color: '#00FF00', title: 'Green Zone' }
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * Event handling:
 * ```typescript
 * geometriesModule.events.on('click', (feature, lngLat) => {
 *   console.log('Clicked geometry:', feature.properties.title);
 *   console.log('At coordinates:', lngLat);
 * });
 *
 * geometriesModule.events.on('hover', (feature) => {
 *   showTooltip(feature.properties.title);
 * });
 * ```
 *
 * @see [Geometries Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/geometries)
 *
 * @group Geometries
 */
export class GeometriesModule extends AbstractMapModule<GeometrySourcesWithLayers, GeometriesModuleConfig> {
    private static lastInstanceIndex = -1;

    private titleLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryFillLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryOutlineLayerSpecs!: SymbolLayerSpecWithoutSource;

    private sourceID!: string;
    private fillLayerID!: string;
    private outlineLayerID!: string;

    private titleSourceID!: string;
    private titleLayerID!: string;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     *
     * @remarks
     * **Configuration Options:**
     * - `colorConfig`: Fill color and opacity settings
     * - `lineConfig`: Border/outline styling
     * - `textConfig`: Label display configuration
     * - `beforeLayerConfig`: Layer ordering (place above/below other layers)
     *
     * **Multiple Instances:**
     * You can create multiple GeometriesModule instances on the same map,
     * each managing different sets of geometries with different styles.
     *
     * @example
     * Default initialization:
     * ```typescript
     * const geometriesModule = await GeometriesModule.get(map);
     * ```
     *
     * @example
     * With custom styling:
     * ```typescript
     * const geometriesModule = await GeometriesModule.get(map, {
     *   colorConfig: {
     *     fillColor: 'blue',
     *     fillOpacity: 0.25
     *   },
     *   lineConfig: {
     *     lineColor: 'darkblue',
     *     lineWidth: 2,
     *     lineOpacity: 0.8
     *   },
     *   textConfig: {
     *     textField: ['get', 'title']
     *   },
     *   beforeLayerConfig: 'top'
     * });
     * ```
     *
     * @example
     * Data-driven styling:
     * ```typescript
     * const geometriesModule = await GeometriesModule.get(map, {
     *   colorConfig: {
     *     // Color based on feature properties
     *     fillColor: [
     *       'match',
     *       ['get', 'type'],
     *       'residential', '#FFEB3B',
     *       'commercial', '#2196F3',
     *       'industrial', '#9E9E9E',
     *       '#E0E0E0' // default
     *     ],
     *     fillOpacity: 0.4
     *   }
     * });
     * ```
     */
    static async get(tomtomMap: TomTomMap, config?: GeometriesModuleConfig): Promise<GeometriesModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new GeometriesModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: GeometriesModuleConfig) {
        super('geojson', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: GeometriesModuleConfig, restore?: boolean): GeometrySourcesWithLayers {
        if (!restore) {
            GeometriesModule.lastInstanceIndex++;
            this.sourceID = `geometry-${GeometriesModule.lastInstanceIndex}`;
            this.titleSourceID = `geometryTitle-${GeometriesModule.lastInstanceIndex}`;
            const layerIdPrefix = `geometry-${GeometriesModule.lastInstanceIndex}`;
            this.fillLayerID = `${layerIdPrefix}_Fill`;
            this.outlineLayerID = `${layerIdPrefix}_Outline`;
            this.titleLayerID = `${layerIdPrefix}_Title`;
        }

        const [geometryFillSpec, geometryOutlineSpec] = buildGeometryLayerSpecs(
            this.fillLayerID,
            this.outlineLayerID,
            config,
        );
        const titleLayerSpec = buildGeometryTitleLayerSpec(this.titleLayerID, config);
        this.titleLayerSpecs = titleLayerSpec;
        this.geometryFillLayerSpecs = geometryFillSpec;
        this.geometryOutlineLayerSpecs = geometryOutlineSpec;

        return {
            geometry: new GeoJSONSourceWithLayers(this.mapLibreMap, this.sourceID, [
                { ...geometryFillSpec },
                { ...geometryOutlineSpec },
            ]),
            geometryLabel: new GeoJSONSourceWithLayers(this.mapLibreMap, this.titleSourceID, [
                titleLayerSpec as ToBeAddedLayerSpec<SymbolLayerSpecification>,
            ]),
        };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: GeometriesModuleConfig | undefined) {
        if (config?.textConfig || config?.colorConfig || config?.lineConfig) {
            this.updateLayerAndData(config);
        }
        if (config?.beforeLayerConfig) {
            this.moveBeforeLayer(config.beforeLayerConfig);
        }
        return config;
    }

    private moveBeforeLayerID(beforeLayerId?: string) {
        for (const layer of this.sourcesWithLayers.geometry.sourceAndLayerIDs.layerIDs) {
            this.mapLibreMap.moveLayer(layer, beforeLayerId);
        }
    }

    /**
     * Positions the geometry layers relative to other map layers.
     *
     * @param layerConfig - Layer positioning configuration.
     * Can be `'top'` to place above all layers, or a specific layer ID.
     *
     * @remarks
     * **Use Cases:**
     * - Place geometries above base map but below labels
     * - Ensure geometries appear above/below specific features
     * - Control visual hierarchy of multiple data layers
     *
     * **Available Layer IDs:**
     * Use predefined layer IDs from `mapStyleLayerIDs` or custom layer IDs.
     *
     * @example
     * ```typescript
     * import { mapStyleLayerIDs } from '@tomtom-international/maps-sdk-js/map';
     *
     * // Place below labels
     * geometries.moveBeforeLayer(mapStyleLayerIDs.lowestLabel);
     *
     * // Place on top
     * geometries.moveBeforeLayer('top');
     * ```
     */
    moveBeforeLayer(layerConfig: GeometryBeforeLayerConfig) {
        this.config = { ...this.config, beforeLayerConfig: layerConfig };
        this.moveBeforeLayerID(layerConfig === 'top' ? this.titleLayerID : mapStyleLayerIDs[layerConfig]);
    }

    /**
     * Updates the text/label configuration for displayed geometries.
     *
     * @param textConfig - New text configuration settings.
     *
     * @remarks
     * **Configuration:**
     * - `textField`: MapLibre expression for label text content
     * - Supports dynamic text based on feature properties
     * - Changes apply to currently shown and future geometries
     *
     * @example
     * ```typescript
     * // Show feature property as label
     * geometries.applyTextConfig({
     *   textField: ['get', 'name']
     * });
     *
     * // Conditional labels
     * geometries.applyTextConfig({
     *   textField: [
     *     'case',
     *     ['has', 'label'],
     *     ['get', 'label'],
     *     ['get', 'title']
     *   ]
     * });
     * ```
     */
    applyTextConfig(textConfig: GeometryTextConfig) {
        const config = { ...this.config, textConfig };
        this.updateLayerAndData(config);
        // TODO: is this consistent with _applyConfig?
        this.sourcesWithLayers.geometryLabel.show(
            prepareTitleForDisplay(this.sourcesWithLayers.geometry.shownFeatures),
        );
        this.config = config;
    }

    private updateLayerAndData(config: GeometriesModuleConfig) {
        const [geometryFillSpec, geometryOutlineSpec] = buildGeometryLayerSpecs(
            this.fillLayerID,
            this.outlineLayerID,
            config,
        );
        const newTitleLayerSpecs = buildGeometryTitleLayerSpec(this.titleLayerID, config);

        changeLayerProps(geometryFillSpec, this.geometryFillLayerSpecs, this.mapLibreMap);
        changeLayerProps(geometryOutlineSpec, this.geometryOutlineLayerSpecs, this.mapLibreMap);
        changeLayerProps(newTitleLayerSpecs, this.titleLayerSpecs, this.mapLibreMap);

        this.geometryFillLayerSpecs = geometryFillSpec;
        this.geometryOutlineLayerSpecs = geometryOutlineSpec;
        this.titleLayerSpecs = newTitleLayerSpecs;
    }

    /**
     * @ignore
     */
    protected restoreDataAndConfigImpl() {
        const previousShownFeatures = this.sourcesWithLayers.geometry.shownFeatures;
        this.initSourcesWithLayers(this.config, true);
        this.config && this._applyConfig(this.config);
        this.show(previousShownFeatures);
    }

    /**
     * Displays the given polygon geometries on the map.
     *
     * @param geometries - Polygon features to display. Can be a single Feature,
     * array of Features, or a FeatureCollection.
     *
     * @remarks
     * **Behavior:**
     * - Replaces any previously shown geometries
     * - Applies current module styling configuration
     * - Waits for module to be ready before displaying
     * - Automatically handles both Polygon and MultiPolygon types
     *
     * **Feature Properties:**
     * - `title`: Used for labels if text config is set
     * - `color`: Override fill color per feature
     * - Custom properties accessible in styling expressions
     *
     * @example
     * Single polygon:
     * ```typescript
     * await geometries.show({
     *   type: 'Feature',
     *   geometry: {
     *     type: 'Polygon',
     *     coordinates: [[[4.88, 52.37], [4.89, 52.37], [4.89, 52.38], [4.88, 52.37]]]
     *   },
     *   properties: {
     *     title: 'Amsterdam Center',
     *     color: '#FF5733'
     *   }
     * });
     * ```
     *
     * @example
     * Multiple polygons:
     * ```typescript
     * await geometries.show({
     *   type: 'FeatureCollection',
     *   features: [
     *     { type: 'Feature', geometry: {...}, properties: {...} },
     *     { type: 'Feature', geometry: {...}, properties: {...} }
     *   ]
     * });
     * ```
     *
     * @example
     * From search API response:
     * ```typescript
     * import { search } from '@tomtom-international/maps-sdk-js/services';
     *
     * const result = await search.geometrySearch({
     *   query: 'Amsterdam',
     *   geometryList: [{ type: 'CIRCLE', position: [52.37, 4.89], radius: 5000 }]
     * });
     *
     * if (result.results[0].dataSources?.geometry) {
     *   await geometries.show(result.results[0].dataSources.geometry);
     * }
     * ```
     */
    async show(geometries: PolygonFeatures) {
        await this.waitUntilModuleReady();
        const geometry = this.sourcesWithLayers.geometry;
        geometry.show(prepareGeometryForDisplay(geometries, this.config));
        this.sourcesWithLayers.geometryLabel.show(prepareTitleForDisplay(geometry.shownFeatures));
    }

    /**
     * Removes all geometries from the map.
     *
     * @remarks
     * - Clears both geometry layers and labels
     * - Does not reset styling configuration
     * - Module remains initialized and ready for new data
     *
     * @example
     * ```typescript
     * // Clear displayed geometries
     * await geometries.clear();
     *
     * // Show new geometries
     * await geometries.show(newGeometries);
     * ```
     */
    async clear() {
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.geometry.clear();
    }

    /**
     * Gets the events interface for handling user interactions with geometries.
     *
     * @returns An EventsModule instance for registering event handlers.
     *
     * @remarks
     * **Supported Events:**
     * - `click`: User clicks on a geometry
     * - `contextmenu`: User right-clicks on a geometry
     * - `hover`: Mouse enters a geometry
     * - `long-hover`: Mouse hovers over geometry for extended time
     *
     * **Event Features:**
     * - Receive the original feature data passed to `show()`
     * - Access feature properties and geometry
     * - Get click/hover coordinates
     *
     * @example
     * Basic event handling:
     * ```typescript
     * geometries.events.on('click', (feature, lngLat) => {
     *   console.log('Clicked:', feature.properties);
     *   console.log('Location:', lngLat);
     * });
     * ```
     *
     * @example
     * Multiple handlers:
     * ```typescript
     * // Highlight on hover
     * geometries.events.on('hover', (feature) => {
     *   highlightGeometry(feature.id);
     * });
     *
     * // Show details on click
     * geometries.events.on('click', (feature) => {
     *   showDetailPanel(feature.properties);
     * });
     *
     * // Context menu
     * geometries.events.on('contextmenu', (feature, lngLat) => {
     *   showContextMenu(lngLat, feature);
     * });
     * ```
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.geometry);
    }
}
