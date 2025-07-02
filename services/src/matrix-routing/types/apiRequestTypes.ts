import type { FetchInput } from '../../shared';
import type { MatrixRouteOptions } from './calculateMatrixRouteParams';

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
export type CalculateMatrixRoutePOSTDataAPI = {
    origins: LatitudeLongitudePointAPI[];
    destinations: LatitudeLongitudePointAPI[];
    options?: MatrixRouteOptions;
};

export type CalculateMatrixRouteRequestAPI = FetchInput<CalculateMatrixRoutePOSTDataAPI>;
