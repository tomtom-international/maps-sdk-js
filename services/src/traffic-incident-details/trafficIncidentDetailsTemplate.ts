import type { TrafficIncidentDetails } from '@tomtom-org/maps-sdk/core';
import type { FetchInput, ServiceTemplate } from '../shared';
import { fetchWith } from '../shared/fetch';
import { buildTrafficIncidentDetailsRequest } from './requestBuilder';
import { parseTrafficIncidentDetailsResponse } from './responseParser';
import { trafficIncidentDetailsRequestSchema } from './trafficIncidentDetailsRequestSchema';
import type { IncidentDetailsResponseAPI } from './types/apiTypes';
import type { TrafficIncidentDetailsParams } from './types/trafficIncidentDetailsParams';

type TrafficIncidentDetailsPostBody = { ids: string[] };

/**
 * Traffic Incident Details service template type.
 * @ignore
 */
export type TrafficIncidentDetailsTemplate = ServiceTemplate<
    TrafficIncidentDetailsParams,
    FetchInput<TrafficIncidentDetailsPostBody>,
    IncidentDetailsResponseAPI,
    TrafficIncidentDetails
>;

/**
 * Traffic Incident Details service template main implementation.
 * @ignore
 */
export const trafficIncidentDetailsTemplate: TrafficIncidentDetailsTemplate = {
    requestValidation: { schema: trafficIncidentDetailsRequestSchema },
    buildRequest: buildTrafficIncidentDetailsRequest,
    sendRequest: fetchWith,
    parseResponse: parseTrafficIncidentDetailsResponse,
};
