import { buildRevGeoRequest } from './requestBuilder';
import { parseRevGeoResponse } from './responseParser';
import { reverseGeocodingTemplate } from './reverseGeocodingTemplate';

const customize = {
    buildRevGeoRequest,
    parseRevGeoResponse,
    reverseGeocodingTemplate,
};
export default customize;
