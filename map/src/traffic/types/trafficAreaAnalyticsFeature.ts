import type { AreaAnalyticsMetrics } from '@tomtom-org/maps-sdk/core';
import type { Feature, Point, Polygon } from 'geojson';
import type { SupportsEvents } from '../../shared';

/**
 * Properties attached to each area analytics display feature.
 *
 * @remarks
 * Includes all optional metric fields from the API response plus a
 * stable `id` used by MapLibre's `promoteId` for event state tracking,
 * and `eventState` (from `SupportsEvents`) used to drive hover/click styling.
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsDisplayProperties = AreaAnalyticsMetrics &
    SupportsEvents & {
        /**
         * Stable feature identifier (typically the tile centre coordinates stringified
         * or the H3 cell index).
         */
        id: string;
    };

/**
 * A single area analytics tile feature (point, hexagon, or square cell).
 *
 * @group Traffic Area Analytics
 */
export type AreaAnalyticsTileFeature = Feature<Point | Polygon, AreaAnalyticsDisplayProperties>;
