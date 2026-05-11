/**
 * @module agent-toolkit-tools
 *
 * Shared output schema building blocks reused across multiple tools.
 * Tool-specific output schemas live next to their respective tool definitions.
 */

import { z } from 'zod';

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

/** Token-efficient summary of a single place. */
export const placeOutputSchema = z
    .object({
        id: z
            .string()
            .describe('Stable place feature ID; pass as `{ placeId }` to setRoute / addWaypointsToRoute / etc.'),
        name: z.string().optional().describe('POI name if available'),
        address: z.string().optional().describe('Human-readable address'),
        position: z.array(z.number()).length(2).describe('[longitude, latitude]'),
    })
    .describe('Compact place summary');

/** Token-efficient summary of a places collection. */
export const placesOutputSchema = z
    .object({
        count: z.number(),
        features: z.array(placeOutputSchema),
    })
    .describe('Compact places summary');

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
