import type { HasLngLat } from '@cet/maps-sdk-js/core';
import { getPositionStrict } from '@cet/maps-sdk-js/core';
import type { FetchInput } from '../shared';
import { appendCommonParams } from '../shared/request/requestBuildingUtils';
import type { CalculateMatrixRoutePOSTDataAPI, LatitudeLongitudePointAPI } from './types/apiRequestTypes';
import type { CalculateMatrixRouteParams } from './types/calculateMatrixRouteParams';

const buildUrlBasePath = (params: CalculateMatrixRouteParams): string =>
    params.customServiceBaseURL ?? `${params.commonBaseURL}/routing/matrix/2`;

const transformPositionArrayToObj = (positions: HasLngLat[]): LatitudeLongitudePointAPI[] =>
    positions.map((position) => {
        const [longitude, latitude] = getPositionStrict(position);
        return { point: { longitude, latitude } };
    });

const buildPostData = (params: CalculateMatrixRouteParams): CalculateMatrixRoutePOSTDataAPI => {
    const basePostData: CalculateMatrixRoutePOSTDataAPI = {
        origins: transformPositionArrayToObj(params.origins),
        destinations: transformPositionArrayToObj(params.destinations),
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
    params: CalculateMatrixRouteParams,
): FetchInput<CalculateMatrixRoutePOSTDataAPI> => {
    const url = new URL(`${buildUrlBasePath(params)}`);
    const urlParams: URLSearchParams = url.searchParams;
    appendCommonParams(urlParams, params);

    return {
        method: 'POST',
        url,
        data: buildPostData(params),
    };
};
