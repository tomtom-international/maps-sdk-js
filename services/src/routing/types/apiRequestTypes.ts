import type { LatitudeLongitudePointAPI } from './apiResponseTypes';
import type { ChargingModel } from '../../shared/types/vehicleEngineParams';
import type { FetchInput } from '../../shared';

/**
 * @ignore
 */
export type PointWaypointAPI = {
    waypointSourceType: 'USER_DEFINED' | 'AUTO_GENERATED';
    supportingPointIndex: number;
};

export type ChargingParametersAPI = Omit<ChargingModel, 'maxChargeKWH'>;

/**
 * @ignore
 */
export type CalculateRoutePOSTDataAPI = {
    supportingPoints?: LatitudeLongitudePointAPI[];
    pointWaypoints?: PointWaypointAPI[];
    // only used for LDEVR:
    chargingParameters?: ChargingParametersAPI;
};

/**
 * @ignore
 */
export type CalculateRouteRequestAPI = FetchInput<CalculateRoutePOSTDataAPI>;
