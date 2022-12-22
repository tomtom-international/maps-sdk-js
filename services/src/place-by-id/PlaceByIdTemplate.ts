import { ServiceTemplate } from "../shared";
import { getJson } from "../shared/Fetch";
import { placeByIdRequestSchema } from "./PlaceByIdSchema";
import { PlaceByIdParams, PlaceByIdResponse, PlaceByIdResponseAPI } from "./types";
import { buildPlaceByIdRequest } from "./RequestBuilder";
import { parsePlaceByIdResponse } from "./ResponseParser";

/**
 * Place By Is template type.
 * @group Place By Id
 * @category Types
 */
export type PlaceByIdTemplate = ServiceTemplate<PlaceByIdParams, URL, PlaceByIdResponseAPI, PlaceByIdResponse>;

/**
 * Place By Id template main implementation.
 * @group Place By Id
 * @category Variables
 */
export const placeByIdTemplate: PlaceByIdTemplate = {
    buildRequest: buildPlaceByIdRequest,
    sendRequest: getJson,
    parseResponse: parsePlaceByIdResponse,
    validateRequestSchema: placeByIdRequestSchema
};
