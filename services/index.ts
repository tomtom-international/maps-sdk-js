/**
 * This module contains functions that enable connection to TomTom services.
 * @module
 */
import revgeoCustomize from "./src/revgeo/customize";
import geocodeCustomize from "./src/geocode/customize";
import geometryDataCustomize from "./src/geometry-data/customize";
import geometrySearchCustomize from "./src/geometry-search/customize";
import routingCustomize from "./src/routing/customize";
import evChargingStationsAvailabilityCustomize from "./src/ev-charging-stations-availability/customize";
import placeByIDCustomize from "./src/place-by-id/customize";
import autocompleteCustomize from "./src/autocomplete/customize";

export * from "./src/shared/ServiceTemplate";
export * from "./src/shared/ServiceTypes";

export * from "./src/revgeo";
export * from "./src/geocode";
export * from "./src/geometry-data";
export * from "./src/geometry-search";
export * from "./src/geometry-data";
export * from "./src/routing";
export * from "./src/ev-charging-stations-availability";
export * from "./src/place-by-id";
export * from "./src/search";
export * from "./src/autocomplete";
/**
 * @group Shared
 * @category Variables
 */
export const customizeService = {
    reverseGeocode: revgeoCustomize,
    geocode: geocodeCustomize,
    geometryData: geometryDataCustomize,
    geometrySearch: geometrySearchCustomize,
    calculateRoute: routingCustomize,
    evChargingStationsAvailability: evChargingStationsAvailabilityCustomize,
    placeByID: placeByIDCustomize,
    autocomplete: autocompleteCustomize
};
