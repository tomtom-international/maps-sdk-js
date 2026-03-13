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
