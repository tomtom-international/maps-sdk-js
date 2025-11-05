import type { GlobalConfig } from '../config/globalConfig';
import type { TomTomHeaders } from '../types';

/**
 * SDK name used TomTom custom header TomTom-User-Agent
 * @ignore
 */
export const TOMTOM_USER_AGENT_SDK_NAME = 'MapsSDKJS';

/**
 * Validate if the string to be used in the Tracking-ID header is valid.
 * The value must match the regular expression '^[a-zA-Z0-9-]{1,100}$'.
 * @see Tracking-ID: https://docs.tomtom.com/search-api/documentation/search-service/fuzzy-search#trackingid-request
 *
 * @param trackingId String to be validated
 */
const validateTrackingId = (trackingId: string): string => {
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(trackingId)) {
        // If we send a invalid Tracking-ID value, a HTTP Bad Request 400 status code is
        // returned and the request will fail. To avoid this issue, we throw an error before
        // the request is made.
        throw new TypeError(
            `a string matching regular expression ^[a-zA-Z0-9-]{1,100}$ is expected, but ${trackingId} ['${typeof trackingId}'] given`,
        );
    }

    return trackingId;
};

/**
 * Generates an object with TomTom custom header values for the given common parameters.
 *
 * @ignore
 * @param params Global SDK configuration
 */
export const generateTomTomHeaders = (params: Partial<GlobalConfig>): TomTomHeaders => ({
    'TomTom-User-Agent': `${TOMTOM_USER_AGENT_SDK_NAME}/${__SDK_VERSION__}`,
    // TODO: restore if we implement oauth2 access
    // optional oauth2 access token:
    // ...(params.apiAccessToken && { Authorization: `Bearer ${params.apiAccessToken}` }),
    ...(params.trackingId && { 'Tracking-ID': validateTrackingId(params.trackingId) }),
});
