import { callService } from "../shared/ServiceTemplate";
import { PlaceByIdParams, PlaceByIdResponse } from "./types";
import { placeByIdTemplate, PlaceByIdTemplate } from "./PlaceByIdTemplate";

/**
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/geocoding-service/geocode
 */
export const placeById = async (
    params: PlaceByIdParams,
    customTemplate?: Partial<PlaceByIdTemplate>
): Promise<PlaceByIdResponse> => {
    return callService(params, { ...placeByIdTemplate, ...customTemplate }, "PlaceById");
};

export default placeById;
