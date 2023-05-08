import { ServiceTemplate } from "../shared";
import { get } from "../shared/fetch";
import { placeByIdRequestSchema } from "./placeByIdSchema";
import { PlaceByIdParams, PlaceByIdResponse, PlaceByIdResponseAPI } from "./types";
import { buildPlaceByIdRequest } from "./requestBuilder";
import { parsePlaceByIdResponse } from "./responseParser";

/**
 * Place By Is template type.
 */
export type PlaceByIdTemplate = ServiceTemplate<PlaceByIdParams, URL, PlaceByIdResponseAPI, PlaceByIdResponse>;

/**
 * Place By Id template main implementation.
 */
export const placeByIdTemplate: PlaceByIdTemplate = {
    requestValidation: { schema: placeByIdRequestSchema },
    buildRequest: buildPlaceByIdRequest,
    sendRequest: get,
    parseResponse: parsePlaceByIdResponse
};
