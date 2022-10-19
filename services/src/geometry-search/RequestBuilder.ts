import { PostObject } from "../shared/Fetch";
import {
    CircleAPI,
    GeometryAPI,
    GeometrySDK,
    GeometrySearchParams,
    PolygonAPI,
    SearchByGeometryPayloadAPI
} from "./types";
import { appendByJoiningParamValue, appendCommonParams, appendOptionalParam } from "../shared/RequestBuildingUtils";
import { positionToCSVLatLon } from "../shared/Geometry";

const sdkGeometryToAPIGeometry = (obj: GeometrySDK): GeometryAPI => {
    if (obj.type === "Circle") {
        return {
            type: "CIRCLE",
            radius: obj.radius,
            position: positionToCSVLatLon(obj.coordinates)
        } as CircleAPI;
    }

    if (obj.type === "Polygon") {
        return {
            type: "POLYGON",
            vertices: obj.coordinates[0].map((coord) => positionToCSVLatLon(coord))
        } as PolygonAPI;
    }

    throw new Error(`Type ${obj.type} is not supported`);
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

    appendByJoiningParamValue(urlParams, "fuelSet", params.fuels);
    appendByJoiningParamValue(urlParams, "idxSet", params.indexes);
    appendByJoiningParamValue(urlParams, "brandSet", params.poiBrands);
    appendByJoiningParamValue(urlParams, "categorySet", params.poiCategories);
    appendByJoiningParamValue(urlParams, "connectorSet", params.connectors);
    appendByJoiningParamValue(urlParams, "mapcodes", params.mapcodes);
    appendByJoiningParamValue(urlParams, "extendedPostalCodesFor", params.extendedPostalCodesFor);

    appendOptionalParam(urlParams, "minPowerKW", params.minPowerKW);
    appendOptionalParam(urlParams, "maxPowerKW", params.maxPowerKW);
    appendOptionalParam(urlParams, "view", params.view);
    appendOptionalParam(urlParams, "openingHours", params.openingHours);
    appendOptionalParam(urlParams, "timeZone", params.timeZone);
    appendOptionalParam(urlParams, "relatedPois", params.relatedPois);
    appendByJoiningParamValue(urlParams, "entityTypeSet", params.entityTypes);

    return {
        url,
        data: {
            geometryList: params.geometries.map(sdkGeometryToAPIGeometry)
        }
    };
};
