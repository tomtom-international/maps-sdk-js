import type { AreaAnalyticsMetrics } from '@tomtom-org/maps-sdk/core';
import type { Feature, Point, Polygon } from 'geojson';

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
