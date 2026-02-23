import type { FilterShowMode, ValuesFilter } from '../../shared';

/**
 * Available road hierarchy category identifiers.
 *
 * @remarks
 * These categories represent different levels in the road network hierarchy,
 * from major highways to local streets.
 *
 * @group Traffic
 */
export const roadCategories = [
    'motorway',
    'motorway_link',
    'trunk',
    'trunk_link',
    'primary',
    'primary_link',
    'secondary',
    'secondary_link',
    'tertiary',
    'tertiary_link',
    'street',
    'service',
    'track',
] as const;

/**
 * Road hierarchy category type.
 *
 * @remarks
 * Classifies roads by their importance and capacity in the transportation network.
 * Used for filtering traffic data display based on road significance.
 *
 * Road hierarchy (from highest to lowest):
 * - `motorway` / `motorway_link` - High-capacity highways with restricted access
 * - `trunk` / `trunk_link` - Major inter-city roads
 * - `primary` / `primary_link` - Primary through routes
 * - `secondary` / `secondary_link` - Secondary through routes
 * - `tertiary` / `tertiary_link` - Connecting roads
 * - `street` - Local streets (see {@link StreetRoadSubCategory})
 * - `service` - Service roads (see {@link ServiceRoadSubCategory})
 * - `track` - Unpaved or agricultural tracks
 *
 * @group Traffic
 */
export type RoadCategory = (typeof roadCategories)[number];

/**
 * Available street road sub-category identifiers.
 *
 * @remarks
 * Provides finer granularity for classifying local streets.
 *
 * @group Traffic
 */
export const streetRoadSubCategories = ['unclassified', 'residential', 'living_street'] as const;

/**
 * Street road sub-category type.
 *
 * @remarks
 * Further classifies `street` roads into specific sub-types.
 *
 * Sub-categories:
 * - `unclassified` - Unclassified local roads
 * - `residential` - Roads in residential areas
 * - `living_street` - Pedestrian-priority shared streets
 *
 * @group Traffic
 */
export type StreetRoadSubCategory = (typeof streetRoadSubCategories)[number];

/**
 * Available service road sub-category identifiers.
 *
 * @remarks
 * Provides finer granularity for classifying service roads.
 *
 * @group Traffic
 */
export const serviceRoadSubCategories = ['parking', 'driveway', 'alley'] as const;

/**
 * Service road sub-category type.
 *
 * @remarks
 * Further classifies `service` roads into specific sub-types.
 *
 * Sub-categories:
 * - `parking` - Roads within parking areas
 * - `driveway` - Private access roads
 * - `alley` - Narrow back-access lanes
 *
 * @group Traffic
 */
export type ServiceRoadSubCategory = (typeof serviceRoadSubCategories)[number];

/**
 * Road sub-category type.
 *
 * @remarks
 * Combines street and service sub-categories. Only `street` and `service` road categories have sub-categories.
 *
 * @group Traffic
 */
export type RoadSubCategory = StreetRoadSubCategory | ServiceRoadSubCategory;

/**
 * Common filter configuration shared between traffic incidents and flow visualization.
 *
 * @remarks
 * Provides road category filtering capabilities used by both incident and flow modules.
 *
 * @group Traffic
 */
export type TrafficCommonFilter = {
    /**
     * Filters traffic data by road hierarchy categories.
     *
     * @remarks
     * Controls which road types display traffic information.
     * Use the `mode` field to specify whether to show or hide the selected categories.
     *
     * @example
     * ```ts
     * // Show only motorways and trunk roads
     * roadCategories: { show: 'only', values: ['motorway', 'trunk'] }
     * ```
     */
    roadCategories?: ValuesFilter<RoadCategory>;

    /**
     * Filters traffic data by road sub-categories.
     *
     * @remarks
     * Provides finer-grained control for street and service roads.
     * Applies to sub-categories of {@link StreetRoadSubCategory} and {@link ServiceRoadSubCategory}.
     *
     * @example
     * ```ts
     * // Hide minor local streets
     * roadSubCategories: { show: 'all_except', values: ['living_street'] }
     * ```
     */
    roadSubCategories?: ValuesFilter<RoadSubCategory>;
};

export type { FilterShowMode };
