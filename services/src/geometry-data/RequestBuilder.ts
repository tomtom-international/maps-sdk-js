import { GeometryDataParams } from "./types/GeometryDataParams";
import { appendOptionalParam } from "../shared/RequestBuildingUtils";
import { arrayToCSV } from "../shared/Arrays";

const buildURLBasePath = (params: GeometryDataParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}/search/2/additionalData.json`;

/**
 * Default function for building a geometry data request from {@link GeometryDataParams}
 * @group Geometry Data
 * @category Functions
 * @param params The geometry data parameters, with global configuration already merged into them.
 */
export const buildGeometryDataRequest = (params: GeometryDataParams): URL => {
    const url = new URL(buildURLBasePath(params));
    const urlParams = url.searchParams;
    // (no language in this service)
    urlParams.append("key", params.apiKey as string);
    urlParams.append("geometries", arrayToCSV(params.geometries));
    appendOptionalParam(urlParams, "geometriesZoom", params.zoom);
    return url;
};
