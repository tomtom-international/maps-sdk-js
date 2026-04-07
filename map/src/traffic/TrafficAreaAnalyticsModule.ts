import type { AreaAnalyticsMetricKey, TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { mask } from '@turf/turf';
import type { FeatureCollection, Point, Polygon } from 'geojson';
import { ExpressionSpecification } from 'maplibre-gl';
import type { BeforeLayerConfig, EventHandlerConfig, EventType, SourceWithLayers, UserEventHandler } from '../shared';
import { AbstractMapModule, EventsModule, EventsProxy, GeoJSONSourceWithLayers, mapStyleLayerIDs } from '../shared';
import { changeLayerProps, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import {
    buildHeatmapLayerSpec,
    buildHexExtrusionHighlightLayerSpec,
    buildHexExtrusionLayerSpec,
    buildHexFillLayerSpec,
    buildHexOutlineLayerSpec,
    buildRegionFillLayerSpec,
    buildRegionLineLayerSpec,
    buildSquareExtrusionHighlightLayerSpec,
    buildSquareExtrusionLayerSpec,
    buildSquareFillLayerSpec,
    buildSquareOutlineLayerSpec,
    expandThemeToAllMetrics,
    getActiveMetric,
} from './layers/areaAnalyticsLayers';
import type {
    AreaAnalyticsBeforeLayerConfig,
    AreaAnalyticsColorStopsConfig,
    AreaAnalyticsColorTheme,
    AreaAnalyticsDisplayMode,
    AreaAnalyticsHeightConfig,
    AreaAnalyticsMetricConfig,
    AreaAnalyticsMetricFilter,
    TrafficAreaAnalyticsConfig,
} from './types/trafficAreaAnalyticsConfig';
import { AREA_ANALYTICS_DEFAULTS } from './types/trafficAreaAnalyticsConfig';
import type { AreaAnalyticsDisplayProperties, AreaAnalyticsTileFeature } from './types/trafficAreaAnalyticsFeature';
import { tilesToHexFeatures, tilesToPointFeatures, tilesToSquareFeatures } from './util/areaAnalyticsGeoJSONTiles';

/**
 * Sources and layers managed by this module.
 * @ignore
 */
type AreaAnalyticsSourcesWithLayers = {
    heatmap: GeoJSONSourceWithLayers<FeatureCollection<Point, AreaAnalyticsDisplayProperties>>;
    hexgrid: GeoJSONSourceWithLayers<FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>>;
    square: GeoJSONSourceWithLayers<FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>>;
    region: GeoJSONSourceWithLayers;
};

/**
 * Handler called whenever any setter on {@link TrafficAreaAnalyticsModule} is invoked.
 *
 * @param config - The updated module configuration, or `undefined` if the module was cleared.
 * @group Traffic Area Analytics
 */
export type ConfigChangeHandler = (config: TrafficAreaAnalyticsConfig | undefined) => void;

/**
 * Events interface for {@link TrafficAreaAnalyticsModule}.
 *
 * Extends the standard feature-interaction events (click, hover, contextmenu, long-hover)
 * with a `configChange` event that fires whenever a setter on the module is called.
 *
 * @group Traffic Area Analytics
 */
export class AreaAnalyticsEventsModule extends EventsModule<AreaAnalyticsTileFeature> {
    constructor(
        eventProxy: EventsProxy,
        sources: SourceWithLayers[],
        config: EventHandlerConfig | undefined,
        private readonly configChangeHandlers: ConfigChangeHandler[],
    ) {
        super(eventProxy, sources, config);
    }

    on(type: 'configChange', handler: ConfigChangeHandler): () => void;
    on(type: EventType, handler: UserEventHandler<AreaAnalyticsTileFeature>): void;
    on(
        type: EventType | 'configChange',
        handler: ConfigChangeHandler | UserEventHandler<AreaAnalyticsTileFeature>,
    ): (() => void) | void {
        if (type === 'configChange') {
            const configChangeHandler = handler as ConfigChangeHandler;
            this.configChangeHandlers.push(configChangeHandler);
            return () => {
                const index = this.configChangeHandlers.indexOf(configChangeHandler);
                if (index !== -1) this.configChangeHandlers.splice(index, 1);
            };
        }
        super.on(type, handler as UserEventHandler<AreaAnalyticsTileFeature>);
    }
}

/**
 * Traffic Area Analytics visualization module.
 *
 * Renders area-analytics data on the map in one of five modes:
 * - **hexgrid-3d** — 3D extruded hexagonal cells coloured and raised by the active metric (default)
 * - **hexgrid-2d** — Flat hexagonal cells coloured by the active metric
 * - **square-3d** — 3D extruded square cells coloured and raised by the active metric
 * - **square-2d** — Flat square cells coloured by the active metric
 * - **heatmap** — a MapLibre density-heatmap layer built from tile-centre points
 *
 * The actual region boundary is always rendered alongside the analytics cells.
 *
 * @remarks
 * **Quick start:**
 * ```typescript
 * import { TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
 * import { trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
 *
 * const module = await TrafficAreaAnalyticsModule.get(map, {
 *   displayMode: 'hexgrid-3d',
 *   metric: { active: 'congestionLevel' },
 * });
 * const analytics = await trafficAreaAnalytics({ ... });
 * await module.show(analytics);
 * ```
 *
 * @group Traffic Area Analytics
 */
export class TrafficAreaAnalyticsModule extends AbstractMapModule<
    AreaAnalyticsSourcesWithLayers,
    TrafficAreaAnalyticsConfig
> {
    private static lastInstanceIndex = -1;

    // ── Cached layer specs (used by changeLayerProps for config updates) ──

    private heatmapLayerSpec!: ReturnType<typeof buildHeatmapLayerSpec>;
    private hexFillLayerSpec!: ReturnType<typeof buildHexFillLayerSpec>;
    private hexExtrusionLayerSpec!: ReturnType<typeof buildHexExtrusionLayerSpec>;
    private hexOutlineLayerSpec!: ReturnType<typeof buildHexOutlineLayerSpec>;
    private hexExtrusionHighlightLayerSpec!: ReturnType<typeof buildHexExtrusionHighlightLayerSpec>;
    private squareFillLayerSpec!: ReturnType<typeof buildSquareFillLayerSpec>;
    private squareExtrusionLayerSpec!: ReturnType<typeof buildSquareExtrusionLayerSpec>;
    private squareOutlineLayerSpec!: ReturnType<typeof buildSquareOutlineLayerSpec>;
    private squareExtrusionHighlightLayerSpec!: ReturnType<typeof buildSquareExtrusionHighlightLayerSpec>;
    private regionFillLayerSpec!: ReturnType<typeof buildRegionFillLayerSpec>;
    private regionLineLayerSpec!: ReturnType<typeof buildRegionLineLayerSpec>;

    // Cached for style-change restoration.
    private lastAnalytics: TrafficAreaAnalytics | null = null;

    // Config change listeners.
    private configChangeHandlers: ConfigChangeHandler[] = [];

    // ── Factory ──────────────────────────────────────────────────────

    /**
     * Creates and initialises a new Traffic Area Analytics module.
     *
     * All configuration properties are optional. When `config` is omitted (or only
     * partially supplied), built-in defaults are applied for every missing field.
     * After `get()` resolves, {@link TrafficAreaAnalyticsModule.getConfig} always returns a
     * fully-populated configuration — there is no need to reference any default
     * values yourself.
     *
     * @param tomtomMap - The TomTomMap instance.
     * @param config - Optional initial configuration. Omit to use all defaults.
     * @returns A promise that resolves with the initialised module.
     *
     * @example
     * ```typescript
     * // No config needed — defaults are applied automatically.
     * const module = await TrafficAreaAnalyticsModule.get(map);
     * await module.show(analytics);
     *
     * // Or override specific properties while keeping everything else at default:
     * const module = await TrafficAreaAnalyticsModule.get(map, {
     *   displayMode: 'heatmap',
     *   metricConfig: {
     *     congestionLevel: { color: 'heat' },
     *   },
     * });
     * ```
     */
    static async get(tomtomMap: TomTomMap, config?: TrafficAreaAnalyticsConfig): Promise<TrafficAreaAnalyticsModule> {
        await waitUntilMapIsReady(tomtomMap);
        // Always pass a config object (even if empty) so _applyConfig fills in all
        // defaults and getConfig() returns a fully-populated result from the start.
        return new TrafficAreaAnalyticsModule(tomtomMap, config ?? {});
    }

    private constructor(map: TomTomMap, config?: TrafficAreaAnalyticsConfig) {
        super('geojson', map, config);
    }

    // ── AbstractMapModule hooks ──────────────────────────────────────

    /** @ignore */
    protected _initSourcesWithLayers(
        config?: TrafficAreaAnalyticsConfig,
        restore?: boolean,
    ): AreaAnalyticsSourcesWithLayers {
        if (!restore) {
            TrafficAreaAnalyticsModule.lastInstanceIndex++;
        }

        const index = TrafficAreaAnalyticsModule.lastInstanceIndex;
        const heatmapSourceId = `area-analytics-heatmap-${index}`;
        const hexgridSourceId = `area-analytics-hexgrid-${index}`;
        const squareSourceId = `area-analytics-square-${index}`;
        const regionSourceId = `area-analytics-region-${index}`;

        const heatmapLayerId = `${heatmapSourceId}-layer`;
        const hexFillLayerId = `${hexgridSourceId}-fill`;
        const hexExtrusionLayerId = `${hexgridSourceId}-extrusion`;
        const hexOutlineLayerId = `${hexgridSourceId}-outline`;
        const hexExtrusionHighlightLayerId = `${hexgridSourceId}-extrusion-highlight`;
        const squareFillLayerId = `${squareSourceId}-fill`;
        const squareExtrusionLayerId = `${squareSourceId}-extrusion`;
        const squareOutlineLayerId = `${squareSourceId}-outline`;
        const squareExtrusionHighlightLayerId = `${squareSourceId}-extrusion-highlight`;
        const regionFillLayerId = `${regionSourceId}-fill`;
        const regionLineLayerId = `${regionSourceId}-line`;

        // No computed ranges available at init time — pass undefined
        this.heatmapLayerSpec = buildHeatmapLayerSpec(heatmapLayerId, config);
        this.hexFillLayerSpec = buildHexFillLayerSpec(hexFillLayerId, config);
        this.hexExtrusionLayerSpec = buildHexExtrusionLayerSpec(hexExtrusionLayerId, config);
        this.squareFillLayerSpec = buildSquareFillLayerSpec(squareFillLayerId, config);
        this.squareExtrusionLayerSpec = buildSquareExtrusionLayerSpec(squareExtrusionLayerId, config);
        this.regionFillLayerSpec = buildRegionFillLayerSpec(regionFillLayerId, config);
        this.regionLineLayerSpec = buildRegionLineLayerSpec(regionLineLayerId, config);

        // Highlight/outline specs — added directly to MapLibre (not through GeoJSONSourceWithLayers)
        // so they are never included in interactiveLayerIDs and won't break queryRenderedFeatures.
        this.hexOutlineLayerSpec = buildHexOutlineLayerSpec(hexOutlineLayerId, config);
        this.hexExtrusionHighlightLayerSpec = buildHexExtrusionHighlightLayerSpec(hexExtrusionHighlightLayerId, config);
        this.squareOutlineLayerSpec = buildSquareOutlineLayerSpec(squareOutlineLayerId, config);
        this.squareExtrusionHighlightLayerSpec = buildSquareExtrusionHighlightLayerSpec(
            squareExtrusionHighlightLayerId,
            config,
        );

        // Create sources with only the interactive data layers. Highlight layers share the same
        // MapLibre source but are added separately below to stay out of interactiveLayerIDs.
        const result: AreaAnalyticsSourcesWithLayers = {
            heatmap: new GeoJSONSourceWithLayers<FeatureCollection<Point, AreaAnalyticsDisplayProperties>>(
                this.mapLibreMap,
                heatmapSourceId,
                [this.heatmapLayerSpec],
            ),
            hexgrid: new GeoJSONSourceWithLayers<FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>>(
                this.mapLibreMap,
                hexgridSourceId,
                [this.hexFillLayerSpec, this.hexExtrusionLayerSpec],
            ),
            square: new GeoJSONSourceWithLayers<FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>>(
                this.mapLibreMap,
                squareSourceId,
                [this.squareFillLayerSpec, this.squareExtrusionLayerSpec],
            ),
            region: new GeoJSONSourceWithLayers(this.mapLibreMap, regionSourceId, [
                this.regionFillLayerSpec,
                this.regionLineLayerSpec,
            ]),
        };

        // Sources are now in the map — safe to add highlight layers on top.
        this.addHighlightLayersToMap(hexgridSourceId, squareSourceId);

        return result;
    }

    /** @ignore */
    protected _applyConfig(config: TrafficAreaAnalyticsConfig | undefined): TrafficAreaAnalyticsConfig | undefined {
        if (config === undefined) return;

        // Deep-merge the metricConfig record at the per-metric-key level so that
        // passing { metricConfig: { congestionLevel: { color: 'heat' } } } does
        // not wipe out configs for other metrics.
        const mergedMetricConfig: TrafficAreaAnalyticsConfig['metricConfig'] =
            config.metricConfig && this.config?.metricConfig
                ? { ...this.config.metricConfig, ...config.metricConfig }
                : (config.metricConfig ?? this.config?.metricConfig);

        // Ensure every metric has an explicit config entry so getConfig() always
        // returns fully-populated stops (callers never need to fall back to defaults).
        const defaultKeys = Object.keys(AREA_ANALYTICS_DEFAULTS.metricConfig) as AreaAnalyticsMetricKey[];
        const filledMetricConfig = Object.fromEntries(
            defaultKeys.map((metric) => [
                metric,
                mergedMetricConfig?.[metric] ?? AREA_ANALYTICS_DEFAULTS.metricConfig[metric],
            ]),
        ) as Record<AreaAnalyticsMetricKey, AreaAnalyticsMetricConfig>;

        const merged: TrafficAreaAnalyticsConfig = {
            activeMetric: AREA_ANALYTICS_DEFAULTS.activeMetric,
            displayMode: AREA_ANALYTICS_DEFAULTS.displayMode,
            ...this.config,
            ...config,
            metricConfig: filledMetricConfig,
        };

        this.applyLayerConfig(merged);

        if (merged.regionPolygon) {
            this.applyRegionConfig(merged);
        }

        if (merged.beforeLayerConfig) {
            this.moveBeforeLayer(merged.beforeLayerConfig);
        }

        if (merged.visible === false) {
            this.setVisible(false);
        }

        this.applyModeVisibility();
        return merged;
    }

    /** @ignore */
    protected restoreDataAndConfigImpl(): void {
        const cachedAnalytics = this.lastAnalytics;
        this.initSourcesWithLayers(this.config, true);

        if (cachedAnalytics) {
            // Skip _applyConfig — show() will apply metrics + visibility after data is loaded.
            if (this.config?.visible === false) {
                this.setVisible(false);
            }
            void this.show(cachedAnalytics);
        } else if (this.config) {
            this._applyConfig(this.config);
        }
    }

    // ── Public API ───────────────────────────────────────────────────

    /**
     * Displays area analytics data on the map.
     *
     * Accepts the raw response from `trafficAreaAnalytics()`. Tile data is
     * transformed internally to point features (heatmap), hexagonal polygons
     * (hexgrid modes), and square polygons (square modes).
     * The region boundary geometry is also displayed.
     *
     * @param analytics - The raw `TrafficAreaAnalytics` service response.
     *
     * @example
     * ```typescript
     * const analytics = await trafficAreaAnalytics({ ... });
     * await module.show(analytics);
     * ```
     */
    async show(analytics: TrafficAreaAnalytics): Promise<void> {
        await this.waitUntilModuleReady();

        this.lastAnalytics = analytics;

        this.sourcesWithLayers.heatmap.show(tilesToPointFeatures(analytics));
        this.sourcesWithLayers.hexgrid.show(tilesToHexFeatures(analytics));
        this.sourcesWithLayers.square.show(tilesToSquareFeatures(analytics));

        const inverted = this.config?.regionPolygon?.inverted ?? AREA_ANALYTICS_DEFAULTS.regionPolygon.inverted;
        this.sourcesWithLayers.region.show(this.buildRegionFC(analytics.features, inverted));

        this.applyLayerConfig(this.config);
        this.applyModeVisibility();
    }

    /**
     * Removes all area analytics data from the map.
     */
    async clear(): Promise<void> {
        await this.waitUntilModuleReady();
        this.lastAnalytics = null;
        this.sourcesWithLayers.heatmap.clear();
        this.sourcesWithLayers.hexgrid.clear();
        this.sourcesWithLayers.square.clear();
        this.sourcesWithLayers.region.clear();
    }

    /**
     * Switches the visualisation mode.
     *
     * @param mode - One of `'heatmap'`, `'hexgrid-3d'`, `'hexgrid-2d'`, `'square-3d'`, `'square-2d'`.
     */
    setMode(mode: AreaAnalyticsDisplayMode): void {
        if (mode === this.mode) return;
        this.config = { ...this.config, displayMode: mode };
        this.applyModeVisibility();
        this.emitConfigChange();
    }

    /**
     * Changes the active metric that drives colour and height.
     *
     * Updates `activeMetric` in the config to the given metric key.
     *
     * @param metric - One of `'congestionLevel'`, `'speed'`, `'travelTime'`, `'freeFlowSpeed'`, or `'networkLength'`.
     */
    setMetric(metric: AreaAnalyticsMetricKey): void {
        if (metric === this.activeMetric) return;
        this.config = { ...this.config, activeMetric: metric };
        this.applyLayerConfig(this.config);
        this.emitConfigChange();
    }

    /**
     * Sets the color for one or more metrics.
     *
     * Pass a preset theme name or a custom color-stops configuration.
     * Pass `undefined` to clear the color override for the targeted metrics.
     *
     * @param color - A preset theme, an `AreaAnalyticsColorStopsConfig`, or `undefined` to clear.
     * @param metrics - Optional list of metrics to target.
     *   When omitted, the color is applied to **all** metrics.
     *
     * @example
     * ```typescript
     * // Apply a theme to all metrics
     * module.setColor('heat');
     *
     * // Apply a theme to specific metrics only
     * module.setColor('heat', ['speed', 'freeFlowSpeed']);
     *
     * // Apply custom stops to a single metric
     * module.setColor(
     *   { valueType: 'raw', stops: [{ value: 0, color: '#2dc653' }, { value: 100, color: '#e03030' }] },
     *   ['congestionLevel'],
     * );
     *
     * // Clear color override for all metrics
     * module.setColor(undefined);
     *
     * // Clear color override for a specific metric
     * module.setColor(undefined, ['speed']);
     * ```
     */
    setColor(
        color: AreaAnalyticsColorTheme | AreaAnalyticsColorStopsConfig | undefined,
        metrics?: AreaAnalyticsMetricKey[],
    ): void {
        const ALL_METRICS = Object.keys(AREA_ANALYTICS_DEFAULTS.metricConfig) as AreaAnalyticsMetricKey[];
        const targetMetrics = metrics ?? ALL_METRICS;
        const updatedMetricConfig = { ...this.config?.metricConfig };

        if (color === undefined) {
            // Clear color override for targeted metrics.
            for (const metric of targetMetrics) {
                const { color: _c, ...rest } = updatedMetricConfig[metric] ?? {};
                updatedMetricConfig[metric] = rest as AreaAnalyticsMetricConfig;
            }
        } else if (typeof color === 'string') {
            // Theme preset: expand to per-metric explicit stops respecting display ordering
            // (speed-like metrics are inverted so "slow" maps to the bad end of the ramp).
            const expanded = expandThemeToAllMetrics(color);
            for (const metric of targetMetrics) {
                updatedMetricConfig[metric] = {
                    ...updatedMetricConfig[metric],
                    ...expanded[metric],
                };
            }
        } else {
            // Custom stops: apply same config to all targeted metrics.
            for (const metric of targetMetrics) {
                updatedMetricConfig[metric] = { ...updatedMetricConfig[metric], color };
            }
        }

        this.config = {
            ...this.config,
            metricConfig: updatedMetricConfig as Record<AreaAnalyticsMetricKey, AreaAnalyticsMetricConfig>,
        };
        this.applyLayerConfig(this.config);
        this.emitConfigChange();
    }

    /**
     * Configures extrusion height behaviour for one or more metrics.
     *
     * @param heightConfig - Height configuration.
     * @param metrics - Optional list of metrics to target.
     *   When omitted, the height config is applied to **all** metrics.
     *
     * @example
     * ```typescript
     * // Apply to all metrics
     * module.setHeight({ maxHeightMeters: 100, minHeightMeters: 5 });
     *
     * // Apply only to specific metrics
     * module.setHeight({ scaleMode: 'currentRange', maxHeightMeters: 500 }, ['speed', 'freeFlowSpeed']);
     * ```
     */
    setHeight(heightConfig: AreaAnalyticsHeightConfig, metrics?: AreaAnalyticsMetricKey[]): void {
        const ALL_METRICS = Object.keys(AREA_ANALYTICS_DEFAULTS.metricConfig) as AreaAnalyticsMetricKey[];
        const targetMetrics = metrics ?? ALL_METRICS;
        const updatedMetricConfig = { ...this.config?.metricConfig };

        for (const metric of targetMetrics) {
            updatedMetricConfig[metric] = { ...updatedMetricConfig[metric], height: heightConfig };
        }

        this.config = {
            ...this.config,
            metricConfig: updatedMetricConfig as Record<AreaAnalyticsMetricKey, AreaAnalyticsMetricConfig>,
        };
        this.applyLayerConfig(this.config);
        this.emitConfigChange();
    }

    /**
     * Filters visible tiles by value range for one or more metrics.
     *
     * @param filter - Filter config. Pass `undefined` to clear.
     * @param metrics - Optional list of metrics to target.
     *   When omitted, the filter is applied to **all** metrics.
     *
     * @example
     * ```typescript
     * // Filter all metrics
     * module.filter({ min: 20, max: 80 });
     *
     * // Filter only a specific metric
     * module.filter({ min: 50 }, ['congestionLevel']);
     *
     * // Clear filter for all metrics
     * module.filter(undefined);
     * ```
     */
    filter(filter?: AreaAnalyticsMetricFilter, metrics?: AreaAnalyticsMetricKey[]): void {
        const ALL_METRICS = Object.keys(AREA_ANALYTICS_DEFAULTS.metricConfig) as AreaAnalyticsMetricKey[];
        const targetMetrics = metrics ?? ALL_METRICS;
        const updatedMetricConfig = { ...this.config?.metricConfig };

        for (const metric of targetMetrics) {
            updatedMetricConfig[metric] = { ...updatedMetricConfig[metric], filters: filter };
        }

        this.config = {
            ...this.config,
            metricConfig: updatedMetricConfig as Record<AreaAnalyticsMetricKey, AreaAnalyticsMetricConfig>,
        };
        this.applyFiltersToLayers();
        this.emitConfigChange();
    }

    /**
     * Clears any active tile filter for one or more metrics.
     *
     * @param metrics - Optional list of metrics to clear. When omitted, clears filters for **all** metrics.
     */
    clearFilter(metrics?: AreaAnalyticsMetricKey[]): void {
        this.filter(undefined, metrics);
    }

    /**
     * Shows or hides all area analytics layers.
     */
    setVisible(visible: boolean): void {
        this.config = { ...this.config, visible };
        this.applyModeVisibility();
        this.emitConfigChange();
    }

    /**
     * Whether any area analytics (data) layer is currently visible.
     */
    isVisible(): boolean {
        return (
            this.sourcesWithLayers.heatmap.isAnyLayerVisible() ||
            this.sourcesWithLayers.hexgrid.isAnyLayerVisible() ||
            this.sourcesWithLayers.square.isAnyLayerVisible()
        );
    }

    /**
     * Returns the currently displayed data for all visualisation modes.
     */
    getShown() {
        return {
            heatmap: this.sourcesWithLayers.heatmap.shownFeatures,
            hexgrid: this.sourcesWithLayers.hexgrid.shownFeatures,
            square: this.sourcesWithLayers.square.shownFeatures,
        };
    }

    /**
     * Repositions analytics layers independently by layer type.
     *
     * Only the properties present in `layerConfig` are repositioned; omitted layer types are left in place.
     *
     * @param layerConfig - Per-layer-type positioning config. Each value is `'top'` or a `MapStyleLayerID`.
     */
    moveBeforeLayer(layerConfig: AreaAnalyticsBeforeLayerConfig): void {
        this.config = { ...this.config, beforeLayerConfig: layerConfig };
        const toId = (value: BeforeLayerConfig) => (value === 'top' ? undefined : mapStyleLayerIDs[value]);

        if (layerConfig.heatmap !== undefined) {
            this.mapLibreMap.moveLayer(this.heatmapLayerSpec.id, toId(layerConfig.heatmap));
        }

        if (layerConfig.hexgrid?.flat2D !== undefined) {
            this.mapLibreMap.moveLayer(this.hexFillLayerSpec.id, toId(layerConfig.hexgrid.flat2D));
        }

        if (layerConfig.hexgrid?.extrusion3D !== undefined) {
            this.mapLibreMap.moveLayer(this.hexExtrusionLayerSpec.id, toId(layerConfig.hexgrid.extrusion3D));
        }

        if (layerConfig.square?.flat2D !== undefined) {
            this.mapLibreMap.moveLayer(this.squareFillLayerSpec.id, toId(layerConfig.square.flat2D));
        }

        if (layerConfig.square?.extrusion3D !== undefined) {
            this.mapLibreMap.moveLayer(this.squareExtrusionLayerSpec.id, toId(layerConfig.square.extrusion3D));
        }
    }

    /**
     * Event interface for the hexgrid and square layers.
     *
     * Supports feature-interaction events (hover, click, contextmenu, long-hover) as well as
     * a `configChange` event that fires whenever any setter is called on this module.
     *
     * @example
     * ```typescript
     * module.events.on('hover', (feature, lngLat) => {
     *   console.log(feature.properties.congestionLevel);
     * });
     *
     * const unsub = module.events.on('configChange', (config) => {
     *   console.log('Active metric:', config?.activeMetric);
     * });
     * // Later: unsub();
     * ```
     */
    get events(): AreaAnalyticsEventsModule {
        return new AreaAnalyticsEventsModule(
            this.tomtomMap._eventsProxy,
            [this.sourcesWithLayers.hexgrid, this.sourcesWithLayers.square, this.sourcesWithLayers.heatmap],
            this.config?.events,
            this.configChangeHandlers,
        );
    }

    // ── Private helpers ──────────────────────────────────────────────

    private get mode(): AreaAnalyticsDisplayMode {
        return this.config?.displayMode ?? AREA_ANALYTICS_DEFAULTS.displayMode;
    }

    private get activeMetric(): AreaAnalyticsMetricKey {
        return getActiveMetric(this.config);
    }

    private applyModeVisibility(): void {
        if (this.config?.visible === false) {
            this.hideAllDataLayers();
            return;
        }

        const mode = this.mode;
        const hasHeatmapData = this.sourcesWithLayers.heatmap.shownFeatures.features.length > 0;
        const hasHexData = this.sourcesWithLayers.hexgrid.shownFeatures.features.length > 0;
        const hasSquareData = this.sourcesWithLayers.square.shownFeatures.features.length > 0;
        const hasRegionData = this.sourcesWithLayers.region.shownFeatures.features.length > 0;

        // Data layers (managed by GeoJSONSourceWithLayers)
        this.sourcesWithLayers.heatmap.setLayersVisible(mode === 'heatmap' && hasHeatmapData);
        this.sourcesWithLayers.hexgrid.setLayersVisible(
            mode === 'hexgrid-3d' && hasHexData,
            (layerSpec) => layerSpec.id === this.hexExtrusionLayerSpec.id,
        );
        this.sourcesWithLayers.hexgrid.setLayersVisible(
            mode === 'hexgrid-2d' && hasHexData,
            (layerSpec) => layerSpec.id === this.hexFillLayerSpec.id,
        );
        this.sourcesWithLayers.square.setLayersVisible(
            mode === 'square-3d' && hasSquareData,
            (layerSpec) => layerSpec.id === this.squareExtrusionLayerSpec.id,
        );
        this.sourcesWithLayers.square.setLayersVisible(
            mode === 'square-2d' && hasSquareData,
            (layerSpec) => layerSpec.id === this.squareFillLayerSpec.id,
        );
        this.sourcesWithLayers.region.setLayersVisible(hasRegionData);

        // Highlight layers (added directly to MapLibre, not tracked by GeoJSONSourceWithLayers).
        // Outlines are 2D-only — line layers render in the 2D pass and appear behind fill-extrusion prisms.
        // Extrusion highlights are 3D-only.
        this.setHighlightLayerVisible(this.hexOutlineLayerSpec.id, mode === 'hexgrid-2d' && hasHexData);
        this.setHighlightLayerVisible(this.hexExtrusionHighlightLayerSpec.id, mode === 'hexgrid-3d' && hasHexData);
        this.setHighlightLayerVisible(this.squareOutlineLayerSpec.id, mode === 'square-2d' && hasSquareData);
        this.setHighlightLayerVisible(this.squareExtrusionHighlightLayerSpec.id, mode === 'square-3d' && hasSquareData);
    }

    private hideAllDataLayers(): void {
        this.sourcesWithLayers.heatmap.setLayersVisible(false);
        this.sourcesWithLayers.hexgrid.setLayersVisible(false);
        this.sourcesWithLayers.square.setLayersVisible(false);
        this.sourcesWithLayers.region.setLayersVisible(false);
        this.setHighlightLayerVisible(this.hexOutlineLayerSpec.id, false);
        this.setHighlightLayerVisible(this.hexExtrusionHighlightLayerSpec.id, false);
        this.setHighlightLayerVisible(this.squareOutlineLayerSpec.id, false);
        this.setHighlightLayerVisible(this.squareExtrusionHighlightLayerSpec.id, false);
    }

    private addHighlightLayersToMap(hexgridSourceId: string, squareSourceId: string): void {
        const addHidden = (spec: { id: string; beforeID?: string; [key: string]: unknown }, sourceId: string) => {
            if (!this.mapLibreMap.getLayer(spec.id)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.mapLibreMap.addLayer({ ...spec, source: sourceId } as any, spec.beforeID);
            }
            this.mapLibreMap.setLayoutProperty(spec.id, 'visibility', 'none');
        };

        addHidden(this.hexOutlineLayerSpec, hexgridSourceId);
        addHidden(this.hexExtrusionHighlightLayerSpec, hexgridSourceId);
        addHidden(this.squareOutlineLayerSpec, squareSourceId);
        addHidden(this.squareExtrusionHighlightLayerSpec, squareSourceId);
    }

    private setHighlightLayerVisible(layerId: string, visible: boolean): void {
        if (this.mapLibreMap.getLayer(layerId)) {
            this.mapLibreMap.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
    }

    private applyLayerConfig(config: TrafficAreaAnalyticsConfig | undefined): void {
        const computedRange = this.lastAnalytics?.properties.ranges?.[this.activeMetric];

        const newHeatmapSpec = buildHeatmapLayerSpec(this.heatmapLayerSpec.id, config, computedRange);
        const newHexFillSpec = buildHexFillLayerSpec(this.hexFillLayerSpec.id, config, computedRange);
        const newHexExtrusionSpec = buildHexExtrusionLayerSpec(this.hexExtrusionLayerSpec.id, config, computedRange);
        const newHexExtrusionHighlightSpec = buildHexExtrusionHighlightLayerSpec(
            this.hexExtrusionHighlightLayerSpec.id,
            config,
            computedRange,
        );
        const newSquareFillSpec = buildSquareFillLayerSpec(this.squareFillLayerSpec.id, config, computedRange);
        const newSquareExtrusionSpec = buildSquareExtrusionLayerSpec(
            this.squareExtrusionLayerSpec.id,
            config,
            computedRange,
        );
        const newSquareExtrusionHighlightSpec = buildSquareExtrusionHighlightLayerSpec(
            this.squareExtrusionHighlightLayerSpec.id,
            config,
            computedRange,
        );

        changeLayerProps(newHeatmapSpec, this.heatmapLayerSpec, this.mapLibreMap);
        changeLayerProps(newHexFillSpec, this.hexFillLayerSpec, this.mapLibreMap);
        changeLayerProps(newHexExtrusionSpec, this.hexExtrusionLayerSpec, this.mapLibreMap);
        changeLayerProps(newHexExtrusionHighlightSpec, this.hexExtrusionHighlightLayerSpec, this.mapLibreMap);
        changeLayerProps(newSquareFillSpec, this.squareFillLayerSpec, this.mapLibreMap);
        changeLayerProps(newSquareExtrusionSpec, this.squareExtrusionLayerSpec, this.mapLibreMap);
        changeLayerProps(newSquareExtrusionHighlightSpec, this.squareExtrusionHighlightLayerSpec, this.mapLibreMap);

        this.heatmapLayerSpec = newHeatmapSpec;
        this.hexFillLayerSpec = newHexFillSpec;
        this.hexExtrusionLayerSpec = newHexExtrusionSpec;
        this.hexExtrusionHighlightLayerSpec = newHexExtrusionHighlightSpec;
        this.squareFillLayerSpec = newSquareFillSpec;
        this.squareExtrusionLayerSpec = newSquareExtrusionSpec;
        this.squareExtrusionHighlightLayerSpec = newSquareExtrusionHighlightSpec;

        this.applyFiltersToLayers();
    }

    private applyRegionConfig(config: TrafficAreaAnalyticsConfig | undefined): void {
        const newRegionFillSpec = buildRegionFillLayerSpec(this.regionFillLayerSpec.id, config);
        const newRegionLineSpec = buildRegionLineLayerSpec(this.regionLineLayerSpec.id, config);

        changeLayerProps(newRegionFillSpec, this.regionFillLayerSpec, this.mapLibreMap);
        changeLayerProps(newRegionLineSpec, this.regionLineLayerSpec, this.mapLibreMap);

        this.regionFillLayerSpec = newRegionFillSpec;
        this.regionLineLayerSpec = newRegionLineSpec;

        // Re-apply region geometry in case `inverted` changed after data was already shown.
        if (this.lastAnalytics) {
            const inverted = config?.regionPolygon?.inverted ?? AREA_ANALYTICS_DEFAULTS.regionPolygon.inverted;
            this.sourcesWithLayers.region.show(this.buildRegionFC(this.lastAnalytics.features, inverted));
        }
    }

    private applyFiltersToLayers(): void {
        const metric = this.activeMetric;
        const filter = this.config?.metricConfig?.[metric]?.filters;

        const layerIds = [
            this.hexFillLayerSpec.id,
            this.hexExtrusionLayerSpec.id,
            this.squareFillLayerSpec.id,
            this.squareExtrusionLayerSpec.id,
        ];

        if (!filter || (filter.min === undefined && filter.max === undefined)) {
            for (const layerId of layerIds) {
                this.mapLibreMap.setFilter(layerId, null);
            }
            return;
        }

        const conditions: ExpressionSpecification[] = [];
        if (filter.min !== undefined) conditions.push(['>=', ['get', metric], filter.min]);
        if (filter.max !== undefined) conditions.push(['<=', ['get', metric], filter.max]);

        const filterExpr: ExpressionSpecification = conditions.length === 1 ? conditions[0] : ['any', ...conditions];

        for (const layerId of layerIds) {
            this.mapLibreMap.setFilter(layerId, filterExpr);
        }
    }

    private buildRegionFC(features: TrafficAreaAnalytics['features'], inverted: boolean): FeatureCollection {
        return {
            type: 'FeatureCollection',
            features: features.map((feature, i) => {
                const id = `traffic-area-analytics-region-${i}`;
                const geometry = inverted ? mask(feature as any).geometry : feature.geometry;
                return { ...feature, id, geometry, properties: { id } };
            }),
        };
    }

    private emitConfigChange(): void {
        for (const handler of this.configChangeHandlers) {
            handler(this.config);
        }
    }
}
