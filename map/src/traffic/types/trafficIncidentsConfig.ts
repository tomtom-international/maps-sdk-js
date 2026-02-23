import type { DelayMagnitude, TrafficIncidentCategory } from '@tomtom-org/maps-sdk/core';
import type { MapModuleCommonConfig, ValuesFilter } from '../../shared';
import type { TrafficCommonFilter } from './trafficCommonConfig';

/**
 * Configuration for filtering traffic incidents by delay duration.
 *
 * @remarks
 * Allows filtering incidents based on whether they cause delays and the severity of those delays.
 * Useful for focusing on incidents with the most significant traffic impact.
 *
 * @group Traffic Incidents
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
     * incidentCategories: { show: 'only', values: ['accident', 'road-closed'] }
     * ```
     */
    incidentCategories?: ValuesFilter<TrafficIncidentCategory>;

    /**
     * Filters incidents by delay severity magnitude.
     *
     * @remarks
     * Controls display based on the severity of traffic delays caused by incidents.
     *
     * Available magnitude values:
     * - `'unknown'` - Unknown delay severity
     * - `'minor'` - Minor delays
     * - `'moderate'` - Moderate delays
     * - `'major'` - Major delays
     * - `'indefinite'` - Indefinite delays (e.g., road closures)
     *
     * @example
     * ```ts
     * // Show only major incidents
     * magnitudes: { show: 'only', values: ['major'] }
     *
     * // Show moderate and major incidents
     * magnitudes: { show: 'only', values: ['moderate', 'major'] }
     *
     * // Hide minor incidents
     * magnitudes: { show: 'all_except', values: ['minor'] }
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
 *     { magnitudes: { show: 'only', values: ['major'] } },
 *     { incidentCategories: { show: 'only', values: ['road-closed'] } }
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
 * Common configuration for traffic incident visualization components.
 *
 * @remarks
 * Provides shared styling and filtering options used by both incident lines and icons.
 * Extends base style module configuration with traffic incident-specific filters.
 *
 * @group Traffic Incidents
 */
export type IncidentsCommonConfig = {
    /**
     * Controls the visibility of the traffic incident layers.
     *
     * @default false
     */
    visible?: boolean;

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
export type IncidentsConfig = MapModuleCommonConfig &
    IncidentsCommonConfig & {
        /**
         * Configuration specific to incident icon display.
         *
         * @remarks
         * Allows separate styling and filtering for incident marker icons,
         * independent of the incident line styling.
         */
        icons?: IncidentsCommonConfig;
    };
