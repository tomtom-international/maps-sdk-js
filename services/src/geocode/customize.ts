import { buildGeocodingRequest } from "./requestBuilder";
import { parseGeocodingResponse } from "./responseParser";
import { geocodingTemplate } from "./geocodingTemplate";

const customize = {
    buildGeocodingRequest,
    parseGeocodingResponse,
    geocodingTemplate
};
export default customize;
