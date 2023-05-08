import { LatLngPointAPI } from "./apiResponseTypes";
import { ChargingModel } from "./vehicleEngineParams";

/**
 * @ignore
 */
export type PointWaypointAPI = {
    waypointSourceType: "USER_DEFINED" | "AUTO_GENERATED";
    supportingPointIndex: number;
};

export type ChargingParametersAPI = Omit<ChargingModel, "maxChargeKWH">;

/**
 * @ignore
 */
export type CalculateRoutePOSTDataAPI = {
    supportingPoints?: LatLngPointAPI[];
    pointWaypoints?: PointWaypointAPI[];
    // only used for LDEVR:
    chargingParameters?: ChargingParametersAPI;
};
