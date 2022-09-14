import { mergeFromGlobal } from "@anw/go-sdk-js/core";

import { PostObject } from "../shared/Fetch";
import {
    SearchByGeometryPayloadAPI,
    CircleAPI,
    GeometryAPI,
    PolygonAPI,
    GeometrySearchRequest,
    GeometrySDK
} from "./types";
import { appendByJoiningParamValue, appendCommonParams, appendParameter } from "../shared/RequestBuildingUtils";

export const sdkGeometryToTTGeometry = (obj: GeometrySDK): GeometryAPI => {
    if (obj.type === "Circle") {
        return {
            type: "CIRCLE",
            radius: obj.radius,
            position: obj.coordinates.join(",")
        } as CircleAPI;
    }

    if (obj.type === "Polygon") {
        return {
            type: "POLYGON",
            vertices: obj.coordinates[0].map((coord) => coord.join(","))
        } as PolygonAPI;
    }

    throw new Error(`Type ${obj.type} is not supported`);
};

const buildURLBasePath = (mergedOptions: GeometrySearchRequest): string =>
    mergedOptions.customServiceBaseURL ||
    `${mergedOptions.commonBaseURL}/search/2/geometrySearch/${mergedOptions.query}.json`;

export const buildGeometrySearchRequest = (params: GeometrySearchRequest): PostObject<SearchByGeometryPayloadAPI> => {
    const mergedParams = mergeFromGlobal(params);
    const url = new URL(`${buildURLBasePath(mergedParams)}`);
    const urlParams = url.searchParams;

    appendCommonParams(urlParams, mergedParams);
    appendParameter(urlParams, "limit", mergedParams.limit);

    appendByJoiningParamValue(urlParams, "fuelSet", mergedParams.fuels);
    appendByJoiningParamValue(urlParams, "idxSet", mergedParams.indexes);
    appendByJoiningParamValue(urlParams, "brandSet", mergedParams.brands);
    appendByJoiningParamValue(urlParams, "categorySet", mergedParams.categories);
    appendByJoiningParamValue(urlParams, "connectorSet", mergedParams.connectors);
    appendByJoiningParamValue(urlParams, "mapcodes", mergedParams.mapcodes);
    appendByJoiningParamValue(urlParams, "extendedPostalCodesFor", mergedParams.extendedPostalCodesFor);

    appendParameter(urlParams, "minPowerKW", mergedParams.minPowerKW);
    appendParameter(urlParams, "maxPowerKW", mergedParams.maxPowerKW);
    appendParameter(urlParams, "view", mergedParams.view);
    appendParameter(urlParams, "openingHours", mergedParams.openingHours);
    appendParameter(urlParams, "timeZone", mergedParams.timeZone);
    appendParameter(urlParams, "relatedPois", mergedParams.relatedPois);
    appendByJoiningParamValue(urlParams, "entityTypeSet", mergedParams.entityTypes);

    return {
        url,
        data: {
            geometryList: params.geometryList.map(sdkGeometryToTTGeometry)
        }
    };
};
