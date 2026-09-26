/**
 * @module services-customization
 * @group Customization
 */

import alongRouteSearchCustomize from '../along-route-search/customize';
import autocompleteCustomize from '../autocomplete-search/customize';
import evChargingStationsAvailabilityCustomize from '../ev-charging-stations-availability/customize';
import geocodeCustomize from '../geocode/customize';
import geometryDataCustomize from '../geometry-data/customize';
import geometrySearchCustomize from '../geometry-search/customize';
import placeByIdCustomize from '../place-by-id/customize';
import reachableRangeCustomize from '../reachable-range/customize';
import revgeoCustomize from '../revgeo/customize';
import routingCustomize from '../routing/customize';
import trafficAreaAnalyticsCustomize from '../traffic-area-analytics/customize';
import trafficIncidentDetailsCustomize from '../traffic-incident-details/customize';

/**
 * Access to service implementation components for advanced customization.
 *
 * This object provides low-level access to the internal components of each service,
 * allowing developers to customize request building, response parsing, and other
 * aspects of service behavior. This is useful for advanced use cases like:
 * - Custom request/response transformations
 * - Integration with custom API gateways or proxies
 * - Adding custom validation or error handling
 * - Implementing request/response logging or monitoring
 * - Adapting to custom API endpoints or versions
 *
 * @remarks
 * Most developers won't need to use this directly. The standard service functions
 * (like `geocode`, `search`, `calculateRoute`) are sufficient for typical use cases.
 * Only use customization when you need to modify the internal service behavior.
 *
 * Each service exposes:
 * - Request builders: Functions that construct API requests
 * - Response parsers: Functions that transform API responses
 * - Templates: Configuration objects defining service behavior
 * - Validation schemas: Input parameter validation rules
 *
 * @example
 * ```typescript
 * import { isProxyCredentialsMode, mergeFromGlobal } from '@tomtom-org/maps-sdk/core';
 * import { customizeService } from '@tomtom-org/maps-sdk/services';
 *
 * const { buildGeocodingRequest, parseGeocodingResponse } = customizeService.geocode;
 *
 * // Request builders expect the global configuration to be merged in already
 * const config = mergeFromGlobal({ query: 'Amsterdam' });
 * const { url, headers } = buildGeocodingRequest(config);
 *
 * // Send the request yourself, then parse the raw API payload. The credential travels in
 * // `headers` — pass them on, or the request is unauthenticated. With a credentials proxy
 * // (no `apiKey`, custom `commonBaseURL`) the proxy's session cookie has to travel instead,
 * // so send `credentials: 'include'` the way the SDK's own fetch does.
 * const apiResponse = await fetch(url, {
 *     headers,
 *     ...(isProxyCredentialsMode(config) && { credentials: 'include' }),
 * });
 * const places = parseGeocodingResponse(await apiResponse.json());
 * ```
 *
 * @group Advanced
 */
export const customizeService: {
    alongRouteSearch: typeof alongRouteSearchCustomize;
    reverseGeocode: typeof revgeoCustomize;
    geocode: typeof geocodeCustomize;
    geometryData: typeof geometryDataCustomize;
    geometrySearch: typeof geometrySearchCustomize;
    calculateRoute: typeof routingCustomize;
    reachableRange: typeof reachableRangeCustomize;
    evChargingStationsAvailability: typeof evChargingStationsAvailabilityCustomize;
    trafficAreaAnalytics: typeof trafficAreaAnalyticsCustomize;
    trafficIncidentDetails: typeof trafficIncidentDetailsCustomize;
    placeByID: typeof placeByIdCustomize;
    autocompleteSearch: typeof autocompleteCustomize;
} = {
    alongRouteSearch: alongRouteSearchCustomize,
    reverseGeocode: revgeoCustomize,
    geocode: geocodeCustomize,
    geometryData: geometryDataCustomize,
    geometrySearch: geometrySearchCustomize,
    calculateRoute: routingCustomize,
    reachableRange: reachableRangeCustomize,
    evChargingStationsAvailability: evChargingStationsAvailabilityCustomize,
    trafficAreaAnalytics: trafficAreaAnalyticsCustomize,
    trafficIncidentDetails: trafficIncidentDetailsCustomize,
    placeByID: placeByIdCustomize,
    autocompleteSearch: autocompleteCustomize,
};
