import { FetchInput } from "../../shared/types/fetch";
import { LatitudeLongitudePointAPI, MatrixRouteAPIOptions } from "./calculateMatrixRouteParams";

/**
 * @ignore
 */
export type CalculateMatrixRoutePOSTDataAPI = {
    origins: LatitudeLongitudePointAPI[];
    destinations: LatitudeLongitudePointAPI[];
    options?: MatrixRouteAPIOptions;
};

export type CalculateMatrixRouteRequestAPI = FetchInput<CalculateMatrixRoutePOSTDataAPI>;
