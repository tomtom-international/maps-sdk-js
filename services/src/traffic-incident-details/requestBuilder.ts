import type { FetchInput } from '../shared';
import {
    appendByJoiningParamValue,
    appendCommonParams,
    appendOptionalParam,
} from '../shared/request/requestBuildingUtils';
import type { TrafficIncidentDetailsParams } from './types/trafficIncidentDetailsParams';

const TRAFFIC_URL_PATH = '/maps/orbis/traffic';

// Request all available incident fields by default so callers get a complete response without
// having to manually specify a projection string.
const DEFAULT_FIELDS =
    '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity,probabilityOfOccurrence,numberOfReports,lastReportTime,tmc{countryCode,tableNumber,tableVersion,direction,points{location,offset}}}}}';

type TrafficIncidentDetailsPostBody = { ids: string[] };

const buildUrlBasePath = (params: TrafficIncidentDetailsParams): string =>
    params.customServiceBaseURL ?? `${params.commonBaseURL}${TRAFFIC_URL_PATH}/incidentDetails`;

const appendOptionalParams = (urlParams: URLSearchParams, params: TrafficIncidentDetailsParams): void => {
    appendOptionalParam(urlParams, 'fields', DEFAULT_FIELDS);
    appendOptionalParam(urlParams, 't', params.trafficModelId);
    appendByJoiningParamValue(urlParams, 'categoryFilter', params.categoryFilter);
    appendByJoiningParamValue(urlParams, 'timeValidityFilter', params.timeValidityFilter);
};

/**
 * Default method for building a traffic incident details request from {@link TrafficIncidentDetailsParams}.
 * @param params The traffic incident details parameters, with global configuration already merged into them.
 */
export const buildTrafficIncidentDetailsRequest = (
    params: TrafficIncidentDetailsParams,
): FetchInput<TrafficIncidentDetailsPostBody> => {
    const url = new URL(buildUrlBasePath(params));
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    appendOptionalParams(urlParams, params);

    if ('bbox' in params && params.bbox) {
        urlParams.append('bbox', params.bbox.join(','));
        return { method: 'GET', url };
    }

    // ids-based request — POST when there are more than 5 IDs (GET limit), GET otherwise
    const { ids } = params as { ids: string[] };

    if (ids.length > 5) {
        return { method: 'POST', url, data: { ids } };
    }

    urlParams.append('ids', ids.join(','));
    return { method: 'GET', url };
};
