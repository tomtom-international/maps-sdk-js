import { Position } from "geojson";
import { CommonServiceParams } from "../../shared";
import { CalculateMatrixRouteRequestAPI } from "./apiRequestTypes";
import { CalculateMatrixRouteResponseAPI } from "./apiResponseTypes";

/**
 * @ignore
 */
export type LatitudeLongitudePointAPI = {
    point: {
        latitude: number;
        longitude: number;
    };
};

/**
 * @ignore
 */
export type MatrixRouteAPIOptions = {
    departAt?: Date | "any" | "now";
    arriveAt?: Date | "any";
    routeType?: "fastest";
    traffic?: "historical" | "live";
    travelMode?: "car" | "truck" | "pedestrian";
    vehicleMaxSpeed?: number;
    vehicleWeight?: number;
    vehicleAxleWeight?: number;
    vehicleLength?: number;
    vehicleWidth?: number;
    vehicleHeight?: number;
    vehicleCommercial?: boolean;
    vehicleLoadType?: [string];
    vehicleAdrTunnelRestrictionCode?: string;
    avoid?: [string];
};

export type CalculateMatrixRouteParams = CommonServiceParams<
    CalculateMatrixRouteRequestAPI,
    CalculateMatrixRouteResponseAPI
> & {
    /**
     * A non-empty list of origin locations represented by points.
     * Value: An array of locations (latitude, longitude pairs).
     * @see Post Origin field: {@link https://developer.tomtom.com/routing-api/documentation/matrix-routing-v2/synchronous-matrix#post-body-fields}
     * @default None
     */
    origins: Position[];

    /**
     * A non-empty list of destination locations represented by points.
     * Value: An array of locations (latitude, longitude pairs).
     * @see Post Origin field: {@link https://developer.tomtom.com/routing-api/documentation/matrix-routing-v2/synchronous-matrix#post-body-fields}
     * @default None
     */
    destinations: Position[];

    options?: MatrixRouteAPIOptions;
};
