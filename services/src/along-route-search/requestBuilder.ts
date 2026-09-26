import type { LineString } from 'geojson';
import { appendCommonSearchParams } from '../shared/request/commonSearchRequestBuilder';
import { resolvePlacesEndpointUrl } from '../shared/request/placesEndpoint';
import { appendOptionalParam, buildPlacesRequestHeaders } from '../shared/request/requestBuildingUtils';
import type { AlongRouteSearchParams, AlongRouteSearchRequestAPI } from './types';

const toLineString = (route: AlongRouteSearchParams['route']): LineString => {
    if (Array.isArray(route)) {
        return { type: 'LineString', coordinates: route };
    }
    return route.type === 'Feature' ? route.geometry : route;
};

const buildUrlBasePath = (params: AlongRouteSearchParams): string =>
    resolvePlacesEndpointUrl(params, `searchAlongRoute/${params.query ?? ''}.json`);

/**
 * Default function for building an along-route search request from {@link AlongRouteSearchParams}.
 * @param params The along-route search parameters, with global configuration already merged into them.
 */
export const buildAlongRouteSearchRequest = (params: AlongRouteSearchParams): AlongRouteSearchRequestAPI => {
    const url = new URL(buildUrlBasePath(params));
    appendCommonSearchParams(url, params);
    const urlParams = url.searchParams;
    urlParams.append('maxDetourTime', String(params.maxDetourTimeSeconds));
    appendOptionalParam(urlParams, 'sortBy', params.sortBy);
    appendOptionalParam(urlParams, 'spreadingMode', 'plan');

    return {
        url,
        headers: buildPlacesRequestHeaders(params),
        data: {
            route: {
                points: toLineString(params.route).coordinates.map((coord) => ({
                    lat: coord[1],
                    lon: coord[0],
                })),
            },
        },
    };
};
