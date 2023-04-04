import { GlobalConfig } from "../config/GlobalConfig";

/**
 * SDK name used TomTom custom header TomTom-User-Agent
 * @ignore
 */
export const TOMTOM_USER_AGENT_SDK_NAME = "TomTomSDKsMapsJS";
// Rollup replace plugin will literally replace __SDK_VERSION__ to the actual root package
// version in build time
const SDK_VERSION = "__SDK_VERSION__";

/**
 * Validate if the string to be used in the Tracking-ID header is valid.
 * The value must match the regular expression '^[a-zA-Z0-9-]{1,100}$'.
 * @see Tracking-ID: https://developer.tomtom.com/search-api/documentation/search-service/fuzzy-search#trackingid-request
 *
 * @param trackingId String to be validated
 */
const validateTrackingId = (trackingId: string): string => {
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(trackingId)) {
        // If we send a invalid Tracking-ID value, a HTTP Bad Request 400 status code is
        // returned and the request will fail. To avoid this issue, we throw an error before
        // the request is made.
        throw new TypeError(
            // eslint-disable-next-line max-len
            `a string matching regular expression ^[a-zA-Z0-9-]{1,100}$ is expected, but ${trackingId} ['${typeof trackingId}'] given`
        );
    }

    return trackingId;
};

/**
 * Interface for TomTom custom headers
 * Those headers are added in every request to TomTom services
 * Tracking-ID - @see https://developer.tomtom.com/search-api/documentation/search-service/fuzzy-search#trackingid-request
 * TomTom-User-Agent - Name and version of this SDK
 * @ignore
 */
export interface TomTomCustomHeaders {
    "TomTom-User-Agent": string;
    "Tracking-ID"?: string;
}

/**
 * Generate an object with TomTom custom headers values.
 *
 * @ignore
 * @param config Global SDK configuration
 */
export const generateTomTomCustomHeaders = (config: Partial<GlobalConfig>): TomTomCustomHeaders => {
    const tomtomHeaders: TomTomCustomHeaders = {
        "TomTom-User-Agent": `${TOMTOM_USER_AGENT_SDK_NAME}/${SDK_VERSION}`
    };

    if (config.trackingId) {
        tomtomHeaders["Tracking-ID"] = validateTrackingId(config.trackingId);
    }

    return tomtomHeaders;
};
