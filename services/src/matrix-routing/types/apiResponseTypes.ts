import type { RoutingAPIResponseError } from '../../shared/types/apiResponseErrorTypes';

export type MatrixRouteSummary = {
    lengthInMeters: number;
    travelTimeInSeconds: number;
    trafficDelayInSeconds: number;
    departureTime: Date;
    arrivalTime: Date;
};

export type Statistics = {
    totalCount: number;
    successes: number;
    failures: number;
    failureDetails?: {
        code: string;
        count: number;
    }[];
};

export type MatrixRouteResponseData = {
    originIndex: number;
    destinationIndex: number;
    routeSummary?: MatrixRouteSummary;
    detailedError?: RoutingAPIResponseError['detailedError'];
};

/**
 * @ignore
 */
export type CalculateMatrixRouteResponseAPI = {
    data: MatrixRouteResponseData[];
    statistics: Statistics;
};
