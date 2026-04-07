import type { AreaAnalyticsTileEntry, TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Point, Polygon } from 'geojson';
import { type ExpressionSpecification, Popup } from 'maplibre-gl';
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers } from '../shared';
import { waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import {
    buildColorExpression,
    buildHeatmapColorExpression,
    buildHeatmapLayerSpec,
    buildHeightExpression,
    buildHexExtrusionLayerSpec,
    buildHexFillLayerSpec,
    buildTileExtrusionLayerSpec,
    buildTileFillLayerSpec,
    METRIC_RANGES,
    resolveColorStops,
} from './layers/areaAnalyticsLayers';
import type {
    AreaAnalyticsColorConfig,
    AreaAnalyticsColorScheme,
    AreaAnalyticsFilters,
    AreaAnalyticsHeightConfig,
    AreaAnalyticsMetricKey,
    AreaAnalyticsMode,
    AreaAnalyticsRangeConfig,
    AreaAnalyticsTooltipConfig,
    MetricRange,
    TrafficAreaAnalyticsConfig,
} from './types/trafficAreaAnalyticsConfig';
import type { AreaAnalyticsDisplayProperties, AreaAnalyticsHexFeature } from './types/trafficAreaAnalyticsFeature';
import { tilesToHexFeatures, tilesToPointFeatures, tilesToSquareFeatures } from './util/areaAnalyticsTransform';

/**
 * Sources and layers managed by this module.
 */
type AreaAnalyticsSourcesWithLayers = {
    heatmap: GeoJSONSourceWithLayers<FeatureCollection<Point, AreaAnalyticsDisplayProperties>>;
    hexgrid: GeoJSONSourceWithLayers<FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>>;
    tiles: GeoJSONSourceWithLayers<FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>>;
};

/** Handler type for config change listeners. */
type ConfigChangeHandler = (config: TrafficAreaAnalyticsConfig | undefined) => void;

/**
 * Traffic Area Analytics visualization module.
 *
 * Renders area-analytics data on the map in one of three modes:
 * - **hexgrid** — 3D extruded hexagonal polygons coloured and raised by the active metric
 * - **heatmap** — a MapLibre density-heatmap layer built from tile-centre points
 * - **tiles** — raw API tile centres as square polygons with original per-tile metric values
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

    /** Named layer IDs for explicit access in paint updates. */
    private heatmapLayerId!: string;
    private hexFillLayerId!: string;
    private hexExtrusionLayerId!: string;
    private tileFillLayerId!: string;
    private tileExtrusionLayerId!: string;

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
     *   mode: 'hexgrid',
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
        _config?: TrafficAreaAnalyticsConfig,
        restore?: boolean,
    ): AreaAnalyticsSourcesWithLayers {
        if (!restore) {
            TrafficAreaAnalyticsModule.lastInstanceIndex++;
        }

        const idx = TrafficAreaAnalyticsModule.lastInstanceIndex;
        const heatmapSourceId = `area-analytics-heatmap-${idx}`;
        const hexgridSourceId = `area-analytics-hexgrid-${idx}`;
        const tilesSourceId = `area-analytics-tiles-${idx}`;

        this.heatmapLayerId = `${heatmapSourceId}-layer`;
        this.hexFillLayerId = `${hexgridSourceId}-fill`;
        this.hexExtrusionLayerId = `${hexgridSourceId}-extrusion`;
        this.tileFillLayerId = `${tilesSourceId}-fill`;
        this.tileExtrusionLayerId = `${tilesSourceId}-extrusion`;

        return {
            heatmap: new GeoJSONSourceWithLayers(this.mapLibreMap, heatmapSourceId, [
                buildHeatmapLayerSpec(this.heatmapLayerId),
            ]),
            hexgrid: new GeoJSONSourceWithLayers(this.mapLibreMap, hexgridSourceId, [
                buildHexFillLayerSpec(this.hexFillLayerId),
                buildHexExtrusionLayerSpec(this.hexExtrusionLayerId),
            ]),
            tiles: new GeoJSONSourceWithLayers(this.mapLibreMap, tilesSourceId, [
                buildTileFillLayerSpec(this.tileFillLayerId),
                buildTileExtrusionLayerSpec(this.tileExtrusionLayerId),
            ]),
        };
    }

    /** @ignore */
    protected _applyConfig(config: TrafficAreaAnalyticsConfig | undefined): TrafficAreaAnalyticsConfig | undefined {
        if (config?.metric) {
            this.applyMetricToLayers(config.metric);
        }
        if (config?.visible === false) {
            this.setVisible(false);
        }
        if (config?.tooltip?.enabled) {
            this.enableTooltip();
        }
        this.applyModeVisibility();
        return config;
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
     * transformed internally to point features (heatmap), hexagonal
     * polygons (hexgrid), and square polygons (tiles) — no manual data preparation is needed.
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

        const region = analytics.features[0]?.properties;
        const tiles = region?.tiledData?.tiles ?? [];

        // Compute data-driven ranges for color/height scaling
        this.computedRanges = this.computeRangesFromTiles(tiles);

        this.sourcesWithLayers.heatmap.show(tilesToPointFeatures(tiles));
        this.sourcesWithLayers.hexgrid.show(tilesToHexFeatures(tiles));
        this.sourcesWithLayers.tiles.show(tilesToSquareFeatures(tiles));

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
        this.sourcesWithLayers.tiles.clear();
    }

    /**
     * Switches the visualisation mode.
     *
     * @param mode - `'heatmap'`, `'hexgrid'`, or `'tiles'`.
     */
    setMode(mode: AreaAnalyticsMode): void {
        if (mode === this.mode) return;
        this.config = { ...this.config, mode };
        this.applyModeVisibility();
        this.emitConfigChange();
    }

    /**
     * Changes the active metric that drives colour and height.
     *
     * @param metric - One of `'congestionLevel'`, `'speed'`, or `'travelTime'`.
     */
    setMetric(metric: AreaAnalyticsMetricKey): void {
        if (metric === this.metric) return;
        this.config = { ...this.config, metric };
        this.applyMetricToLayers(metric);
        this.emitConfigChange();
    }

    /**
     * Changes the color scheme preset.
     *
     * @param scheme - One of `'congestion'`, `'thermal'`, or `'monochrome'`.
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
     * Whether any area analytics layer is currently visible.
     */
    isVisible(): boolean {
        return (
            this.sourcesWithLayers.heatmap.isAnyLayerVisible() ||
            this.sourcesWithLayers.hexgrid.isAnyLayerVisible() ||
            this.sourcesWithLayers.tiles.isAnyLayerVisible()
        );
    }

    /**
     * Returns the currently displayed data for all visualisation modes.
     */
    getShown() {
        return {
            heatmap: this.sourcesWithLayers.heatmap.shownFeatures,
            hexgrid: this.sourcesWithLayers.hexgrid.shownFeatures,
            tiles: this.sourcesWithLayers.tiles.shownFeatures,
        };
    }

    /**
     * Event interface for the hexgrid/tile layers (hover / click on cells).
     *
     * @example
     * ```typescript
     * module.events.on('hover', (feature, lngLat) => {
     *   console.log(feature.properties.congestionLevel);
     * });
     * ```
     */
    get events() {
        const activeSource = this.mode === 'tiles' ? this.sourcesWithLayers.tiles : this.sourcesWithLayers.hexgrid;
        return new EventsModule<AreaAnalyticsHexFeature>(
            this.tomtomMap._eventsProxy,
            activeSource,
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

    private emitConfigChange(): void {
        for (const handler of this.configChangeHandlers) {
            handler(this.config);
        }
    }

    private applyModeVisibility(): void {
        if (this.config?.visible === false) {
            this.sourcesWithLayers.heatmap.setLayersVisible(false);
            this.sourcesWithLayers.hexgrid.setLayersVisible(false);
            this.sourcesWithLayers.tiles.setLayersVisible(false);
            return;
        }

        const hasHeatmapData = this.sourcesWithLayers.heatmap.shownFeatures.features.length > 0;
        const hasHexData = this.sourcesWithLayers.hexgrid.shownFeatures.features.length > 0;
        const hasTileData = this.sourcesWithLayers.tiles.shownFeatures.features.length > 0;

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

    private applyMetricToLayers(metric: AreaAnalyticsMetricKey): void {
        const range = this.resolveRange(metric);
        const colors = resolveColorStops(this.config?.colors, this.colorScheme);
        const colorExpr = buildColorExpression(metric, colors, range);
        const heightExpr = buildHeightExpression(metric, range, this.config?.height);

        // Hex fill colour
        this.mapLibreMap.setPaintProperty(this.hexFillLayerId, 'fill-color', colorExpr, { validate: false });

        // Hex extrusion colour + height
        this.mapLibreMap.setPaintProperty(this.hexExtrusionLayerId, 'fill-extrusion-color', colorExpr, {
            validate: false,
        });
        this.mapLibreMap.setPaintProperty(this.hexExtrusionLayerId, 'fill-extrusion-height', heightExpr, {
            validate: false,
        });

        // Tile fill colour
        this.mapLibreMap.setPaintProperty(this.tileFillLayerId, 'fill-color', colorExpr, { validate: false });

        // Tile extrusion colour + height
        this.mapLibreMap.setPaintProperty(this.tileExtrusionLayerId, 'fill-extrusion-color', colorExpr, {
            validate: false,
        });
        this.mapLibreMap.setPaintProperty(this.tileExtrusionLayerId, 'fill-extrusion-height', heightExpr, {
            validate: false,
        });

        // Heatmap weight + color
        const { min, max } = range;
        this.mapLibreMap.setPaintProperty(
            this.heatmapLayerId,
            'heatmap-weight',
            ['interpolate', ['linear'], ['get', metric], min, 0, max, 1],
            { validate: false },
        );
        this.mapLibreMap.setPaintProperty(this.heatmapLayerId, 'heatmap-color', buildHeatmapColorExpression(colors), {
            validate: false,
        });
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
            this.mapLibreMap.setFilter(layerId, filterExpr as ExpressionSpecification);
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
