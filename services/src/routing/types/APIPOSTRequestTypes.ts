import { LatLngPointAPI } from "./APITypes";

/**
 * @ignore
 */
export type PointWaypointAPI = {
    waypointSourceType: "User_Defined";
    supportingPointIndex: number;
};

/**
 * @ignore
 */
export type CalculateRoutePOSTDataAPI = {
    supportingPoints: LatLngPointAPI[];
    pointWaypoints?: PointWaypointAPI[];
};
