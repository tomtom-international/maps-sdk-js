import type { PostObject } from '../../shared';

/**
 * @ignore
 */
export type RoutePointAPI = {
    lat: number;
    lon: number;
};

/**
 * @ignore
 */
export type AlongRouteSearchPayloadAPI = {
    route: {
        points: RoutePointAPI[];
    };
};

/**
 * Along-route search request type.
 * @ignore
 */
export type AlongRouteSearchRequestAPI = PostObject<AlongRouteSearchPayloadAPI>;
