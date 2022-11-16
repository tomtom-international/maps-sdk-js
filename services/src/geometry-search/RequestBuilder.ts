import { PostObject } from "../shared/Fetch";
import { GeometryAPI, GeometrySearchParams, SearchByGeometryPayloadAPI, SearchGeometryInput } from "./types";
import { positionToCSVLatLon } from "../shared/Geometry";
import {
    appendByJoiningParamValue,
    appendCommonParams,
    appendLatLonParamsFromPosition,
    appendOptionalParam,
    mapPOICategoriesToIDs
} from "../shared/RequestBuildingUtils";
import { sampleWithinMaxLength } from "../shared/Arrays";

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
    const urlParams = url.searchParams;

    appendCommonParams(urlParams, params);
    appendOptionalParam(urlParams, "limit", params.limit);
    appendLatLonParamsFromPosition(urlParams, params.position);

    appendByJoiningParamValue(urlParams, "fuelSet", params.fuels);
    appendByJoiningParamValue(urlParams, "idxSet", params.indexes);
    appendByJoiningParamValue(urlParams, "brandSet", params.poiBrands);
    params.poiCategories &&
        appendByJoiningParamValue(urlParams, "categorySet", mapPOICategoriesToIDs(params.poiCategories));
    appendByJoiningParamValue(urlParams, "connectorSet", params.connectors);
    appendByJoiningParamValue(urlParams, "mapcodes", params.mapcodes);
    appendByJoiningParamValue(urlParams, "extendedPostalCodesFor", params.extendedPostalCodesFor);

    appendOptionalParam(urlParams, "minPowerKW", params.minPowerKW);
    appendOptionalParam(urlParams, "maxPowerKW", params.maxPowerKW);
    appendOptionalParam(urlParams, "view", params.view);
    appendOptionalParam(urlParams, "openingHours", params.openingHours);
    appendOptionalParam(urlParams, "timeZone", params.timeZone);
    appendOptionalParam(urlParams, "relatedPois", params.relatedPois);
    appendByJoiningParamValue(urlParams, "entityTypeSet", params.geographyTypes);

    return {
        url,
        data: {
            geometryList: params.geometries.flatMap(sdkGeometryToAPIGeometries)
        }
    };
};
