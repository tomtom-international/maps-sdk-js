/**
 * @module agent-toolkit-tools
 *
 * Shared output schema building blocks reused across multiple tools.
 * Tool-specific output schemas live next to their respective tool definitions.
 */

import { z } from 'zod';
import type { FeatureFlags } from '../types';

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

/** Returned by every tool when execution fails. */
export const toolErrorSchema = z.object({
    error: z.string(),
});

// ---------------------------------------------------------------------------
// Place (compact summary) — used by geocode, reverse-geocode, search, etc.
// ---------------------------------------------------------------------------

const basePlaceShape = {
    id: z.string().describe('Stable place feature ID; pass as `{ placeId }` to setRoute / addWaypointsToRoute / etc.'),
    name: z.string().optional().describe('POI name if available'),
    address: z.string().optional().describe('Human-readable address'),
    position: z.array(z.number()).length(2).describe('[longitude, latitude]'),
};

// Experimental-only fields propagated from the exploration-search backend's area-tag
// pipeline (DE / NL / FR only). Gated by `experimentalSearch` so the LLM doesn't see
// them on tool runs that can't produce them.
const experimentalPlaceShape = {
    areaId: z
        .string()
        .optional()
        .describe(
            'Id of the municipality polygon this place sits in. Round-trip into `discoverPlaces.where.areaId` ' +
                'for "what else is in this same municipality?". Only set on explorationSearch results in DE / NL / FR.',
        ),
    areaCountry: z
        .string()
        .optional()
        .describe('ISO 3166-1 alpha-2 country code of the surrounding municipality polygon.'),
    areaTags: z
        .array(z.string())
        .optional()
        .describe(
            'Area-character tokens describing the surrounding municipality ' +
                '(e.g. "coastal", "walkable", "transit_connected"). Useful for downstream `areaTags` filters.',
        ),
};

/**
 * Build a flag-aware compact place summary schema. When `experimentalSearch`
 * is true, the schema also documents the exploration-search-only `areaId` /
 * `areaCountry` / `areaTags` fields propagated from the municipality polygon.
 */
export const buildPlaceOutputSchema = (flags: FeatureFlags) =>
    z
        .object(flags.experimentalSearch ? { ...basePlaceShape, ...experimentalPlaceShape } : basePlaceShape)
        .describe('Compact place summary');

/**
 * Build a flag-aware compact places-collection summary. Mirrors
 * {@link buildPlaceOutputSchema} for `features[]`.
 */
export const buildPlacesOutputSchema = (flags: FeatureFlags) =>
    z
        .object({
            count: z.number(),
            features: z.array(buildPlaceOutputSchema(flags)),
        })
        .describe('Compact places summary');

/**
 * Token-efficient summary of a single place — default flags
 * (`experimentalSearch: false`).
 */
export const placeOutputSchema = buildPlaceOutputSchema({});

/**
 * Token-efficient summary of a places collection — default flags
 * (`experimentalSearch: false`).
 */
export const placesOutputSchema = buildPlacesOutputSchema({});

// ---------------------------------------------------------------------------
// Route (summarized — geometry, progress, and guidance stripped)
// ---------------------------------------------------------------------------

const summarySchema = z.object({
    travelTimeInSeconds: z.number(),
    lengthInMeters: z.number(),
    trafficDelayInSeconds: z.number().optional(),
    trafficLengthInMeters: z.number().optional(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    noTrafficTravelTimeInSeconds: z.number().optional(),
    historicTrafficTravelTimeInSeconds: z.number().optional(),
    liveTrafficIncidentsTravelTimeInSeconds: z.number().optional(),
});

/**
 * A single summarized route — just the route summary and optional per-leg summaries.
 */
export const summarizedRouteSchema = z.object({
    index: z.number().describe('0=best, 1+=alternative'),
    summary: summarySchema,
    legSummaries: z.array(summarySchema).optional().describe('Present when route has multiple legs'),
});

/** Summary of one or more calculated routes (coordinates stripped). */
export const routesOutputSchema = z.object({
    count: z.number(),
    routes: z.array(summarizedRouteSchema),
});
