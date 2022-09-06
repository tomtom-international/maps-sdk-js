import { buildRevGeoRequest } from "./RequestBuilder";
import { parseRevGeoResponse } from "./ResponseParser";
import { reverseGeocodingTemplate } from "./ReverseGeocodingTemplate";

const customize = {
    buildRevGeoRequest,
    parseRevGeoResponse,
    reverseGeocodingTemplate
};
export default customize;
