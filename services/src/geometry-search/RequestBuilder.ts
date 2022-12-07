import { PostObject } from "../shared/Fetch";
import { GeometryAPI, GeometrySearchParams, SearchByGeometryPayloadAPI, SearchGeometryInput } from "./types";
import { positionToCSVLatLon } from "../shared/Geometry";
import { sampleWithinMaxLength } from "../shared/Arrays";
import { buildSearchRequest } from "../search/RequestBuilder";

const sdkGeometryToAPIGeometries = (searchGeometry: SearchGeometryInput): GeometryAPI[] => {
    switch (searchGeometry.type) {
        case "Circle":
            return [
                {
                    type: "CIRCLE",
                    radius: searchGeometry.radius,
                    position: positionToCSVLatLon(searchGeometry.coordinates)
                }
            ];
        case "Polygon":
            return [
                {
                    type: "POLYGON",
                    vertices: sampleWithinMaxLength(searchGeometry.coordinates[0], 50).map((coord) =>
                        positionToCSVLatLon(coord)
                    )
                }
            ];
        case "MultiPolygon":
            return searchGeometry.coordinates.flatMap((polygonCoords) =>
                sdkGeometryToAPIGeometries({ type: "Polygon", coordinates: polygonCoords })
            );
        case "FeatureCollection":
            return searchGeometry.features.flatMap((feature) => sdkGeometryToAPIGeometries(feature.geometry));
        default:
            // @ts-ignore
            throw new Error(`Type ${(searchGeometry as unknown).type} is not supported`);
    }
};

const buildURLBasePath = (mergedOptions: GeometrySearchParams): string =>
    mergedOptions.customServiceBaseURL ||
    `${mergedOptions.commonBaseURL}/search/2/geometrySearch/${mergedOptions.query}.json`;

/**
 * Default function for building a geometry search request from {@link GeometrySearchParams}
 * @group Geometry Search
 * @category Functions
 * @param params The geometry search parameters, with global configuration already merged into them.
 */
export const buildGeometrySearchRequest = (params: GeometrySearchParams): PostObject<SearchByGeometryPayloadAPI> => {
    const url = new URL(`${buildURLBasePath(params)}`);
    buildSearchRequest(url, params);

    return {
        url,
        data: {
            geometryList: params.geometries.flatMap(sdkGeometryToAPIGeometries)
        }
    };
};
