import { placeByIdTemplate } from './placeByIdTemplate';
import { buildPlaceByIdRequest } from './requestBuilder';
import { parsePlaceByIdResponse } from './responseParser';

const customize = {
    buildPlaceByIdRequest,
    parsePlaceByIdResponse,
    placeByIdTemplate,
};
export default customize;
