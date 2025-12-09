/**
 * @module services-customization
 * @group Customization
 */

import autocompleteCustomize from '../autocomplete-search/customize';
import evChargingStationsAvailabilityCustomize from '../ev-charging-stations-availability/customize';
import geocodeCustomize from '../geocode/customize';
import geometryDataCustomize from '../geometry-data/customize';
import geometrySearchCustomize from '../geometry-search/customize';
import placeByIdCustomize from '../place-by-id/customize';
import reachableRangeCustomize from '../reachable-range/customize';
import revgeoCustomize from '../revgeo/customize';
import routingCustomize from '../routing/customize';

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
 * // Access request builder for custom processing
 * import { customizeService } from '@tomtom-international/web-sdk-services';
 *
 * const { buildRequest } = customizeService.geocode;
 * const request = buildRequest({
 *   key: 'your-api-key',
 *   query: 'Amsterdam'
 * });
 *
 * // Access response parser for custom handling
 * const { parseResponse } = customizeService.geocode;
 * const rawApiResponse = await fetch(request.url);
 * const parsedData = parseResponse(await rawApiResponse.json());
 * ```
 *
 * @group Advanced
 */
export const customizeService: {
    reverseGeocode: typeof revgeoCustomize;
    geocode: typeof geocodeCustomize;
    geometryData: typeof geometryDataCustomize;
    geometrySearch: typeof geometrySearchCustomize;
    calculateRoute: typeof routingCustomize;
    reachableRange: typeof reachableRangeCustomize;
    evChargingStationsAvailability: typeof evChargingStationsAvailabilityCustomize;
    placeByID: typeof placeByIdCustomize;
    autocompleteSearch: typeof autocompleteCustomize;
} = {
    reverseGeocode: revgeoCustomize,
    geocode: geocodeCustomize,
    geometryData: geometryDataCustomize,
    geometrySearch: geometrySearchCustomize,
    calculateRoute: routingCustomize,
    reachableRange: reachableRangeCustomize,
    evChargingStationsAvailability: evChargingStationsAvailabilityCustomize,
    placeByID: placeByIdCustomize,
    autocompleteSearch: autocompleteCustomize,
};
