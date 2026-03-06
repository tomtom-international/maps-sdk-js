import { buildTrafficAreaAnalyticsRequest } from './requestBuilder';
import { parseTrafficAreaAnalyticsResponse } from './responseParser';
import type { TrafficAreaAnalyticsTemplate } from './trafficAreaAnalyticsTemplate';
import { trafficAreaAnalyticsTemplate } from './trafficAreaAnalyticsTemplate';

const customize: {
    buildTrafficAreaAnalyticsRequest: typeof buildTrafficAreaAnalyticsRequest;
    parseTrafficAreaAnalyticsResponse: typeof parseTrafficAreaAnalyticsResponse;
    trafficAreaAnalyticsTemplate: TrafficAreaAnalyticsTemplate;
} = {
    buildTrafficAreaAnalyticsRequest,
    parseTrafficAreaAnalyticsResponse,
    trafficAreaAnalyticsTemplate,
};
export default customize;
