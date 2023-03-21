import { GeometryDataResponse } from "@anw/maps-sdk-js/core";
import { GeometryDataParams } from "./types/GeometryDataParams";
import { geometryDataTemplate, GeometryDataTemplate } from "./GeometryDataTemplate";
import { callService } from "../shared/ServiceTemplate";

/**
 * The Geometries Data service returns sets of coordinates that represent the outline of a city, country, or land area.
 * * The service supports batch requests of up to 20 identifiers.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/additional-data-service/additional-data
 */
export const geometryData = async (
    params: GeometryDataParams,
    customTemplate?: Partial<GeometryDataTemplate>
): Promise<GeometryDataResponse> => {
    return callService(params, { ...geometryDataTemplate, ...customTemplate }, "GeometryData");
};
