import type { DelayMagnitude } from '@tomtom-org/maps-sdk-js/core';
import type { FilterShowMode, StyleModuleConfig, ValuesFilter } from '../../shared';

/**
 * Available traffic incident category identifiers.
 *
 * @remarks
 * These categories classify different types of traffic incidents that can be displayed on the map.
 *
 * @group Traffic Incidents
 */
export const incidentCategories = [
    'unknown',
    'accident',
    'fog',
    'dangerous_conditions',
    'rain',
    'ice',
    'jam',
    'lane_closed',
    'road_closed',
    'road_works',
    'wind',
    'flooding',
    'broken_down_vehicle',
] as const;

/**
 * Traffic incident category type.
 *
 * @remarks
 * Represents the type of traffic incident affecting road conditions.
 * Used for filtering and categorizing incidents displayed on the map.
 *
 * Available categories:
 * - `unknown` - Unclassified incident
 * - `accident` - Vehicle collision or crash
 * - `fog` - Low visibility due to fog
 * - `dangerous_conditions` - Hazardous road conditions
 * - `rain` - Heavy rain affecting traffic
 * - `ice` - Icy road conditions
 * - `jam` - Traffic congestion or standstill
 * - `lane_closed` - One or more lanes unavailable
 * - `road_closed` - Complete road closure
 * - `road_works` - Construction or maintenance
 * - `wind` - Strong winds affecting traffic
 * - `flooding` - Water on roadway
 * - `broken_down_vehicle` - Disabled vehicle blocking traffic
 *
 * @group Traffic Incidents
 */
export type IncidentCategory = (typeof incidentCategories)[number];

/**
 * @ignore
 */
export const incidentCategoriesMapping: Record<IncidentCategory, number> = {
    unknown: 0,
    accident: 1,
    fog: 2,
    dangerous_conditions: 3,
    rain: 4,
    ice: 5,
    jam: 6,
    lane_closed: 7,
    road_closed: 8,
    road_works: 9,
    wind: 10,
    flooding: 11,
    broken_down_vehicle: 14,
} as const;

/**
 * Available road hierarchy category identifiers.
 *
 * @remarks
 * These categories represent different levels in the road network hierarchy,
 * from major highways to local streets.
 *
 * @group Traffic
 */
export const roadCategories = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'street'] as const;

/**
 * Road hierarchy category type.
 *
 * @remarks
 * Classifies roads by their importance and capacity in the transportation network.
 * Used for filtering traffic data display based on road significance.
 *
 * Road hierarchy (from highest to lowest):
 * - `motorway` - High-capacity highways with restricted access
 * - `trunk` - Major inter-city roads
 * - `primary` - Primary through routes
 * - `secondary` - Secondary through routes
 * - `tertiary` - Connecting roads (see {@link TertiaryRoadCategory})
 * - `street` - Local streets (see {@link StreetRoadCategory})
 *
 * @group Traffic
 */
export type RoadCategory = (typeof roadCategories)[number];

/**
 * Available tertiary road sub-category identifiers.
 *
 * @remarks
 * Provides finer granularity for classifying tertiary roads.
 *
 * @group Traffic
 */
export const tertiaryRoadCategories = ['connecting', 'major_local'] as const;

/**
 * Tertiary road sub-category type.
 *
 * @remarks
 * Further classifies tertiary roads into specific sub-types for more granular filtering.
 *
 * Sub-categories:
 * - `connecting` - Roads connecting different areas
 * - `major_local` - Major roads within local areas
 *
 * @group Traffic
 */
export type TertiaryRoadCategory = (typeof tertiaryRoadCategories)[number];

/**
 * Available street road sub-category identifiers.
 *
 * @remarks
 * Provides finer granularity for classifying local streets.
 *
 * @group Traffic
 */
export const streetRoadCategories = ['local', 'minor_local'] as const;

/**
 * Street road sub-category type.
 *
 * @remarks
 * Further classifies local streets into specific sub-types for more granular filtering.
 *
 * Sub-categories:
 * - `local` - Standard local streets
 * - `minor_local` - Minor residential streets
 *
 * @group Traffic
 */
export type StreetRoadCategory = (typeof streetRoadCategories)[number];

/**
 * Configuration for filtering traffic incidents by delay duration.
 *
 * @remarks
 * Allows filtering incidents based on whether they cause delays and the severity of those delays.
 * Useful for focusing on incidents with the most significant traffic impact.
 *
 * @group Traffic
 */
export type DelayFilter = {
    /**
     * Requires incidents to have an associated delay.
     *
     * @remarks
     * When `true`, incidents without delay information will be hidden from the map.
     * When `false` or omitted, incidents are shown regardless of delay data availability.
     *
     * @defaultValue `false`
     */
    mustHaveDelay?: boolean;

    /**
     * Minimum delay threshold in minutes.
     *
     * @remarks
     * Only incidents causing delays of at least this duration will be shown.
     *
     * **Behavior:**
     * - If `mustHaveDelay` is `false` or not set, this filter only applies to incidents that have delay data
     * - Incidents without delay data are still shown (unless `mustHaveDelay` is `true`)
     *
     * @example
     * ```ts
     * // Show only incidents with delays of 5 minutes or more
     * delays: { minDelayMinutes: 5 }
     * ```
     */
    minDelayMinutes?: number;
};

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
     * roadCategories: { mode: 'show', values: ['motorway', 'trunk'] }
     * ```
     */
    roadCategories?: ValuesFilter<RoadCategory>;

    /**
     * Filters traffic data by road sub-categories.
     *
     * @remarks
     * Provides finer-grained control for tertiary roads and streets.
     * Applies to sub-categories of {@link TertiaryRoadCategory} and {@link StreetRoadCategory}.
     *
     * @example
     * ```ts
     * // Hide minor local streets
     * roadSubCategories: { mode: 'hide', values: ['minor_local'] }
     * ```
     */
    roadSubCategories?: ValuesFilter<TertiaryRoadCategory | StreetRoadCategory>;
};

/**
 * Filter configuration for traffic incidents visualization.
 *
 * @remarks
 * Extends common traffic filters with incident-specific filtering options
 * including category, severity, and delay-based filtering.
 *
 * @group Traffic Incidents
 */
export type TrafficIncidentsFilter = TrafficCommonFilter & {
    /**
     * Filters incidents by category type.
     *
     * @remarks
     * Controls which types of incidents are displayed on the map.
     *
     * @example
     * ```ts
     * // Show only accidents and road closures
     * incidentCategories: { mode: 'show', values: ['accident', 'road_closed'] }
     * ```
     */
    incidentCategories?: ValuesFilter<IncidentCategory>;

    /**
     * Filters incidents by delay severity magnitude.
     *
     * @remarks
     * Controls display based on the severity of traffic delays caused by incidents.
     *
     * Magnitude levels:
     * - `0` - Unknown
     * - `1` - Minor
     * - `2` - Moderate
     * - `3` - Major
     * - `4` - Undefined
     *
     * @example
     * ```ts
     * // Show only major incidents
     * magnitudes: { mode: 'show', values: [3] }
     * ```
     */
    magnitudes?: ValuesFilter<DelayMagnitude>;

    /**
     * Filters incidents by delay duration.
     *
     * @remarks
     * Allows filtering based on whether incidents have delays and minimum delay thresholds.
     */
    delays?: DelayFilter;
};

/**
 * Collection of traffic incident filters with OR logic.
 *
 * @remarks
 * Combines multiple incident filter configurations where an incident is shown
 * if it matches **any** of the provided filter criteria (logical OR).
 *
 * This allows for complex filtering scenarios where incidents from different
 * categories or with different characteristics can all be displayed.
 *
 * @example
 * ```ts
 * // Show major incidents OR road closures
 * filters: {
 *   any: [
 *     { magnitudes: { mode: 'show', values: [3] } },
 *     { incidentCategories: { mode: 'show', values: ['road_closed'] } }
 *   ]
 * }
 * ```
 *
 * @group Traffic Incidents
 */
export type TrafficIncidentsFilters = {
    /**
     * Array of incident filters combined with OR logic.
     *
     * @remarks
     * An incident is displayed if it satisfies at least one of the filter configurations.
     */
    any: TrafficIncidentsFilter[];
};

/**
 * Filter configuration for traffic flow visualization.
 *
 * @remarks
 * Extends common traffic filters with flow-specific options,
 * particularly for highlighting road closures in the flow layer.
 *
 * @group Traffic Flow
 */
export type TrafficFlowFilter = TrafficCommonFilter & {
    /**
     * Controls road closure display in the traffic flow layer.
     *
     * @remarks
     * Determines whether to exclusively show road closures or exclude them from display.
     *
     * - `'show'` - Display only road closures
     * - `'hide'` - Display everything except road closures
     *
     * @example
     * ```ts
     * // Highlight only road closures
     * showRoadClosures: 'show'
     * ```
     */
    showRoadClosures?: FilterShowMode;
};

/**
 * Collection of traffic flow filters with OR logic.
 *
 * @remarks
 * Combines multiple flow filter configurations where traffic flow data is shown
 * if it matches **any** of the provided filter criteria (logical OR).
 *
 * @example
 * ```ts
 * // Show flow on motorways OR show road closures on any road
 * filters: {
 *   any: [
 *     { roadCategories: { mode: 'show', values: ['motorway'] } },
 *     { showRoadClosures: 'show' }
 *   ]
 * }
 * ```
 *
 * @group Traffic Flow
 */
export type TrafficFlowFilters = {
    /**
     * Array of flow filters combined with OR logic.
     *
     * @remarks
     * Traffic flow data is displayed if it satisfies at least one of the filter configurations.
     */
    any: TrafficFlowFilter[];
};

/**
 * Common configuration for traffic incident visualization components.
 *
 * @remarks
 * Provides shared styling and filtering options used by both incident lines and icons.
 * Extends base style module configuration with traffic incident-specific filters.
 *
 * @group Traffic Incidents
 */
export type IncidentsCommonConfig = StyleModuleConfig & {
    /**
     * Filter configuration for traffic incidents.
     *
     * @remarks
     * Controls which incidents are displayed based on category, severity, delay, and road type.
     */
    filters?: TrafficIncidentsFilters;
};

/**
 * Configuration for traffic incidents module.
 *
 * @remarks
 * Provides complete configuration for displaying traffic incidents on the map,
 * including separate styling for incident lines and icons.
 *
 * @group Traffic Incidents
 */
export type IncidentsConfig = IncidentsCommonConfig & {
    /**
     * Configuration specific to incident icon display.
     *
     * @remarks
     * Allows separate styling and filtering for incident marker icons,
     * independent of the incident line styling.
     */
    icons?: IncidentsCommonConfig;
};

/**
 * Configuration for traffic flow visualization module.
 *
 * @remarks
 * Controls the display of real-time traffic flow data on road segments,
 * including styling and filtering options.
 *
 * @group Traffic Flow
 */
export type FlowConfig = StyleModuleConfig & {
    /**
     * Filter configuration for traffic flow data.
     *
     * @remarks
     * Controls which road segments display traffic flow information
     * based on road category and closure status.
     */
    filters?: TrafficFlowFilters;
};
