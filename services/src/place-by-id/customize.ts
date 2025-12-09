import type { PlaceByIdTemplate } from './placeByIdTemplate';
import { placeByIdTemplate } from './placeByIdTemplate';
import { buildPlaceByIdRequest } from './requestBuilder';
import { parsePlaceByIdResponse } from './responseParser';

const customize: {
    buildPlaceByIdRequest: typeof buildPlaceByIdRequest;
    parsePlaceByIdResponse: typeof parsePlaceByIdResponse;
    placeByIdTemplate: PlaceByIdTemplate;
} = {
    buildPlaceByIdRequest,
    parsePlaceByIdResponse,
    placeByIdTemplate,
};
export default customize;
