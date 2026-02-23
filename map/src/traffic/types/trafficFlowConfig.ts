import type { MapModuleCommonConfig } from '../../shared';
import type { FilterShowMode, TrafficCommonFilter } from './trafficCommonConfig';

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
 *     { roadCategories: { show: 'only', values: ['motorway'] } },
 *     { showRoadClosures: 'only' }
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
 * Configuration for traffic flow visualization module.
 *
 * @remarks
 * Controls the display of real-time traffic flow data on road segments,
 * including styling and filtering options.
 *
 * @group Traffic Flow
 */
export type FlowConfig = MapModuleCommonConfig & {
    /**
     * Controls the visibility of the traffic flow layers.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Filter configuration for traffic flow data.
     *
     * @remarks
     * Controls which road segments display traffic flow information
     * based on road category and closure status.
     */
    filters?: TrafficFlowFilters;
};
