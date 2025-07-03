/**
 * @module services-customization
 * @category Service
 */

import autocompleteCustomize from '../autocomplete-search/customize';
import evChargingStationsAvailabilityCustomize from '../ev-charging-stations-availability/customize';
import geocodeCustomize from '../geocode/customize';
import geometryDataCustomize from '../geometry-data/customize';
import geometrySearchCustomize from '../geometry-search/customize';
import placeByIDCustomize from '../place-by-id/customize';
import reachableRangeCustomize from '../reachable-range/customize';
import revgeoCustomize from '../revgeo/customize';
import routingCustomize from '../routing/customize';

/**
 * Access to service implementation parts for customization.
 */
export const customizeService = {
    reverseGeocode: revgeoCustomize,
    geocode: geocodeCustomize,
    geometryData: geometryDataCustomize,
    geometrySearch: geometrySearchCustomize,
    calculateRoute: routingCustomize,
    reachableRange: reachableRangeCustomize,
    evChargingStationsAvailability: evChargingStationsAvailabilityCustomize,
    placeByID: placeByIDCustomize,
    autocompleteSearch: autocompleteCustomize,
};
