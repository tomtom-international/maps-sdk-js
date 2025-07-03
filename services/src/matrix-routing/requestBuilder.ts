import type { HasLngLat } from '@anw/maps-sdk-js/core';
import { getPositionStrict } from '@anw/maps-sdk-js/core';
import type { FetchInput } from '../shared';
import { appendCommonParams } from '../shared/requestBuildingUtils';
import type { CalculateMatrixRoutePOSTDataAPI, LatitudeLongitudePointAPI } from './types/apiRequestTypes';
import type { CalculateMatrixRouteParams } from './types/calculateMatrixRouteParams';

const buildURLBasePath = (params: CalculateMatrixRouteParams): string =>
    params.customServiceBaseURL ?? `${params.commonBaseURL}/routing/matrix/2`;

const transformPositionArrayToObj = (positions: HasLngLat[]): LatitudeLongitudePointAPI[] =>
    positions.map((position) => {
        const [longitude, latitude] = getPositionStrict(position);
        return { point: { longitude, latitude } };
    });

const buildPOSTData = (params: CalculateMatrixRouteParams): CalculateMatrixRoutePOSTDataAPI => {
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
    const url = new URL(`${buildURLBasePath(params)}`);
    const urlParams: URLSearchParams = url.searchParams;
    appendCommonParams(urlParams, params);

    return {
        method: 'POST',
        url,
        data: buildPOSTData(params),
    };
};
