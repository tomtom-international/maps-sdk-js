import { Guidance } from "./Guidance";
import { Sections } from "./Sections";
import { Summary } from "./Summary";
import { Feature, FeatureCollection, LineString } from "geojson";

/**
 * Specifies something that the route calculation should try to avoid when determining the route.
 * Possible values:
 * * tollRoads: avoids toll roads.
 * * motorways: avoids motorways.
 * * ferries: avoids ferries.
 * * unpavedRoads: avoids unpaved roads.
 * * carpools: avoids routes that require use of a carpool (HOV/ High Occupancy Vehicle) lanes.
 * * alreadyUsedRoads: avoids using the same road multiple times.
 * @group Route
 * @category Types
 */
export type Avoidable = "tollRoads" | "motorways" | "ferries" | "unpavedRoads" | "carpools" | "alreadyUsedRoads";

/**
 * Primary means of transportation to be used in a route.
 * @group Route
 * @category Types
 */
export type TravelMode = "car" | "truck" | "taxi" | "bus" | "van" | "motorcycle" | "bicycle" | "pedestrian";
/**
 * @group Route
 * @category Types
 */
export type RouteProps = {
    summary: Summary;
    sections: Sections;
    guidance?: Guidance;
};

/**
 * @group Route
 * @category Types
 */
export type Route = Feature<LineString, RouteProps>;

/**
 * @group Route
 * @category Types
 */
export type Routes = FeatureCollection<LineString, RouteProps>;
