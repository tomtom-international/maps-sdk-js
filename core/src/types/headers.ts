/**
 * Interface for TomTom custom headers
 * Those headers are added in every request to TomTom services
 * * TomTom-User-Agent - Name and version of this SDK
 * * Authorization - Bearer token for experimental OAuth2 support.
 * Based on the apiAccessToken parameter.
 * Tracking-ID - @see https://developer.tomtom.com/search-api/documentation/search-service/fuzzy-search#trackingid-request
 * @ignore
 */
export type TomTomHeaders = {
    'TomTom-User-Agent'?: string;
    Authorization?: string;
    'Tracking-ID'?: string;
};
