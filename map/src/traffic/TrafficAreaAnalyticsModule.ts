import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Point, Polygon } from 'geojson';
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
    METRIC_RANGES,
} from './layers/areaAnalyticsLayers';
import type {
    AreaAnalyticsColorScheme,
    AreaAnalyticsMetricKey,
    AreaAnalyticsMode,
    TrafficAreaAnalyticsConfig,
} from './types/trafficAreaAnalyticsConfig';
import type { AreaAnalyticsDisplayProperties, AreaAnalyticsHexFeature } from './types/trafficAreaAnalyticsFeature';
import { tilesToHexFeatures, tilesToPointFeatures } from './util/areaAnalyticsTransform';

/**
 * Sources and layers managed by this module.
 */
type AreaAnalyticsSourcesWithLayers = {
    heatmap: GeoJSONSourceWithLayers<FeatureCollection<Point, AreaAnalyticsDisplayProperties>>;
    hexgrid: GeoJSONSourceWithLayers<FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>>;
};

/**
 * Traffic Area Analytics visualization module.
 *
 * Renders area-analytics data on the map in one of two modes:
 * - **hexgrid** — 3D extruded hexagonal polygons coloured and raised by the active metric
 * - **heatmap** — a MapLibre density-heatmap layer built from tile-centre points
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

    /** Cached for style-change restoration. */
    private lastAnalytics: TrafficAreaAnalytics | null = null;

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

    private get mode(): 'heatmap' | 'hexgrid' {
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

        this.heatmapLayerId = `${heatmapSourceId}-layer`;

        this.hexFillLayerId = `${hexgridSourceId}-fill`;
        this.hexExtrusionLayerId = `${hexgridSourceId}-extrusion`;

        return {
            heatmap: new GeoJSONSourceWithLayers(this.mapLibreMap, heatmapSourceId, [
                buildHeatmapLayerSpec(this.heatmapLayerId),
            ]),
            hexgrid: new GeoJSONSourceWithLayers(this.mapLibreMap, hexgridSourceId, [
                buildHexFillLayerSpec(this.hexFillLayerId),
                buildHexExtrusionLayerSpec(this.hexExtrusionLayerId),
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
        this.applyModeVisibility();
        return config;
    }

    /** @ignore */
    protected restoreDataAndConfigImpl(): void {
        const cachedAnalytics = this.lastAnalytics;
        this.initSourcesWithLayers(this.config, true);
        if (this.config) {
            this._applyConfig(this.config);
        }
        if (cachedAnalytics) {
            void this.show(cachedAnalytics);
        }
    }

    // ── Public API ───────────────────────────────────────────────────

    /**
     * Displays area analytics data on the map.
     *
     * Accepts the raw response from `trafficAreaAnalytics()`. Tile data is
     * transformed internally to point features (heatmap) and hexagonal
     * polygons (hexgrid) — no manual data preparation is needed.
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

        this.sourcesWithLayers.heatmap.show(tilesToPointFeatures(tiles));
        this.sourcesWithLayers.hexgrid.show(tilesToHexFeatures(tiles));

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
    }

    /**
     * Switches the visualisation mode.
     *
     * @param mode - `'heatmap'` or `'hexgrid'`.
     */
    setMode(mode: AreaAnalyticsMode): void {
        if (mode === this.mode) return;
        this.config = { ...this.config, mode };
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
        this.applyMetricToLayers(metric);
    }

    /**
     * Changes the color scheme preset.
     *
     * @param scheme - One of `'congestion'`, `'thermal'`, or `'monochrome'`.
     */
    setColorScheme(scheme: AreaAnalyticsColorScheme): void {
        if (scheme === this.colorScheme) return;
        this.config = { ...this.config, colorScheme: scheme };
        this.applyMetricToLayers(this.metric);
    }

    /**
     * Shows or hides all area analytics layers.
     */
    setVisible(visible: boolean): void {
        this.config = { ...this.config, visible };
        this.applyModeVisibility();
    }

    /**
     * Whether any area analytics layer is currently visible.
     */
    isVisible(): boolean {
        return this.sourcesWithLayers.heatmap.isAnyLayerVisible() || this.sourcesWithLayers.hexgrid.isAnyLayerVisible();
    }

    /**
     * Returns the currently displayed data for both visualisation modes.
     */
    getShown() {
        return {
            heatmap: this.sourcesWithLayers.heatmap.shownFeatures,
            hexgrid: this.sourcesWithLayers.hexgrid.shownFeatures,
        };
    }

    /**
     * Event interface for the hexgrid layer (hover / click on hexagonal cells).
     *
     * @example
     * ```typescript
     * module.events.on('hover', (feature, lngLat) => {
     *   console.log(feature.properties.congestionLevel);
     * });
     * ```
     */
    get events() {
        return new EventsModule<AreaAnalyticsHexFeature>(
            this.tomtomMap._eventsProxy,
            this.sourcesWithLayers.hexgrid,
            this.config?.events,
        );
    }

    // ── Private helpers ──────────────────────────────────────────────

    private applyModeVisibility(): void {
        if (this.config?.visible === false) {
            this.sourcesWithLayers.heatmap.setLayersVisible(false);
            this.sourcesWithLayers.hexgrid.setLayersVisible(false);
            return;
        }

        const hasHeatmapData = this.sourcesWithLayers.heatmap.shownFeatures.features.length > 0;
        const hasHexData = this.sourcesWithLayers.hexgrid.shownFeatures.features.length > 0;

        this.sourcesWithLayers.heatmap.setLayersVisible(this.mode === 'heatmap' && hasHeatmapData);
        this.sourcesWithLayers.hexgrid.setLayersVisible(this.mode === 'hexgrid' && hasHexData);
    }

    private applyMetricToLayers(metric: AreaAnalyticsMetricKey): void {
        const colorExpr = buildColorExpression(metric, this.colorScheme);
        const heightExpr = buildHeightExpression(metric);

        // Hex fill colour
        this.mapLibreMap.setPaintProperty(this.hexFillLayerId, 'fill-color', colorExpr, { validate: false });

        // Hex extrusion colour + height
        this.mapLibreMap.setPaintProperty(this.hexExtrusionLayerId, 'fill-extrusion-color', colorExpr, {
            validate: false,
        });
        this.mapLibreMap.setPaintProperty(this.hexExtrusionLayerId, 'fill-extrusion-height', heightExpr, {
            validate: false,
        });

        // Heatmap weight + color
        const { min, max } = METRIC_RANGES[metric];
        this.mapLibreMap.setPaintProperty(
            this.heatmapLayerId,
            'heatmap-weight',
            ['interpolate', ['linear'], ['get', metric], min, 0, max, 1],
            { validate: false },
        );
        this.mapLibreMap.setPaintProperty(
            this.heatmapLayerId,
            'heatmap-color',
            buildHeatmapColorExpression(this.colorScheme),
            { validate: false },
        );
    }
}
