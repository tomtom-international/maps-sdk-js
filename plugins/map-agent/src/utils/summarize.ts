/**
 * @module map-agent-utils
 */

import type { Place, Places, Route, Routes } from '@tomtom-org/maps-sdk/core';

/**
 * Summarized place information — token-efficient for LLM consumption.
 */
export interface SummarizedPlace {
    name: string;
    address: string;
    category?: string;
    position: [number, number];
}

/**
 * Summarized places collection.
 */
export interface SummarizedPlaces {
    count: number;
    places: SummarizedPlace[];
}

/**
 * Summarized route information.
 */
export interface SummarizedRoute {
    distance: string;
    duration: string;
    summary: string;
}

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
    const coords = place.geometry.coordinates;
    const props = place.properties;

    return {
        name: props.poi?.name || props.address.freeformAddress,
        address: props.address.freeformAddress,
        category: props.poi?.categories?.[0],
        position: [coords[0], coords[1]],
    };
}

/**
 * Converts Places to a token-efficient summary for LLM consumption.
 * Limits to first 10 items to avoid token overflow.
 */
export function summarizePlaces(places: Places): SummarizedPlaces {
    const count = places.features.length;
    const limit = Math.min(count, 10);

    return {
        count,
        places: places.features.slice(0, limit).map(summarizePlace),
    };
}

/**
 * Formats meters to kilometers or meters with appropriate unit.
 */
function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}

/**
 * Formats seconds to hours/minutes or minutes.
 */
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Converts a Route to a token-efficient summary for LLM consumption.
 */
export function summarizeRoute(route: Route): SummarizedRoute {
    const summary = route.properties.summary;

    return {
        distance: formatDistance(summary.lengthInMeters),
        duration: formatDuration(summary.travelTimeInSeconds),
        summary: `${formatDistance(summary.lengthInMeters)} in ${formatDuration(summary.travelTimeInSeconds)}`,
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
