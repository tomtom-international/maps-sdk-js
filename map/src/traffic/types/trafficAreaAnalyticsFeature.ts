import type { Feature, Point, Polygon } from 'geojson';
import type { AreaAnalyticsMetrics } from '@tomtom-org/maps-sdk/core';

/**
 * Properties attached to each area analytics display feature.
 *
 * @remarks
 * Includes all optional metric fields from the API response plus a
 * stable `id` used by MapLibre's `promoteId` for event state tracking.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsDisplayProperties = AreaAnalyticsMetrics & {
    /**
     * Stable feature identifier (typically the tile centre coordinates stringified
     * or the H3 cell index).
     */
    id: string;
};

/**
 * A single hex polygon feature for the hexgrid visualization.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsHexFeature = Feature<Polygon, AreaAnalyticsDisplayProperties>;

/**
 * A single point feature for the heatmap visualization.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsPointFeature = Feature<Point, AreaAnalyticsDisplayProperties>;

/**
 * Pre-built GeoJSON data accepted by {@link TrafficAreaAnalyticsModule.show}.
 *
 * @remarks
 * The consumer is responsible for building both collections from
 * the `trafficAreaAnalytics` service response:
 * - `points` — one Point per tile centre (for the heatmap layer)
 * - `hexagons` — one Polygon per aggregated hex cell (for the hexgrid layers)
 *
 * @group Traffic Area Analytics
 */
export type TrafficAreaAnalyticsDisplayData = {
    /**
     * Point features at each tile centre, used by the heatmap visualization.
     */
    points: GeoJSON.FeatureCollection<Point, AreaAnalyticsDisplayProperties>;

    /**
     * Hexagonal polygon features, used by the hexgrid (fill + fill-extrusion) visualization.
     */
    hexagons: GeoJSON.FeatureCollection<Polygon, AreaAnalyticsDisplayProperties>;
};
