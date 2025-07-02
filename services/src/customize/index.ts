/**
 * @module services-customization
 * @category Service
 */
import revgeoCustomize from '../revgeo/customize';
import geocodeCustomize from '../geocode/customize';
import geometryDataCustomize from '../geometry-data/customize';
import geometrySearchCustomize from '../geometry-search/customize';
import routingCustomize from '../routing/customize';
import reachableRangeCustomize from '../reachable-range/customize';
import evChargingStationsAvailabilityCustomize from '../ev-charging-stations-availability/customize';
import placeByIDCustomize from '../place-by-id/customize';
import autocompleteCustomize from '../autocomplete-search/customize';

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
