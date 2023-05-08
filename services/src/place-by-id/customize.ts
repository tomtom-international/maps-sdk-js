import { buildPlaceByIdRequest } from "./requestBuilder";
import { parsePlaceByIdResponse } from "./responseParser";
import { placeByIdTemplate } from "./placeByIdTemplate";

const customize = {
    buildPlaceByIdRequest,
    parsePlaceByIdResponse,
    placeByIdTemplate
};
export default customize;
