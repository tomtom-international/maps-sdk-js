import type { GeocodingTemplate } from './geocodingTemplate';
import { geocodingTemplate } from './geocodingTemplate';
import { buildGeocodingRequest } from './requestBuilder';
import { parseGeocodingResponse } from './responseParser';

const customize: {
    buildGeocodingRequest: typeof buildGeocodingRequest;
    parseGeocodingResponse: typeof parseGeocodingResponse;
    geocodingTemplate: GeocodingTemplate;
} = {
    buildGeocodingRequest,
    parseGeocodingResponse,
    geocodingTemplate,
};
export default customize;
