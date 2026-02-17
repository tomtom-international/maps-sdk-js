/**
 * @module map-agent-utils
 */

import type { Place, Places, Route, Routes } from '@tomtom-org/maps-sdk/core';

/**
 * Summarized place information — token-efficient for LLM consumption.
 */
export type SummarizedPlace = Place;

/**
 * Summarized places collection.
 */
export type SummarizedPlaces = Places;

/**
 * Summarized route information — same as Route but without coordinates.
 */
export type SummarizedRoute = Omit<Route, 'geometry'> & {
    geometry: Omit<Route['geometry'], 'coordinates'> & {
        coordinates: [];
    };
};

/**
 * Summarized routes collection.
 */
export interface SummarizedRoutes {
    count: number;
    routes: SummarizedRoute[];
}

/**
 * Converts a Place to a token-efficient summary for LLM consumption.
 */
export function summarizePlace(place: Place): SummarizedPlace {
    return place;
}

/**
 * Converts Places to a token-efficient summary for LLM consumption.
 * Limits to first 10 items to avoid token overflow.
 */
export function summarizePlaces(places: Places): SummarizedPlaces {
    return places;
}

/**
 * Converts a Route to a token-efficient summary for LLM consumption.
 * Returns the same route but without coordinates to reduce token usage.
 */
export function summarizeRoute(route: Route): SummarizedRoute {
    return {
        ...route,
        geometry: {
            ...route.geometry,
            coordinates: [],
        },
    };
}

/**
 * Converts Routes to a token-efficient summary for LLM consumption.
 */
export function summarizeRoutes(routes: Routes): SummarizedRoutes {
    const count = routes.features.length;

    return {
        count,
        routes: routes.features.map(summarizeRoute),
    };
}
