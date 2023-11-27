import { Feature, LineString } from "geojson";
import { Guidance } from "./guidance";
import { SectionsProps } from "./sections";
import { RouteSummary } from "./summary";
import { FeatureCollectionWithProperties } from "../extendedGeoJSON";

/**
 * Specifies something that the route calculation should try to avoid when determining the route.
 * Possible values:
 * * tollRoads: avoids toll roads.
 * * motorways: avoids motorways.
 * * ferries: avoids ferries.
 * * unpavedRoads: avoids unpaved roads.
 * * carpools: avoids routes that require use of a carpool (HOV/ High Occupancy Vehicle) lanes.
 * * alreadyUsedRoads: avoids using the same road multiple times.
 * * borderCrossings: avoids crossing country borders.
 * * tunnels: avoids tunnels.
 * * carTrains: avoids car trains.
 * * lowEmissionZones: avoids low-emission zones.
 * @group Route
 * @category Types
 */
export type Avoidable =
    | "tollRoads"
    | "motorways"
    | "ferries"
    | "unpavedRoads"
    | "carpools"
    | "alreadyUsedRoads"
    | "borderCrossings"
    | "tunnels"
    | "carTrains"
    | "lowEmissionZones";

/**
 * Primary means of transportation to be used in a route.
 * @group Route
 * @category Types
 */
export type TravelMode = "car"; // TODO no longer supported | "truck" | "taxi" | "bus" | "van" | "motorcycle" | "bicycle" | "pedestrian";

/**
 * @group Route
 * @category Types
 */
export type RouteProps = {
    /**
     * Random generated id.
     */
    id: string;
    /**
     * Common summary type for the route.
     * * Contains departure/arrival times, lengths and durations.
     */
    summary: RouteSummary;
    /**
     * Route sections are parts of the planned route that have specific characteristics.
     */
    sections: SectionsProps;
    /**
     * Contains guidance related elements. This field is present only when guidance was requested and is available.
     */
    guidance?: Guidance;
    /**
     * Index related to other routes.
     * * Only available when there is more than one route. Then they are in natural array order: 0, 1, 2, 3...
     * * By default, the first route (index 0) is considered the main one, and the next one are alternatives.
     */
    index?: number;
};

/**
 * @group Route
 * @category Types
 */
export type Route<P extends RouteProps = RouteProps> = Feature<LineString, P>;

/**
 * @group Route
 * @category Types
 */
export type Routes<
    P extends RouteProps = RouteProps,
    FeatureCollectionProps = unknown
> = FeatureCollectionWithProperties<LineString, P, FeatureCollectionProps>;
