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
import type { FeatureFlags } from '../types';

/** @ignore */
export type PlaceSummary = {
    id: string;
    name?: string;
    address?: string;
    position: [number, number];
    // Populated only when `experimentalSearch` is on and the underlying place came from the
    // exploration-search backend (DE / NL / FR municipality pipeline).
    areaId?: string;
    areaCountry?: string;
    areaTags?: string[];
};

/** @ignore */
export type PlacesSummary = { count: number; features: PlaceSummary[] };

/** Max number of place summaries echoed back to the LLM by summarizePlaces. */
const PLACES_SUMMARY_LIMIT = 5;

type RouteSummary = Route['properties']['summary'];
type LegSummary = Route['properties']['sections']['leg'][number]['summary'];

// Maps Date fields to string for LLM-safe serialization (distributive so Date | undefined → string | undefined).
type StringDateValue<T> = T extends Date ? string : T;

/** @ignore */
export type StringDates<T> = { [K in keyof T]: StringDateValue<T[K]> };

/** @ignore */
export type SummarizedRoute = {
    index: number;
    summary: StringDates<RouteSummary>;
    /** Per-leg summaries; only present when the route has more than one leg. */
    legSummaries?: StringDates<LegSummary>[];
};

/** @ignore */
export type SummarizedRoutes = { count: number; routes: SummarizedRoute[] };

/**
 * Converts a Place to a token-efficient summary for LLM consumption.
 *
 * When `flags.experimentalSearch` is `true`, the exploration-search-only
 * `areaId` / `areaCountry` / `areaTags` fields (when present on the source
 * place) are also copied into the summary. When the flag is off they are
 * always omitted, regardless of what the source place carries.
 *
 * @ignore
 */
export const summarizePlace = (place: Place, flags: FeatureFlags = {}): PlaceSummary => {
    const summary: PlaceSummary = {
        id: place.id,
        name: place.properties?.poi?.name,
        address: place.properties?.address?.freeformAddress,
        position: (place.geometry?.coordinates ?? [0, 0]) as [number, number],
    };
    if (flags.experimentalSearch) {
        const props = place.properties as
            | {
                  areaId?: string;
                  areaCountry?: string;
                  areaTags?: string[];
              }
            | undefined;
        if (props?.areaId) summary.areaId = props.areaId;
        if (props?.areaCountry) summary.areaCountry = props.areaCountry;
        if (props?.areaTags?.length) summary.areaTags = props.areaTags;
    }
    return summary;
};

/**
 * Converts Places to a token-efficient summary for LLM consumption.
 * Returns the total count plus the first {@link PLACES_SUMMARY_LIMIT} summaries
 * to keep the tool output bounded regardless of result size.
 *
 * @ignore
 */
export const summarizePlaces = (places: Places | Place[], flags: FeatureFlags = {}): PlacesSummary => {
    const features = Array.isArray(places) ? places : places.features;
    return {
        count: features.length,
        features: features.slice(0, PLACES_SUMMARY_LIMIT).map((feature) => summarizePlace(feature, flags)),
    };
};

/**
 * Converts a Route to a token-efficient summary for LLM consumption.
 * Returns only the route summary and per-leg summaries (when more than one leg).
 *
 * @ignore
 */
export const summarizeRoute = (route: Route): SummarizedRoute => {
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
};

/**
 * Converts Routes to a token-efficient summary for LLM consumption.
 *
 * @ignore
 */
export const summarizeRoutes = (routes: Routes): SummarizedRoutes => {
    const count = routes.features.length;

    return {
        count,
        routes: routes.features.map(summarizeRoute),
    };
};

/** @ignore */
export const waypointSummarySchema = z.object({
    slotIndex: z.number(),
    isFilled: z.boolean(),
    address: z.string().optional(),
    position: z.array(z.number()).length(2).optional().describe('[longitude, latitude]'),
});

/**
 * Token-efficient summary of a waypoint for LLM consumption.
 *
 * @ignore
 */
export const summarizeWaypoint = (
    waypoint: WaypointLike | null | undefined,
): z.infer<typeof waypointSummarySchema> | null => {
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
};
