import { buildGeocodingRequest } from "./RequestBuilder";
import { parseGeocodingResponse } from "./ResponseParser";
import { geocodingTemplate } from "./GeocodingTemplate";

const customize = {
    buildGeocodingRequest,
    parseGeocodingResponse,
    geocodingTemplate
};
export default customize;
