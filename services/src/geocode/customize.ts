import { geocodingTemplate } from './geocodingTemplate';
import { buildGeocodingRequest } from './requestBuilder';
import { parseGeocodingResponse } from './responseParser';

const customize = {
    buildGeocodingRequest,
    parseGeocodingResponse,
    geocodingTemplate,
};
export default customize;
