/**
 * This module contains functions that enable connection to TomTom services.
 * @module
 */
import revgeoCustomize from "./src/revgeo/customize";
import geocodeCustomize from "./src/geocode/customize";
import routingCustomize from "./src/routing/customize";
import geometrySearchCustomize from "./src/geometry-search/customize";
import chargingAvailabilityCustomize from "./src/charging-availability/customize";

export * from "./src/shared/ServiceTemplate";
export * from "./src/shared/ServiceTypes";

export * from "./src/revgeo";
export * from "./src/geocode";
export * from "./src/geometry-data";
export * from "./src/geometry-search";
export * from "./src/routing";
export * from "./src/charging-availability";

export const customizeService = {
    reverseGeocode: revgeoCustomize,
    geocode: geocodeCustomize,
    calculateRoute: routingCustomize,
    geometrySearch: geometrySearchCustomize,
    chargingAvailability: chargingAvailabilityCustomize
};
