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
// BYOD data profile — runtime "schema" of a customer FeatureCollection
// ---------------------------------------------------------------------------

/**
 * Compact, runtime-derived description of a BYOD entry's shape: geometry types
 * and a per-property profile (type, coverage, examples). Lets the model learn
 * what it can filter / analyse without ever receiving the raw FeatureCollection.
 * Mirrors `BYODDataProfile` from the byod state slice.
 */
export const byodDataProfileSchema = z.object({
    featureCount: z.number(),
    geometryTypes: z.array(z.string()).describe('Geometry types present (Point / LineString / Polygon / …).'),
    properties: z
        .array(
            z.object({
                name: z.string(),
                types: z
                    .array(z.string())
                    .describe('Distinct JSON value types seen for this key (e.g. ["string"], ["number","null"]).'),
                coverage: z.number().describe('Fraction of features carrying this key (1 = every feature).'),
                examples: z
                    .array(z.union([z.string(), z.number(), z.boolean()]))
                    .describe('A few short example values for inferring semantics.'),
            }),
        )
        .describe('Per-property profile, highest-coverage first.'),
    propertiesOmitted: z
        .number()
        .optional()
        .describe('Count of property keys omitted when the data has more distinct keys than the cap.'),
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
// pipeline. Area data currently populated only in DE / NL / FR. Gated by `experimentalSearch`
// so the LLM doesn't see them on tool runs that can't produce them.
const experimentalPlaceShape = {
    areaId: z
        .string()
        .optional()
        .describe(
            'Id of the small area polygon this place sits in (few km², not a whole municipality). ' +
                'Round-trip into `discoverPlaces.where.areaId` for "what else is in this same area?". ' +
                'Only set on explorationSearch results in DE / NL / FR.',
        ),
    areaCountry: z.string().optional().describe('ISO 3166-1 alpha-2 country code of the surrounding area polygon.'),
    areaTags: z
        .array(z.string())
        .optional()
        .describe(
            'Tokens describing the surrounding small area (few km², not a whole municipality) ' +
                '(e.g. "coastal", "walkable", "transit_connected"). Useful for downstream `areaTags` filters.',
        ),
};

/**
 * Build a flag-aware compact place summary schema. When `experimentalSearch`
 * is true, the schema also documents the exploration-search-only `areaId` /
 * `areaCountry` / `areaTags` fields propagated from the surrounding small-area polygon.
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
