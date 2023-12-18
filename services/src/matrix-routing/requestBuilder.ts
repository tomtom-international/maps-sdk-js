import { Position } from "geojson";
import { appendCommonParams } from "../shared/requestBuildingUtils";
import { FetchInput } from "../shared/types/fetch";
import { CalculateMatrixRoutePOSTDataAPI, LatitudeLongitudePointAPI } from "./types/apiRequestTypes";
import { CalculateMatrixRouteParams } from "./types/calculateMatrixRouteParams";

const buildURLBasePath = (params: CalculateMatrixRouteParams): string =>
    params.customServiceBaseURL ?? `${params.commonBaseURL}/routing/matrix/2`;

const transformPositionArrayToObj = (positions: Position[]): LatitudeLongitudePointAPI[] =>
    positions.map(([longitude, latitude]) => ({
        point: {
            longitude,
            latitude
        }
    }));

const buildPOSTData = (params: CalculateMatrixRouteParams): CalculateMatrixRoutePOSTDataAPI => {
    const basePostData: CalculateMatrixRoutePOSTDataAPI = {
        origins: transformPositionArrayToObj(params.origins),
        destinations: transformPositionArrayToObj(params.destinations)
    };

    if (params.options) {
        basePostData.options = params.options;
    }

    return basePostData;
};

/**
 * @ignore
 */
export const buildCalculateMatrixRouteRequest = (
    params: CalculateMatrixRouteParams
): FetchInput<CalculateMatrixRoutePOSTDataAPI> => {
    const url = new URL(`${buildURLBasePath(params)}`);
    const urlParams: URLSearchParams = url.searchParams;
    appendCommonParams(urlParams, params);

    const postData = buildPOSTData(params);

    return {
        method: "POST",
        url,
        data: postData
    };
};
