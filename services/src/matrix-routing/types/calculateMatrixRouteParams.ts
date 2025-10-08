import type { HasLngLat } from '@cet/maps-sdk-js/core';
import type { CommonServiceParams, TrafficInput } from '../../shared';
import type { CalculateMatrixRouteRequestAPI } from './apiRequestTypes';
import type { CalculateMatrixRouteResponseAPI } from './apiResponseTypes';

type MatrixRouteAvoidable = 'tollRoads' | 'unpavedRoads';

export type MatrixRouteOptions = {
    departAt?: Date | 'any' | 'now';
    arriveAt?: Date | 'any';
    routeType?: 'fastest';
    traffic?: TrafficInput;
    travelMode?: 'car' | 'truck' | 'pedestrian';
    // TODO: try to reuse VehicleDimensions type (make params more similar to calculate-route service)
    vehicleMaxSpeed?: number;
    vehicleWeight?: number;
    vehicleAxleWeight?: number;
    vehicleLength?: number;
    vehicleWidth?: number;
    vehicleHeight?: number;
    vehicleCommercial?: boolean;
    vehicleLoadType?: [string];
    vehicleAdrTunnelRestrictionCode?: string;
    avoid?: [MatrixRouteAvoidable];
};

export type CalculateMatrixRouteParams = CommonServiceParams<
    CalculateMatrixRouteRequestAPI,
    CalculateMatrixRouteResponseAPI
> & {
    /**
     * A non-empty list of origin locations represented by points.
     * Value: An array of locations (latitude, longitude pairs).
     * @see Post body fields: {@link https://docs.tomtom.com/routing-api/documentation/matrix-routing-v2/synchronous-matrix#post-body-fields}
     * @default None
     */
    origins: HasLngLat[];

    /**
     * A non-empty list of destination locations represented by points.
     * Value: An array of locations (latitude, longitude pairs).
     * @see  Post body fields: {@link https://docs.tomtom.com/routing-api/documentation/matrix-routing-v2/synchronous-matrix#post-body-fields}
     * @default None
     */
    destinations: HasLngLat[];

    options?: MatrixRouteOptions;
};
