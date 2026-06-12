/**
 * Interface for TomTom custom headers
 * Those headers are added in every request to TomTom services
 * * tomtom-user-agent - Name and version of this SDK
 * * Authorization - Bearer token for experimental OAuth2 support.
 * Based on the apiAccessToken parameter.
 * Tracking-ID - @see https://docs.tomtom.com/search-api/documentation/search-service/fuzzy-search#trackingid-request
 * @ignore
 */
export type TomTomHeaders = {
    'tomtom-user-agent'?: string;
    Authorization?: string;
    'Tracking-ID'?: string;
};

/**
 * Service-specific TomTom API headers, declared per-request by a service's
 * request builder (not added globally). Widen this type when a new service
 * needs a header outside the existing set.
 * @ignore
 */
export type TomTomAPIHeaders = {
    'TomTom-Api-Key'?: string;
    'TomTom-Api-Version'?: string;
    'Accept-Language'?: string;
    Attributes?: string;
};
