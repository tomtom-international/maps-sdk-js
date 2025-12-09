import { buildRevGeoRequest } from './requestBuilder';
import { parseRevGeoResponse } from './responseParser';
import type { ReverseGeocodingTemplate } from './reverseGeocodingTemplate';
import { reverseGeocodingTemplate } from './reverseGeocodingTemplate';

const customize: {
    buildRevGeoRequest: typeof buildRevGeoRequest;
    parseRevGeoResponse: typeof parseRevGeoResponse;
    reverseGeocodingTemplate: ReverseGeocodingTemplate;
} = {
    buildRevGeoRequest,
    parseRevGeoResponse,
    reverseGeocodingTemplate,
};
export default customize;
