/**
 * @module agent-toolkit-utils
 */

import {
    type CommonPlaceProps,
    getPosition,
    type Place,
    type Places,
    type Route,
    type Routes,
    type Waypoint,
    type WaypointLike,
} from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';

/**
 * Token-efficient summary of a single place for LLM consumption.
 */
export type PlaceSummary = {
    name?: string;
    address?: string;
    position: [number, number];
};

/**
 * Token-efficient summary of a places collection for LLM consumption.
 */
export type PlacesSummary = {
    count: number;
    features: PlaceSummary[];
};

type RouteSummary = Route['properties']['summary'];
type LegSummary = Route['properties']['sections']['leg'][number]['summary'];

// Maps Date fields to string for LLM-safe serialization (distributive so Date | undefined → string | undefined).
type StringDateValue<T> = T extends Date ? string : T;
type StringDates<T> = { [K in keyof T]: StringDateValue<T[K]> };

/**
 * Summarized route — just the route summary and optional per-leg summaries.
 */
export type SummarizedRoute = {
    index: number;
    summary: StringDates<RouteSummary>;
    /** Per-leg summaries; only present when the route has more than one leg. */
    legSummaries?: StringDates<LegSummary>[];
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
export function summarizePlace(place: Place): PlaceSummary {
    const coordinates = place.geometry?.coordinates as [number, number] | undefined;
    return {
        name: place.properties?.poi?.name,
        address: place.properties?.address?.freeformAddress,
        position: coordinates ?? [0, 0],
    };
}

/**
 * Converts Places to a token-efficient summary for LLM consumption.
 */
export function summarizePlaces(places: Places | Place[]): PlacesSummary {
    const features = Array.isArray(places) ? places : places.features;
    return {
        count: features.length,
        features: features.map((feature) => summarizePlace(feature)),
    };
}

/**
 * Converts a Route to a token-efficient summary for LLM consumption.
 * Returns only the route summary and per-leg summaries (when more than one leg).
 */
export function summarizeRoute(route: Route): SummarizedRoute {
    const { summary, sections, index } = route.properties;
    const legs = sections.leg;

    const stringifyDates = <T extends { arrivalTime: Date; departureTime: Date }>(summary: T): StringDates<T> =>
        ({
            ...summary,
            arrivalTime: summary.arrivalTime.toISOString(),
            departureTime: summary.departureTime.toISOString(),
        }) as StringDates<T>;

    return {
        index,
        summary: stringifyDates(summary),
        ...(legs.length > 1 && { legSummaries: legs.map((leg) => stringifyDates(leg.summary)) }),
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

export const waypointSummarySchema = z.object({
    slotIndex: z.number(),
    isFilled: z.boolean(),
    address: z.string().optional(),
    position: z.array(z.number()).length(2).optional().describe('[longitude, latitude]'),
});

/**
 * Token-efficient summary of a waypoint for LLM consumption.
 */
export function summarizeWaypoint(
    waypoint: WaypointLike | null | undefined,
): z.infer<typeof waypointSummarySchema> | null {
    if (waypoint === null || waypoint === undefined) {
        return null;
    }

    const position = getPosition(waypoint);
    let address: string | undefined;
    if (!Array.isArray(waypoint)) {
        address = (waypoint as Waypoint<CommonPlaceProps>).properties?.address?.freeformAddress;
    }

    return {
        slotIndex: -1,
        isFilled: true,
        ...(address && { address }),
        ...(position && { position }),
    };
}
