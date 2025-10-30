import { bboxFromCoordsArray } from '@tomtom-org/maps-sdk-js/core';
import type { MultiPolygon, Position } from 'geojson';
import type { PostObject } from '../shared';
import { sampleWithinMaxLength } from '../shared/arrays';
import { positionToCSVLatLon } from '../shared/geometry';
import { appendCommonSearchParams, PLACES_URL_PATH } from '../shared/request/commonSearchRequestBuilder';
import type { GeometryAPI, GeometrySearchParams, GeometrySearchPayloadAPI, SearchGeometryInput } from './types';

const findFiftyLargestPolygons = (searchGeometry: MultiPolygon): Position[][][] => {
    // we calculate the size of each polygon based on bounding box (simplified)
    // we put it into a map for easy sorting
    // we sort the map by using size and keep only 50 largest polygons
    let polygonSizeMap = new Map<Position[][], number>();
    searchGeometry.coordinates.forEach((polygon) => {
        const bboxOfPolygon = bboxFromCoordsArray(polygon[0]);
        if (bboxOfPolygon) {
            const polygonSize = Math.abs((bboxOfPolygon[2] - bboxOfPolygon[0]) * (bboxOfPolygon[3] - bboxOfPolygon[1]));
            polygonSizeMap.set(polygon, polygonSize);
        }
    });
    polygonSizeMap = new Map([...polygonSizeMap.entries()].sort((a, b) => b[1] - a[1]).splice(0, 50));
    return [...polygonSizeMap.keys()];
};

const sdkGeometryToApiGeometries = (searchGeometry: SearchGeometryInput): GeometryAPI[] => {
    switch (searchGeometry.type) {
        case 'Circle':
            return [
                {
                    type: 'CIRCLE',
                    radius: searchGeometry.radius,
                    position: positionToCSVLatLon(searchGeometry.coordinates),
                },
            ];
        case 'Polygon':
            return [
                {
                    type: 'POLYGON',
                    vertices: sampleWithinMaxLength(searchGeometry.coordinates[0], 50).map((coord) =>
                        positionToCSVLatLon(coord),
                    ),
                },
            ];
        case 'MultiPolygon': {
            if (searchGeometry.coordinates.length > 50) {
                // we have too many polygons for the service to work
                return findFiftyLargestPolygons(searchGeometry).flatMap((polygonCoords) =>
                    sdkGeometryToApiGeometries({ type: 'Polygon', coordinates: polygonCoords }),
                );
            }
            return searchGeometry.coordinates.flatMap((polygonCoords) =>
                sdkGeometryToApiGeometries({ type: 'Polygon', coordinates: polygonCoords }),
            );
        }
        case 'FeatureCollection':
            return searchGeometry.features.flatMap((feature) => sdkGeometryToApiGeometries(feature.geometry));
        default:
            // @ts-ignore
            throw new Error(`Type ${(searchGeometry as unknown).type} is not supported`);
    }
};

const buildUrlBasePath = (mergedOptions: GeometrySearchParams): string =>
    mergedOptions.customServiceBaseURL ??
    `${mergedOptions.commonBaseURL}${PLACES_URL_PATH}/geometrySearch/${mergedOptions.query}.json`;

/**
 * Default function for building a geometry search request from {@link GeometrySearchParams}
 * @param params The geometry search parameters, with global configuration already merged into them.
 */
export const buildGeometrySearchRequest = (params: GeometrySearchParams): PostObject<GeometrySearchPayloadAPI> => {
    const url = new URL(`${buildUrlBasePath(params)}`);
    appendCommonSearchParams(url, params);

    return {
        url,
        data: {
            geometryList: params.geometries.flatMap(sdkGeometryToApiGeometries),
        },
    };
};
