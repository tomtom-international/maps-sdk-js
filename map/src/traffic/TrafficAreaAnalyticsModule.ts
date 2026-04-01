import type { AreaAnalyticsTileEntry, TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Point, Polygon } from 'geojson';
import type { BeforeLayerConfig } from '../shared';
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, mapStyleLayerIDs } from '../shared';
import { changeLayerProps, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import {
    buildHeatmapLayerSpec,
    buildHexExtrusionLayerSpec,
    buildHexFillLayerSpec,
    buildRegionFillLayerSpec,
    buildRegionLineLayerSpec,
    buildSquareExtrusionLayerSpec,
    buildSquareFillLayerSpec,
} from './layers/areaAnalyticsLayers';
import type {
    AreaAnalyticsBeforeLayerConfig,
    AreaAnalyticsColorStop,
    AreaAnalyticsColorTheme,
    AreaAnalyticsMetricKey,
    AreaAnalyticsMode,
    AreaAnalyticsRangeConfig,
    AreaAnalyticsTooltipConfig,
    MetricRange,
    TrafficAreaAnalyticsConfig,
} from './types/trafficAreaAnalyticsConfig';
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

/** Handler type for config change listeners. */
type ConfigChangeHandler = (config: TrafficAreaAnalyticsConfig | undefined) => void;

/**
 * Traffic Area Analytics visualization module.
 *
 * Renders area-analytics data on the map in one of five modes:
 * - **hexgrid-3d** — 3D extruded hexagonal cells coloured and raised by the active metric (default)
 * - **hexgrid-2d** — Flat hexagonal cells coloured by the active metric
 * - **square-3d** — 3D extruded square cells coloured and raised by the active metric
 * - **square-2d** — Flat square cells coloured by the active metric
 * - **heatmap** — a MapLibre density-heatmap layer built from tile-centre points
 * - **tiles** — raw API tile centres as square polygons with original per-tile metric values
 *
 * The actual region boundary is always rendered alongside the analytics cells.
 *
 * @remarks
 * **Quick start:**
 * ```typescript
 * import { TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
 * import { trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
 *
 * const module = await TrafficAreaAnalyticsModule.get(map);
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
    private squareFillLayerSpec!: ReturnType<typeof buildSquareFillLayerSpec>;
    private squareExtrusionLayerSpec!: ReturnType<typeof buildSquareExtrusionLayerSpec>;
    private regionFillLayerSpec!: ReturnType<typeof buildRegionFillLayerSpec>;
    private regionLineLayerSpec!: ReturnType<typeof buildRegionLineLayerSpec>;

    /** Cached for style-change restoration. */
    private lastAnalytics: TrafficAreaAnalytics | null = null;

    /** Data-driven metric ranges computed from actual tile values. */
    private computedRanges: Partial<Record<AreaAnalyticsMetricKey, MetricRange>> = {};

    /** Config change listeners. */
    private configChangeHandlers: ConfigChangeHandler[] = [];

    /** Tooltip popup instance (created lazily when tooltip is enabled). */
    private tooltipPopup: Popup | null = null;
    private tooltipBound = false;

    // ── Factory ──────────────────────────────────────────────────────

    /**
     * Creates a new Traffic Area Analytics module.
     *
     * @param tomtomMap - The TomTomMap instance.
     * @param config - Optional initial configuration.
     * @returns A promise that resolves with the initialised module.
     *
     * @example
     * ```typescript
     * const module = await TrafficAreaAnalyticsModule.get(map, {
     *   displayMode: 'hexgrid-3d',
     *   color: 'thermal',
     *   metric: 'congestionLevel',
     *   tooltip: { enabled: true },
     * });
     * ```
     */
    static async get(tomtomMap: TomTomMap, config?: TrafficAreaAnalyticsConfig): Promise<TrafficAreaAnalyticsModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new TrafficAreaAnalyticsModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: TrafficAreaAnalyticsConfig) {
        super('geojson', map, config);
    }

    // ── Config helpers ───────────────────────────────────────────────

    private get mode(): AreaAnalyticsMode {
        return this.config?.mode ?? 'hexgrid';
    }

    private get metric(): AreaAnalyticsMetricKey {
        return this.config?.metric ?? 'congestionLevel';
    }

    private get colorScheme(): AreaAnalyticsColorScheme {
        return this.config?.colorScheme ?? 'congestion';
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
        const squareFillLayerId = `${squareSourceId}-fill`;
        const squareExtrusionLayerId = `${squareSourceId}-extrusion`;
        const regionFillLayerId = `${regionSourceId}-fill`;
        const regionLineLayerId = `${regionSourceId}-line`;

        this.heatmapLayerSpec = buildHeatmapLayerSpec(heatmapLayerId, config);
        this.hexFillLayerSpec = buildHexFillLayerSpec(hexFillLayerId, config);
        this.hexExtrusionLayerSpec = buildHexExtrusionLayerSpec(hexExtrusionLayerId, config);
        this.squareFillLayerSpec = buildSquareFillLayerSpec(squareFillLayerId, config);
        this.squareExtrusionLayerSpec = buildSquareExtrusionLayerSpec(squareExtrusionLayerId, config);
        this.regionFillLayerSpec = buildRegionFillLayerSpec(regionFillLayerId, config);
        this.regionLineLayerSpec = buildRegionLineLayerSpec(regionLineLayerId, config);

        return {
            heatmap: new GeoJSONSourceWithLayers(this.mapLibreMap, heatmapSourceId, [this.heatmapLayerSpec]),
            hexgrid: new GeoJSONSourceWithLayers(this.mapLibreMap, hexgridSourceId, [
                this.hexFillLayerSpec,
                this.hexExtrusionLayerSpec,
            ]),
            square: new GeoJSONSourceWithLayers(this.mapLibreMap, squareSourceId, [
                this.squareFillLayerSpec,
                this.squareExtrusionLayerSpec,
            ]),
            region: new GeoJSONSourceWithLayers(this.mapLibreMap, regionSourceId, [
                this.regionFillLayerSpec,
                this.regionLineLayerSpec,
            ]),
            tiles: new GeoJSONSourceWithLayers(this.mapLibreMap, tilesSourceId, [
                buildTileFillLayerSpec(this.tileFillLayerId),
                buildTileExtrusionLayerSpec(this.tileExtrusionLayerId),
            ]),
        };
    }

    /** @ignore */
    protected _applyConfig(config: TrafficAreaAnalyticsConfig | undefined): TrafficAreaAnalyticsConfig | undefined {
        const merged = config !== undefined ? { ...this.config, ...config } : undefined;

        if (merged?.metric || merged?.displayMode || merged?.color) {
            this.applyLayerConfig(merged);
        }

        if (merged?.regionPolygon) {
            this.applyRegionConfig(merged);
        }

        if (merged?.beforeLayerConfig) {
            this.moveBeforeLayer(merged.beforeLayerConfig);
        }

        if (merged?.visible === false) {
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
            // Applying paint properties to empty sources causes a race condition.
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
     * (hexgrid / hexgrid-flat), and square polygons (square-3d / square-flat).
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

        const tiles = analytics.features.flatMap((f) => f.properties?.tiledData?.tiles ?? []);

        // Compute data-driven ranges for color/height scaling
        this.computedRanges = this.computeRangesFromTiles(tiles);

        this.sourcesWithLayers.heatmap.show(tilesToPointFeatures(tiles));
        this.sourcesWithLayers.hexgrid.show(tilesToHexFeatures(tiles));
        this.sourcesWithLayers.square.show(tilesToSquareFeatures(tiles));

        this.sourcesWithLayers.region.show({
            type: 'FeatureCollection',
            features: analytics.features.map((feature, i) => ({
                ...feature,
                id: `traffic-area-analytics-region-${i}`,
                properties: { id: `traffic-area-analytics-region-${i}` },
            })),
        });

        this.applyMetricToLayers(this.metric);
        this.applyModeVisibility();

        // Enable tooltip if configured
        if (this.config?.tooltip?.enabled) {
            this.enableTooltip();
        }
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
    setMode(mode: AreaAnalyticsMode): void {
        if (mode === this.mode) return;
        this.config = { ...this.config, displayMode: mode };
        this.applyModeVisibility();
    }

    /**
     * Changes the active metric that drives colour and height.
     *
     * @param metric - One of `'congestionLevel'`, `'speed'`, or `'travelTime'`.
     */
    setMetric(metric: AreaAnalyticsMetricKey): void {
        if (metric === this.metric) return;
        this.config = { ...this.config, metric };
        this.applyLayerConfig(this.config);
    }

    /**
     * Sets the color for the analytics layers. Accepts either a preset theme name or
     * per-metric custom color stops. Pass `undefined` to revert to the default preset (`'congestion'`).
     *
     * @param color - A preset theme name, a partial record of metric → color stops, or `undefined`.
     *
     * @example
     * ```typescript
     * module.setColor('thermal');
     * module.setColor({
     *   congestionLevel: [
     *     { value: 0,   color: '#2dc653' },
     *     { value: 0.5, color: '#f5a623' },
     *     { value: 1,   color: '#e03030' },
     *   ],
     * });
     * ```
     */
    setColorScheme(scheme: AreaAnalyticsColorScheme): void {
        if (scheme === this.colorScheme) return;
        this.config = { ...this.config, colorScheme: scheme, colors: undefined };
        this.applyMetricToLayers(this.metric);
        this.emitConfigChange();
    }

    /**
     * Sets custom colors for the visualization.
     *
     * @param colorConfig - Custom color config with three-stop `stops` or a `preset`.
     *
     * @example
     * ```typescript
     * module.setColors({ stops: ['#00ff00', '#ffff00', '#ff0000'] });
     * module.setColors({ preset: 'thermal' });
     * ```
     */
    setColors(colorConfig: AreaAnalyticsColorConfig): void {
        this.config = { ...this.config, colors: colorConfig };
        this.applyMetricToLayers(this.metric);
        this.emitConfigChange();
    }

    /**
     * Configures metric range strategy for a specific metric.
     *
     * @param metric - Metric to configure.
     * @param rangeConfig - Range configuration.
     *
     * @example
     * ```typescript
     * module.setRanges('travelTime', { strategy: 'auto' });
     * module.setRanges('congestionLevel', { fixed: { min: 0, mid: 30, max: 60 } });
     * ```
     */
    setRanges(metric: AreaAnalyticsMetricKey, rangeConfig: AreaAnalyticsRangeConfig): void {
        this.config = {
            ...this.config,
            ranges: { ...this.config?.ranges, [metric]: rangeConfig },
        };
        this.applyMetricToLayers(this.metric);
        this.emitConfigChange();
    }

    /**
     * Configures extrusion height behaviour.
     *
     * @param heightConfig - Height configuration.
     *
     * @example
     * ```typescript
     * module.setHeight({ scale: 100, minHeight: 5 });
     * module.setHeight({ flat: true });
     * ```
     */
    setHeight(heightConfig: AreaAnalyticsHeightConfig): void {
        this.config = { ...this.config, height: heightConfig };
        this.applyMetricToLayers(this.metric);
        this.emitConfigChange();
    }

    /**
     * Filters visible tiles by metric thresholds.
     *
     * @param filters - Filter config with OR logic. Pass `undefined` to clear.
     *
     * @example
     * ```typescript
     * module.filter({ any: [{ metric: 'congestionLevel', min: 50 }] });
     * module.filter(undefined); // clear filter
     * ```
     */
    filter(filters?: AreaAnalyticsFilters): void {
        this.config = { ...this.config, filters };
        this.applyFiltersToLayers(filters);
        this.emitConfigChange();
    }

    /**
     * Clears any active tile filter.
     */
    clearFilter(): void {
        this.filter(undefined);
    }

    /**
     * Configures the built-in hover tooltip.
     *
     * @param tooltipConfig - Tooltip configuration.
     *
     * @example
     * ```typescript
     * module.setTooltip({ enabled: true });
     * module.setTooltip({ enabled: true, metrics: ['congestionLevel', 'speed'] });
     * module.setTooltip({ enabled: false }); // disable
     * ```
     */
    setTooltip(tooltipConfig: AreaAnalyticsTooltipConfig): void {
        this.config = { ...this.config, tooltip: tooltipConfig };
        if (tooltipConfig.enabled) {
            this.enableTooltip();
        } else {
            this.disableTooltip();
        }
        this.emitConfigChange();
    setColor(
        color: AreaAnalyticsColorTheme | Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsColorStop[]>> | undefined,
    ): void {
        this.config = { ...this.config, color };
        this.applyLayerConfig(this.config);
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
        const toId = (v: BeforeLayerConfig) => (v === 'top' ? undefined : mapStyleLayerIDs[v]);

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
     * Event interface for the hexgrid and square layers (hover / click on cells).
     * Registers handlers on both sources so events fire regardless of the active mode.
     *
     * @example
     * ```typescript
     * module.events.on('hover', (feature, lngLat) => {
     *   console.log(feature.properties.congestionLevel);
     * });
     * ```
     */
    get events() {
        return new EventsModule<AreaAnalyticsTileFeature>(
            this.tomtomMap._eventsProxy,
            [this.sourcesWithLayers.hexgrid, this.sourcesWithLayers.square, this.sourcesWithLayers.heatmap],
            this.config?.events,
        );
    }

    /**
     * Register a listener for config changes.
     * Fires whenever any setter is called (setMode, setMetric, setColors, filter, etc.).
     *
     * @returns An unsubscribe function.
     *
     * @example
     * ```typescript
     * const unsub = module.on('configChange', (config) => {
     *   console.log('Metric changed to:', config?.metric);
     * });
     * // Later: unsub();
     * ```
     */
    on(event: 'configChange', handler: ConfigChangeHandler): () => void {
        if (event === 'configChange') {
            this.configChangeHandlers.push(handler);
            return () => {
                this.configChangeHandlers = this.configChangeHandlers.filter((h) => h !== handler);
            };
        }
        return () => {};
    }

    // ── Private helpers ──────────────────────────────────────────────

    private get mode(): AreaAnalyticsMode {
        return this.config?.displayMode ?? 'hexgrid-3d';
    }

    private get metric(): AreaAnalyticsMetricKey {
        return this.config?.metric ?? 'congestionLevel';
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

        this.sourcesWithLayers.heatmap.setLayersVisible(mode === 'heatmap' && hasHeatmapData);

        // Hexgrid: show extrusion in 3d mode, fill in flat mode
        this.sourcesWithLayers.hexgrid.setLayersVisible(
            mode === 'hexgrid-3d' && hasHexData,
            (layerSpec) => layerSpec.type === 'fill-extrusion',
        );
        this.sourcesWithLayers.hexgrid.setLayersVisible(
            mode === 'hexgrid-2d' && hasHexData,
            (layerSpec) => layerSpec.type === 'fill',
        );

        // Square: show extrusion in 3d mode, fill in flat mode
        this.sourcesWithLayers.square.setLayersVisible(
            mode === 'square-3d' && hasSquareData,
            (layerSpec) => layerSpec.type === 'fill-extrusion',
        );
        this.sourcesWithLayers.square.setLayersVisible(
            mode === 'square-2d' && hasSquareData,
            (layerSpec) => layerSpec.type === 'fill',
        );

        this.sourcesWithLayers.region.setLayersVisible(hasRegionData);
    }

    private hideAllDataLayers(): void {
        this.sourcesWithLayers.heatmap.setLayersVisible(false);
        this.sourcesWithLayers.hexgrid.setLayersVisible(false);
        this.sourcesWithLayers.square.setLayersVisible(false);
        this.sourcesWithLayers.region.setLayersVisible(false);
        this.sourcesWithLayers.heatmap.setLayersVisible(this.mode === 'heatmap' && hasHeatmapData);
        this.sourcesWithLayers.hexgrid.setLayersVisible(this.mode === 'hexgrid' && hasHexData);
        this.sourcesWithLayers.tiles.setLayersVisible(this.mode === 'tiles' && hasTileData);
    }

    private resolveRange(metric: AreaAnalyticsMetricKey): MetricRange {
        const rangeConfig = this.config?.ranges?.[metric];
        const hardcoded = METRIC_RANGES[metric];
        const computed = this.computedRanges?.[metric];

        // Explicit fixed range takes priority
        if (rangeConfig?.fixed) return rangeConfig.fixed;

        const strategy = rangeConfig?.strategy ?? 'union';

        if (strategy === 'fixed' || !computed) return hardcoded;

        if (strategy === 'auto') return computed;

        // 'union': expand hardcoded range to include actual data
        return {
            min: Math.min(hardcoded.min, computed.min),
            mid: (Math.min(hardcoded.min, computed.min) + Math.max(hardcoded.max, computed.max)) / 2,
            max: Math.max(hardcoded.max, computed.max),
        };
    }

    private applyLayerConfig(config: TrafficAreaAnalyticsConfig | undefined): void {
        const newHeatmapSpec = buildHeatmapLayerSpec(this.heatmapLayerSpec.id, config);
        const newHexFillSpec = buildHexFillLayerSpec(this.hexFillLayerSpec.id, config);
        const newHexExtrusionSpec = buildHexExtrusionLayerSpec(this.hexExtrusionLayerSpec.id, config);
        const newSquareFillSpec = buildSquareFillLayerSpec(this.squareFillLayerSpec.id, config);
        const newSquareExtrusionSpec = buildSquareExtrusionLayerSpec(this.squareExtrusionLayerSpec.id, config);

        changeLayerProps(newHeatmapSpec, this.heatmapLayerSpec, this.mapLibreMap);
        changeLayerProps(newHexFillSpec, this.hexFillLayerSpec, this.mapLibreMap);
        changeLayerProps(newHexExtrusionSpec, this.hexExtrusionLayerSpec, this.mapLibreMap);
        changeLayerProps(newSquareFillSpec, this.squareFillLayerSpec, this.mapLibreMap);
        changeLayerProps(newSquareExtrusionSpec, this.squareExtrusionLayerSpec, this.mapLibreMap);

        this.heatmapLayerSpec = newHeatmapSpec;
        this.hexFillLayerSpec = newHexFillSpec;
        this.hexExtrusionLayerSpec = newHexExtrusionSpec;
        this.squareFillLayerSpec = newSquareFillSpec;
        this.squareExtrusionLayerSpec = newSquareExtrusionSpec;
    }

    private applyRegionConfig(config: TrafficAreaAnalyticsConfig | undefined): void {
        const newRegionFillSpec = buildRegionFillLayerSpec(this.regionFillLayerSpec.id, config);
        const newRegionLineSpec = buildRegionLineLayerSpec(this.regionLineLayerSpec.id, config);

        changeLayerProps(newRegionFillSpec, this.regionFillLayerSpec, this.mapLibreMap);
        changeLayerProps(newRegionLineSpec, this.regionLineLayerSpec, this.mapLibreMap);

        this.regionFillLayerSpec = newRegionFillSpec;
        this.regionLineLayerSpec = newRegionLineSpec;
    }

    private applyFiltersToLayers(filters?: AreaAnalyticsFilters): void {
        const layerIds = [
            this.hexFillLayerId,
            this.hexExtrusionLayerId,
            this.tileFillLayerId,
            this.tileExtrusionLayerId,
        ];

        if (!filters || filters.any.length === 0) {
            // Clear filters
            for (const layerId of layerIds) {
                this.mapLibreMap.setFilter(layerId, null);
            }
            return;
        }

        // Build OR filter expression: ['any', condition1, condition2, ...]
        const conditions = filters.any
            .map((f) => {
                const parts: unknown[] = [];
                if (f.min !== undefined) parts.push(['>=', ['get', f.metric], f.min]);
                if (f.max !== undefined) parts.push(['<=', ['get', f.metric], f.max]);
                if (parts.length === 0) return null;
                return parts.length === 1 ? parts[0] : ['all', ...parts];
            })
            .filter(Boolean);

        const filterExpr = conditions.length === 1 ? conditions[0] : ['any', ...conditions];

        for (const layerId of layerIds) {
            this.mapLibreMap.setFilter(layerId, filterExpr);
        }
    }

    /**
     * Compute data-driven metric ranges from actual tile values.
     * Uses min/median/max so the color gradient spans the real data distribution.
     */
    private computeRangesFromTiles(
        tiles: ReadonlyArray<AreaAnalyticsTileEntry>,
    ): Partial<Record<AreaAnalyticsMetricKey, MetricRange>> {
        const compute = (values: number[]): MetricRange | undefined => {
            if (values.length === 0) return undefined;
            const sorted = [...values].sort((a, b) => a - b);
            return {
                min: sorted[0],
                mid: sorted[Math.floor(sorted.length / 2)],
                max: sorted[sorted.length - 1],
            };
        };

        const extract = (key: keyof AreaAnalyticsTileEntry) =>
            tiles.map((t) => t[key]).filter((v): v is number => v != null);

        return {
            congestionLevel: compute(extract('congestionLevel')),
            speed: compute(extract('speed')),
            travelTime: compute(extract('travelTime')),
        };
    }

    // ── Tooltip ─────────────────────────────────────────────────────

    private enableTooltip(): void {
        if (this.tooltipBound) return;

        this.tooltipBound = true;

        this.tooltipPopup = new Popup({
            closeButton: false,
            closeOnClick: true,
            anchor: 'left',
            offset: 12,
            maxWidth: '220px',
        });

        this.events.on('hover', (feature, lngLat) => {
            if (!this.tooltipPopup) return;

            if (!feature) {
                this.tooltipPopup.remove();
                return;
            }

            const p = feature.properties as AreaAnalyticsDisplayProperties;
            const tooltipConfig = this.config?.tooltip;

            let html: string;
            if (tooltipConfig?.formatter) {
                html = tooltipConfig.formatter(p);
            } else {
                const metrics = tooltipConfig?.metrics ?? (['congestionLevel', 'speed', 'travelTime'] as const);
                const rows = metrics
                    .filter((m) => p[m] != null && p[m] !== 0)
                    .map((m) => {
                        const label = m === 'congestionLevel' ? 'Congestion' : m === 'speed' ? 'Speed' : 'Travel Time';
                        const unit = m === 'congestionLevel' ? '%' : m === 'speed' ? ' km/h' : ' min/10km';
                        return `<div style="display:flex;justify-content:space-between;gap:12px"><span>${label}</span><strong>${p[m]}${unit}</strong></div>`;
                    });
                html = rows.join('');
                if (!html) return; // No non-zero metrics to show
            }

            this.tooltipPopup.setLngLat(lngLat).setHTML(html).addTo(this.mapLibreMap);
        });

        this.mapLibreMap.getCanvas().addEventListener('mouseleave', this.handleMouseLeave);
    }

    private disableTooltip(): void {
        if (!this.tooltipBound) return;

        this.tooltipBound = false;
        this.tooltipPopup?.remove();
        this.tooltipPopup = null;
        this.mapLibreMap.getCanvas().removeEventListener('mouseleave', this.handleMouseLeave);
    }

    private handleMouseLeave = (): void => {
        this.tooltipPopup?.remove();
    };
}
