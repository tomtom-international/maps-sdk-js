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

    // common parameters
    mergedParams.apiKey && urlParams.append("key", mergedParams.apiKey);
    mergedParams.language && urlParams.append("language", mergedParams.language);

    // method-specific parameters
    if (mergedParams.fuels?.length) {
        urlParams.append("fuelSet", mergedParams.fuels.join(","));
    }
    if (mergedParams.indexes?.length) {
        urlParams.append("idxSet", mergedParams.indexes.join(","));
    }
    if (mergedParams.brands?.length) {
        urlParams.append("brandSet", mergedParams.brands.join(","));
    }
    if (mergedParams.categories?.length) {
        urlParams.append("categorySet", mergedParams.categories.join(","));
    }
    if (mergedParams.connectors?.length) {
        urlParams.append("connectorSet", mergedParams.connectors.join(","));
    }
    if (mergedParams.mapcodes?.length) {
        urlParams.append("mapcodes", mergedParams.mapcodes.join(","));
    }

    return {
        url,
        data: {
            geometryList: params.geometryList.map(sdkGeometryToTTGeometry)
        }
    };
};
