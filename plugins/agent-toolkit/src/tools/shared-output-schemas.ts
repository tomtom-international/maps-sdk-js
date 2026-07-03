/**
 * @module agent-toolkit-tools
 *
 * Shared output schema building blocks reused across multiple tools.
 * Tool-specific output schemas live next to their respective tool definitions.
 */

import { placeTypes } from '@tomtom-org/maps-sdk/core';
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
 *
 * Note: when this profile is returned to the model it is passed through
 * `toByodSafeProfile`, which drops **string** example values (customer-supplied,
 * so a potential prompt-injection vector). Numeric / boolean examples and all
 * structural fields are kept. The schema shape is unchanged — `examples` is just
 * a string-free subset on model-facing results.
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
                    .describe(
                        'A few example NUMERIC / BOOLEAN values for inferring semantics. String values are ' +
                            'withheld from results (customer-supplied free text — a prompt-injection vector); ' +
                            'use `types` to know a property is a string.',
                    ),
            }),
        )
        .describe('Per-property profile, highest-coverage first.'),
    propertiesOmitted: z
        .number()
        .optional()
        .describe('Count of property keys omitted when the data has more distinct keys than the cap.'),
});

// ---------------------------------------------------------------------------
// Grounded `where` resolution — shared by every tool that resolves a named area
// (getTrafficIncidents, discoverPlaces). Always-on awareness + a confirm/retry cue.
// ---------------------------------------------------------------------------

/**
 * Where each named `where` query actually resolved. Present whenever a `where` named an area (a
 * `queries`/`placeIds` entry or a `nearby` query) — built from the resolver's grounded match (see
 * `resolvedAreasDisclosure` / `biasDisclosure` in resolve-where). Omitted for raw bounding boxes /
 * geometries (nothing was geocoded). The grounded `matched` lets the model self-correct a wrong
 * same-name resolution.
 */
export const resolvedAreasOutputSchema = z
    .array(
        z.object({
            query: z.string().optional().describe('Your input query text, echoed.'),
            matched: z.string().describe('The GROUNDED place the data was actually loaded for.'),
        }),
    )
    .describe(
        'Where each named `where` query ACTUALLY resolved. `matched` is the grounded geocoded place the ' +
            'data was loaded for — NOT your query text. ALWAYS check it is the place the operator meant: a ' +
            'same-name place elsewhere ("east London" → "London, CA") silently loads the wrong area. ' +
            'If `matched` is wrong, re-issue with a more specific query. ' +
            'Omitted for raw bounding boxes / geometries (nothing was geocoded).',
    );

// ---------------------------------------------------------------------------
// Place (compact summary) — used by geocode, reverse-geocode, search, etc.
// ---------------------------------------------------------------------------

const basePlaceShape = {
    id: z.string().describe('Stable place feature ID; pass as `{ placeId }` to setRoute / addWaypointsToRoute / etc.'),
    type: z
        .enum(placeTypes)
        .optional()
        .describe('Place classification (POI, Street, Geography, Cross Street, …), when known.'),
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

/**
 * Route summary returned by the tools that WRITE a routing entry (setRoute + the waypoint editors).
 * Adds `entryId` so follow-up tools (analyseData / processData) know which entry the route landed in.
 * Recall tools surface the id separately (top-level `id`), so they use the plain {@link routesOutputSchema}.
 */
export const routesWriteOutputSchema = routesOutputSchema.extend({
    entryId: z
        .string()
        .describe('Routing entry id the route was written to — pass as `routesEntryIDs` to analyseData / processData.'),
});
