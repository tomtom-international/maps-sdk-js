import { Place, Places } from "@anw/maps-sdk-js/core";
import { GeometriesInput, GeometryParams } from "./types/GeometryDataParams";
import { appendOptionalParam } from "../shared/RequestBuildingUtils";
import { arrayToCSV } from "../shared/Arrays";

const buildURLBasePath = (params: GeometryParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/2/additionalData.json`;

const getGeometryIDs = (placesArray: Place[]): string[] =>
    placesArray.map((place) => place.properties.dataSources?.geometry?.id as string).filter((id) => id);

// (@see geometryDataRequestSchema)
const appendGeometries = (urlParams: URLSearchParams, geometries: GeometriesInput | Places | Place[]): void => {
    let geometryIDs: string[];

    if (Array.isArray(geometries)) {
        // (assuming min and max length already validated)
        if (typeof geometries[0] === "string") {
            geometryIDs = geometries as string[];
        } else {
            geometryIDs = getGeometryIDs(geometries as Place[]);
        }
    } else {
        // (assuming already validated as FeatureCollection)
        geometryIDs = getGeometryIDs(geometries.features);
    }

    urlParams.append("geometries", arrayToCSV(geometryIDs));
};

/**
 * Default function for building a geometry data request from {@link GeometryDataParams}
 * @param params The geometry data parameters, with global configuration already merged into them.
 */
export const buildGeometryDataRequest = (params: GeometryParams): URL => {
    const url = new URL(buildURLBasePath(params));
    const urlParams = url.searchParams;
    // (no language in this service)
    urlParams.append("key", params.apiKey as string);
    appendGeometries(urlParams, params.geometries);
    appendOptionalParam(urlParams, "geometriesZoom", params.zoom);
    return url;
};
