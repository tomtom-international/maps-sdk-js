import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Point } from 'geojson';
import type { SymbolLayerSpecification } from 'maplibre-gl';
import type { BeforeLayerConfig, SymbolLayerSpecWithoutSource, ToBeAddedLayerSpec } from '../shared';
import {
    AbstractMapModule,
    CombinedEvents,
    GeoJSONSourceWithLayers,
    ModuleEvents,
    mapStyleLayerIDs,
    UserEvents,
} from '../shared';
import { changeLayerProps, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import {
    buildGeometryLayerSpecs,
    buildGeometryLineLabelLayerSpec,
    buildGeometryTitleLayerSpec,
} from './layers/geometryLayers';
import { prepareGeometryForDisplay, prepareTitleForDisplay } from './prepareGeometryForDisplay';
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
 *   fill: { color: '#FF5733', opacity: 0.3 },
 *   line: { color: '#C70039', width: 3 },
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
    private titleLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryFillLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryOutlineLayerSpecs!: SymbolLayerSpecWithoutSource;
    private lineLabelLayerSpecs: SymbolLayerSpecWithoutSource | null = null;

    private sourceID!: string;
    private fillLayerID!: string;
    private outlineLayerID!: string;
    private lineLabelLayerID!: string;

    private titleSourceID!: string;
    private titleLayerID!: string;

    // Cached for restoreDataAndConfigImpl on style change.
    private lastRawInput: PolygonFeatures | null = null;
    private readonly shownFeaturesHandlers: ((features: PolygonFeatures) => void)[] = [];

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     *
     * @remarks
     * **Configuration Options:**
     * - `fill`: Fill color, opacity, and optional fill-layer positioning
     * - `line`: Border/outline styling and optional border-layer positioning
     * - `textConfig`: Label display configuration
     * - `beforeLayerConfig`: Layer ordering — a single target, or `{ all, fill, line }` to split them
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
     *   fill: { color: 'blue', opacity: 0.25 },
     *   line: { color: 'darkblue', width: 2, opacity: 0.8 },
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
     *   fill: {
     *     // Color based on feature properties
     *     color: [
     *       'match',
     *       ['get', 'type'],
     *       'residential', '#FFEB3B',
     *       'commercial', '#2196F3',
     *       'industrial', '#9E9E9E',
     *       '#E0E0E0' // default
     *     ],
     *     opacity: 0.4
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
            this.sourceID = `geometry-${this.instanceIndex}`;
            this.titleSourceID = `geometryTitle-${this.instanceIndex}`;
            const layerIdPrefix = `geometry-${this.instanceIndex}`;
            this.fillLayerID = `${layerIdPrefix}_Fill`;
            this.outlineLayerID = `${layerIdPrefix}_Outline`;
            this.lineLabelLayerID = `${layerIdPrefix}_LineLabel`;
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

        const lineLabelSpec =
            config?.lineLabelConfig === undefined
                ? null
                : buildGeometryLineLabelLayerSpec(this.lineLabelLayerID, config);
        this.lineLabelLayerSpecs = lineLabelSpec as SymbolLayerSpecWithoutSource | null;

        return {
            geometry: new GeoJSONSourceWithLayers(this.mapLibreMap, this.sourceID, [
                { ...geometryFillSpec },
                { ...geometryOutlineSpec },
                ...(lineLabelSpec ? [lineLabelSpec as ToBeAddedLayerSpec<SymbolLayerSpecification>] : []),
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
        if (config?.textConfig || config?.fill || config?.line) {
            this.updateLayerAndData(config);
        }
        if (config?.beforeLayerConfig || config?.fill?.beforeLayerConfig || config?.line?.beforeLayerConfig) {
            this.applyBeforeLayerConfig(config);
        }
        return config;
    }

    /** Resolve a positioning target to the map-style layer id the geometry layers should sit before. */
    private resolveBeforeID(target: BeforeLayerConfig): string {
        return target === 'top' ? this.titleLayerID : mapStyleLayerIDs[target];
    }

    private moveLayersBefore(layerIDs: string[], beforeLayerID: string) {
        for (const layer of layerIDs) {
            this.mapLibreMap.moveLayer(layer, beforeLayerID);
        }
    }

    // The fill is its own layer; the border/outline and its optional line labels move together as the
    // "line" group. When fill and line target the same layer, move fill first so the border ends up
    // above it (matching the source's fill-under-outline z-order).
    private get fillLayerIDs(): string[] {
        return [this.fillLayerID];
    }
    private get lineLayerIDs(): string[] {
        return this.lineLabelLayerSpecs ? [this.outlineLayerID, this.lineLabelLayerID] : [this.outlineLayerID];
    }

    /**
     * Positions the geometry layers relative to other map layers.
     *
     * @param layerConfig - Layer positioning. A single {@link BeforeLayerConfig} (`'top'` or a layer
     * id) moves all geometry layers together; the object form (`{ all?, fill?, line? }`) positions the
     * fill and border independently.
     *
     * @remarks
     * A per-layer `beforeLayerConfig` set inside the `fill` / `line` config sections takes precedence
     * over the value passed here.
     *
     * **Available Layer IDs:** predefined ids from `mapStyleLayerIDs`, or a custom layer id.
     *
     * @example
     * ```typescript
     * import { mapStyleLayerIDs } from '@tomtom-international/maps-sdk-js/map';
     *
     * // Place all geometry layers below labels
     * geometries.moveBeforeLayer(mapStyleLayerIDs.lowestLabel);
     *
     * // Fill below the road network, border on top
     * geometries.moveBeforeLayer({ fill: 'lowestRoadLine', line: 'top' });
     * ```
     */
    moveBeforeLayer(layerConfig: GeometryBeforeLayerConfig) {
        this.config = { ...this.config, beforeLayerConfig: layerConfig };
        this.applyBeforeLayerConfig(this.config);
        this.emitConfigChange();
    }

    // Compute the effective before-target for each layer group and move it. Precedence per group: the
    // fill/line section's own `beforeLayerConfig`, else the top-level object's matching key (falling
    // back to `all`), else the top-level scalar. Undefined leaves that group where it is.
    private applyBeforeLayerConfig(config: GeometriesModuleConfig | undefined) {
        const top = config?.beforeLayerConfig;
        const topFor = (kind: 'fill' | 'line'): BeforeLayerConfig | undefined => {
            if (top === undefined) return undefined;
            if (typeof top === 'string') return top;
            return top[kind] ?? top.all;
        };
        const fillTarget = config?.fill?.beforeLayerConfig ?? topFor('fill');
        const lineTarget = config?.line?.beforeLayerConfig ?? topFor('line');
        if (fillTarget !== undefined) this.moveLayersBefore(this.fillLayerIDs, this.resolveBeforeID(fillTarget));
        if (lineTarget !== undefined) this.moveLayersBefore(this.lineLayerIDs, this.resolveBeforeID(lineTarget));
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
        this.emitConfigChange();
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

        if (this.lineLabelLayerSpecs) {
            const newLineLabelSpec = buildGeometryLineLabelLayerSpec(this.lineLabelLayerID, config);
            changeLayerProps(
                newLineLabelSpec as SymbolLayerSpecWithoutSource,
                this.lineLabelLayerSpecs,
                this.mapLibreMap,
            );
            this.lineLabelLayerSpecs = newLineLabelSpec as SymbolLayerSpecWithoutSource;
        }
    }

    /**
     * @ignore
     */
    protected restoreDataAndConfigImpl() {
        const previousInput = this.lastRawInput;
        this.initSourcesWithLayers(this.config, true);
        this.config && this._applyConfig(this.config);
        if (previousInput) {
            // Fire-and-forget: base class requires sync, but show() is async.
            void this.show(previousInput);
        }
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
        this.lastRawInput = geometries;
        const { transformFeaturesForDisplay } = this.config ?? {};
        const transformed = transformFeaturesForDisplay ? transformFeaturesForDisplay(geometries) : geometries;
        const geometry = this.sourcesWithLayers.geometry;
        geometry.show(prepareGeometryForDisplay(transformed, this.config));
        this.sourcesWithLayers.geometryLabel.show(prepareTitleForDisplay(geometry.shownFeatures));
        for (const handler of this.shownFeaturesHandlers) {
            handler(geometries);
        }
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
        this.sourcesWithLayers.geometryLabel.clear();
    }

    /**
     * Returns the currently shown geometries.
     *
     * @returns The geometries currently displayed on the map.
     *
     * @remarks
     * Returns the exact data that was passed to the `show()` method.
     *
     * @example
     * ```typescript
     * const shown = geometriesModule.getShown();
     * console.log(`Geometries: ${shown.geometry.features.length}`);
     * ```
     */
    getShown() {
        return {
            geometry: this.sourcesWithLayers.geometry.shownFeatures,
            geometryLabel: this.sourcesWithLayers.geometryLabel.shownFeatures,
        };
    }

    /**
     * Gets the events interface for handling user interactions with geometries.
     *
     * @returns A `UserEvents` instance for registering event handlers.
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
    get events(): CombinedEvents<import('maplibre-gl').MapGeoJSONFeature, GeometriesModuleConfig, PolygonFeatures> {
        return new CombinedEvents(
            new UserEvents(this.tomtomMap._eventsProxy, this.sourcesWithLayers.geometry, this.config?.events),
            new ModuleEvents(this.configChangeHandlers, this.shownFeaturesHandlers),
        );
    }
}
