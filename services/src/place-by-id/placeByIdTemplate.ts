import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { placeByIdRequestSchema } from './placeByIdSchema';
import { buildPlaceByIdRequest } from './requestBuilder';
import { parsePlaceByIdResponse } from './responseParser';
import type { PlaceByIdParams, PlaceByIdResponse, PlaceByIdResponseAPI } from './types';

/**
 * Place By Is template type.
 * @ignore
 */
export type PlaceByIdTemplate = ServiceTemplate<PlaceByIdParams, URL, PlaceByIdResponseAPI, PlaceByIdResponse>;

/**
 * Place By Id template main implementation.
 * @ignore
 */
export const placeByIdTemplate: PlaceByIdTemplate = {
    requestValidation: { schema: placeByIdRequestSchema },
    buildRequest: buildPlaceByIdRequest,
    sendRequest: get,
    parseResponse: parsePlaceByIdResponse,
};
