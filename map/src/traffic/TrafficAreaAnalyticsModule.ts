import type { FeatureCollection, Point, Polygon } from 'geojson';
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, mapStyleLayerIDs } from '../shared';
import { waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import {
    buildColorExpression,
    buildHeightExpression,
    buildHeatmapLayerSpec,
    buildHexExtrusionLayerSpec,
    buildHexFillLayerSpec,
} from './layers/areaAnalyticsLayers';
import type { AreaAnalyticsMetricKey, TrafficAreaAnalyticsConfig } from './types/trafficAreaAnalyticsConfig';
import type {
    AreaAnalyticsDisplayProperties,
    AreaAnalyticsHexFeature,
    TrafficAreaAnalyticsDisplayData,
} from './types/trafficAreaAnalyticsFeature';

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
 * Renders area-analytics tile data on the map in one of two modes:
 * - **hexgrid** — 3D extruded hexagonal polygons coloured and raised by the active metric
 * - **heatmap** — a MapLibre density-heatmap layer built from tile-centre points
 *
 * The module does **not** call the `trafficAreaAnalytics` service itself. Instead
 * the consumer fetches the data, transforms tiles into GeoJSON, and passes both a
 * `points` and a `hexagons` FeatureCollection to {@link show}.
 *
 * @remarks
 * **Quick start:**
 * ```typescript
 * import { TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
 * import { trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
 *
 * const module = await TrafficAreaAnalyticsModule.get(map);
 * const result = await trafficAreaAnalytics({ ... });
 * // transform result.features[0].properties.tiledData.tiles → points & hexagons
 * await module.show({ points, hexagons });
 * ```
 *
 * @group Traffic Area Analytics
 */
export class TrafficAreaAnalyticsModule extends AbstractMapModule<
    AreaAnalyticsSourcesWithLayers,
    TrafficAreaAnalyticsConfig
> {
    private static lastInstanceIndex = -1;

    private heatmapSourceId!: string;
    private heatmapLayerId!: string;

    private hexgridSourceId!: string;
    private hexFillLayerId!: string;
    private hexExtrusionLayerId!: string;

    private currentMode: 'heatmap' | 'hexgrid' = 'hexgrid';
    private currentMetric: AreaAnalyticsMetricKey = 'congestionLevel';

    /** Cached for style-change restoration. */
    private lastDisplayData: TrafficAreaAnalyticsDisplayData | null = null;

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
    static async get(
        tomtomMap: TomTomMap,
        config?: TrafficAreaAnalyticsConfig,
    ): Promise<TrafficAreaAnalyticsModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new TrafficAreaAnalyticsModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: TrafficAreaAnalyticsConfig) {
        super('geojson', map, config);
    }

    // ── AbstractMapModule hooks ──────────────────────────────────────

    /** @ignore */
    protected _initSourcesWithLayers(
        _config?: TrafficAreaAnalyticsConfig,
        restore?: boolean,
    ): AreaAnalyticsSourcesWithLayers {
        if (!restore) {
            TrafficAreaAnalyticsModule.lastInstanceIndex++;
            const idx = TrafficAreaAnalyticsModule.lastInstanceIndex;
            this.heatmapSourceId = `area-analytics-heatmap-${idx}`;
            this.heatmapLayerId = `area-analytics-heatmap-layer-${idx}`;
            this.hexgridSourceId = `area-analytics-hexgrid-${idx}`;
            this.hexFillLayerId = `area-analytics-hexFill-${idx}`;
            this.hexExtrusionLayerId = `area-analytics-hexExtrusion-${idx}`;
        }

        return {
            heatmap: new GeoJSONSourceWithLayers(this.mapLibreMap, this.heatmapSourceId, [
                buildHeatmapLayerSpec(this.heatmapLayerId),
            ]),
            hexgrid: new GeoJSONSourceWithLayers(this.mapLibreMap, this.hexgridSourceId, [
                buildHexFillLayerSpec(this.hexFillLayerId),
                buildHexExtrusionLayerSpec(this.hexExtrusionLayerId),
            ]),
        };
    }

    /** @ignore */
    protected _applyConfig(config: TrafficAreaAnalyticsConfig | undefined): TrafficAreaAnalyticsConfig | undefined {
        if (config?.mode) {
            this.currentMode = config.mode;
        }
        if (config?.metric) {
            this.currentMetric = config.metric;
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
        const cachedData = this.lastDisplayData;
        this.initSourcesWithLayers(this.config, true);
        if (this.config) {
            this._applyConfig(this.config);
        }
        if (cachedData) {
            void this.show(cachedData);
        }
    }

    // ── Public API ───────────────────────────────────────────────────

    /**
     * Displays area analytics data on the map.
     *
     * @param data - Pre-built GeoJSON for both visualisation modes.
     *
     * @example
     * ```typescript
     * await module.show({ points: pointFC, hexagons: hexFC });
     * ```
     */
    async show(data: TrafficAreaAnalyticsDisplayData): Promise<void> {
        await this.waitUntilModuleReady();
        this.lastDisplayData = data;
        this.sourcesWithLayers.heatmap.show(data.points);
        this.sourcesWithLayers.hexgrid.show(data.hexagons);
        this.applyModeVisibility();
    }

    /**
     * Removes all area analytics data from the map.
     */
    async clear(): Promise<void> {
        await this.waitUntilModuleReady();
        this.lastDisplayData = null;
        this.sourcesWithLayers.heatmap.clear();
        this.sourcesWithLayers.hexgrid.clear();
    }

    /**
     * Switches the visualisation mode.
     *
     * @param mode - `'heatmap'` or `'hexgrid'`.
     */
    setMode(mode: 'heatmap' | 'hexgrid'): void {
        this.currentMode = mode;
        this.config = { ...this.config, mode };
        this.applyModeVisibility();
    }

    /**
     * Changes the active metric that drives colour and height.
     *
     * @param metric - One of `'congestionLevel'`, `'speed'`, or `'travelTime'`.
     */
    setMetric(metric: AreaAnalyticsMetricKey): void {
        this.currentMetric = metric;
        this.config = { ...this.config, metric };
        this.applyMetricToLayers(metric);
    }

    /**
     * Shows or hides all area analytics layers.
     */
    setVisible(visible: boolean): void {
        this.config = { ...this.config, visible };
        if (visible) {
            this.applyModeVisibility();
        } else {
            this.sourcesWithLayers.heatmap.setLayersVisible(false);
            this.sourcesWithLayers.hexgrid.setLayersVisible(false);
        }
    }

    /**
     * Whether any area analytics layer is currently visible.
     */
    isVisible(): boolean {
        return (
            this.sourcesWithLayers.heatmap.isAnyLayerVisible() ||
            this.sourcesWithLayers.hexgrid.isAnyLayerVisible()
        );
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

        this.sourcesWithLayers.heatmap.setLayersVisible(this.currentMode === 'heatmap' && hasHeatmapData);
        this.sourcesWithLayers.hexgrid.setLayersVisible(this.currentMode === 'hexgrid' && hasHexData);
    }

    private applyMetricToLayers(metric: AreaAnalyticsMetricKey): void {
        const colorExpr = buildColorExpression(metric);
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

        // Heatmap weight
        const { min, max } = metric === 'congestionLevel'
            ? { min: 0, max: 100 }
            : metric === 'speed'
              ? { min: 0, max: 120 }
              : { min: 0, max: 20 };
        this.mapLibreMap.setPaintProperty(
            this.heatmapLayerId,
            'heatmap-weight',
            ['interpolate', ['linear'], ['get', metric], min, 0, max, 1],
            { validate: false },
        );
    }
}
