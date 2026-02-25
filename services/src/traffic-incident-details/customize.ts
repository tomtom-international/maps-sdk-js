import { buildTrafficIncidentDetailsRequest } from './requestBuilder';
import { parseTrafficIncidentDetailsResponse } from './responseParser';
import type { TrafficIncidentDetailsTemplate } from './trafficIncidentDetailsTemplate';
import { trafficIncidentDetailsTemplate } from './trafficIncidentDetailsTemplate';

const customize: {
    buildTrafficIncidentDetailsRequest: typeof buildTrafficIncidentDetailsRequest;
    parseTrafficIncidentDetailsResponse: typeof parseTrafficIncidentDetailsResponse;
    trafficIncidentDetailsTemplate: TrafficIncidentDetailsTemplate;
} = {
    buildTrafficIncidentDetailsRequest,
    parseTrafficIncidentDetailsResponse,
    trafficIncidentDetailsTemplate,
};
export default customize;
