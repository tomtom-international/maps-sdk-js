import type { LocationDisplayProps } from '../../places';

export const START_INDEX = 'start';
export const MIDDLE_INDEX = 'middle';
export const FINISH_INDEX = 'finish';

/**
 * @ignore
 */
export type IndexType = typeof START_INDEX | typeof MIDDLE_INDEX | typeof FINISH_INDEX;

/**
 * Display properties for a waypoint marker on the map.
 *
 * Extends location display properties with waypoint-specific information
 * including position in the route and stop numbering.
 *
 * @remarks
 * Waypoints are displayed differently based on their position:
 * - **Start**: Origin marker (often "A" or green pin)
 * - **Middle**: Numbered stop markers (1, 2, 3, etc.)
 * - **Finish**: Destination marker (often "B" or red pin)
 *
 * @example
 * ```typescript
 * // Start waypoint
 * const start: WaypointDisplayProps = {
 *   id: 'waypoint-0',
 *   iconID: 'waypoint-start',
 *   index: 0,
 *   indexType: 'start',
 *   title: 'Amsterdam Central Station'
 * };
 *
 * // Intermediate stop
 * const stop: WaypointDisplayProps = {
 *   id: 'waypoint-1',
 *   iconID: 'waypoint-stop',
 *   index: 1,
 *   indexType: 'middle',
 *   stopDisplayIndex: 1,
 *   title: 'Schiphol Airport'
 * };
 *
 * // Destination
 * const finish: WaypointDisplayProps = {
 *   id: 'waypoint-2',
 *   iconID: 'waypoint-finish',
 *   index: 2,
 *   indexType: 'finish',
 *   title: 'Rotterdam Central Station'
 * };
 * ```
 *
 * @group Routing
 * @category Types
 */
export type WaypointDisplayProps = LocationDisplayProps & {
    /**
     * The index of the waypoint in relation to the other waypoints.
     *
     * @remarks
     * Zero-based index of this waypoint in the complete waypoints array,
     * including start, all stops, and finish.
     *
     * @example
     * ```typescript
     * index: 0  // First waypoint (start)
     * index: 1  // Second waypoint (first stop or finish)
     * index: 2  // Third waypoint
     * ```
     */
    index: number;

    /**
     * The type associated to the index, describing how the waypoint sits in the list of waypoints.
     *
     * @remarks
     * Determines the waypoint's role and visual representation:
     * - `start`: Origin point
     * - `middle`: Intermediate stop
     * - `finish`: Final destination
     *
     * This affects icon selection and labeling behavior.
     */
    indexType: IndexType;

    /**
     * The stop index to be displayed.
     *
     * @remarks
     * Stops are the non-soft waypoints added between origin and destination,
     * numbered starting from 1. Only present for middle waypoints.
     *
     * **Display Behavior:**
     * - Start waypoint: undefined
     * - First stop: 1
     * - Second stop: 2
     * - Finish waypoint: undefined
     *
     * Used for displaying stop numbers (e.g., "Stop 1", "Stop 2") in the UI.
     *
     * @example
     * ```typescript
     * stopDisplayIndex: 1  // First intermediate stop
     * stopDisplayIndex: 2  // Second intermediate stop
     * stopDisplayIndex: undefined  // Start or finish waypoint
     * ```
     */
    stopDisplayIndex?: number;
};

/**
 * @ignore
 */
export const INDEX_TYPE = 'indexType';

/**
 * @ignore
 */
export const STOP_DISPLAY_INDEX = 'stopDisplayIndex';
