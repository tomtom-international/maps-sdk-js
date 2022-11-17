import { PlaceDisplayProps } from "../../places";

export const START_INDEX = "start";
export const MIDDLE_INDEX = "middle";
export const FINISH_INDEX = "finish";

/**
 * @ignore
 */
export type IndexType = typeof START_INDEX | typeof MIDDLE_INDEX | typeof FINISH_INDEX;

/**
 * Display properties for a waypoint.
 */
export type WaypointDisplayProps = PlaceDisplayProps & {
    /**
     * The index of the waypoint in relation to the other waypoints.
     */
    index: number;
    /**
     * The type associated to the index, describing how the waypoint sits in the list of waypoints.
     */
    indexType: IndexType;
    /**
     * The stop index to be displayed.
     * * Stops are the non-soft waypoints added in between origin and destination, and come with their own indexes,
     * starting by 1.
     */
    stopDisplayIndex?: number;
};

/**
 * @ignore
 */
export const INDEX_TYPE = "indexType";

/**
 * @ignore
 */
export const STOP_DISPLAY_INDEX = "stopDisplayIndex";
