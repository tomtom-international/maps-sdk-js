import { buildPlaceByIdRequest } from "./RequestBuilder";
import { parsePlaceByIdResponse } from "./ResponseParser";
import { placeByIdTemplate } from "./PlaceByIdTemplate";

const customize = {
    buildPlaceByIdRequest,
    parsePlaceByIdResponse,
    placeByIdTemplate
};
export default customize;
