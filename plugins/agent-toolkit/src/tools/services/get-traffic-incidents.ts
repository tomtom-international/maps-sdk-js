/**
 * @module agent-toolkit-tools
 */

import { type BBox, trafficIncidentRequestCategories } from '@tomtom-org/maps-sdk/core';
import { type TrafficIncidentDetailsByBBoxParams, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

// Compact list of every entry currently held by `state.trafficIncidents`. Returned alongside
// the freshly-fetched data so the LLM sees what's available without a separate recall call.
const entriesSummary = (state: ToolState) =>
    state.trafficIncidents.entries.map((e) => ({
        id: e.id,
        label: e.label,
        count: e.data.length,
        timestamp: e.timestamp,
    }));

/**
 * Output schema for the get-traffic-incidents tool.
 *
 * By design this tool is a **loader**, not an aggregator. It fetches incidents into a new
 * (or already-loaded) entry, renders them on the map, and returns
 * `{ count, entryId, entries }` — `entries` is a compact summary of every entry currently
 * cached in `state.trafficIncidents`, so the agent can pick a follow-up target without a
 * separate recall call.
 *
 * Every aggregation (counts by category, severity, time-validity, top roads, top-N,
 * clustering, corridor group-by, proximity, spatial joins) is the job of `analyseIncidents`
 * (counts / charts / deltas — attaches to the source entry's `_analyses`) and `focusIncidents`
 * (highlight/filter a subset on an existing entry). Both inject the entry's full feature
 * set into the sandbox.
 *
 * Background polling is opt-in via the separate `startTrafficIncidentsMonitor` tool — keeps
 * the loader a single, predictable network call.
 *
 * Historic shortcuts like a built-in summary, `topIncidents`, and `includeIncidents` were
 * removed: they let the agent skip real aggregation and misrepresent individual top-delay
 * incidents as "clusters" or "hotspots". The contract now forces the agent through
 * analyseIncidents/focusIncidents for anything beyond `count`.
 */
export const getTrafficIncidentsOutputSchema = z.union([
    z.object({
        count: z.number(),
        entryId: z.string().optional(),
        entries: z.array(
            z.object({
                id: z.string(),
                label: z.string(),
                count: z.number(),
                timestamp: z.number(),
            }),
        ),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for fetching traffic incident details.
 */
export const getTrafficIncidentsSchema = z.object({
    bbox: z
        .optional(z.array(z.number()))
        .describe('[minLng, minLat, maxLng, maxLat]. If omitted, the current map viewport is used.'),
    categoryFilter: z
        .array(z.enum([...trafficIncidentRequestCategories]))
        .optional()
        .describe('Filter by incident category. If omitted, all categories are returned.'),
    timeValidityFilter: z
        .array(z.enum(['present', 'future']))
        .optional()
        .describe("default: ['present']"),
    label: z
        .string()
        .optional()
        .describe(
            'Short human-readable label for this fetch — name the place ("Central London", ' +
                '"Amsterdam ring", "M25 corridor"), not coordinates. Surfaced verbatim in the ' +
                'monitor chip and on the entry chip in the UI; also used by analyseIncidents / ' +
                'focusIncidents to disambiguate which entry to operate on. Always pass one when ' +
                'silent is false; the bbox-coordinate fallback ("bbox a,b → c,d") is for silent ' +
                'intermediate fetches only.',
        ),
    silent: z
        .boolean()
        .optional()
        .describe(
            'Default: false. When true, suppress map rendering (use for intermediate calculations only). ' +
                'Normally, fetched incidents auto-render on the map so the user can visually validate the agent is looking at the right area.',
        ),
    fitBounds: z.boolean().optional().describe('Default: true. Pass false to skip camera move after rendering.'),
});

export const getTrafficIncidentsDescription =
    'LOADER. Fetches traffic incidents (present or future) into a cached entry, renders them on the map, returns ' +
    '`{ count, entryId, entries }` (`entries` lists every cached entry so the agent can pick a follow-up target). ' +
    'No per-incident details, no aggregation — those belong to analyseIncidents/focusIncidents. ' +
    '\n\n' +
    'AREA: omit `bbox` to use the current map viewport ("the network / right now / this area / here"). ' +
    'Pass explicit `bbox` only when the user names an area not already on screen. ' +
    '\n\n' +
    'CALL ONCE PER AREA. Each call writes a new entry; re-calling burns steps. Pick the right follow-up instead: ' +
    'analyseIncidents (counts, top-N, charts, clusters, trend via `previous`); focusIncidents (highlight a subset); ' +
    'startTrafficIncidentsMonitor (keep the entry fresh in the background). ' +
    '\n\n' +
    '`silent: true` suppresses rendering (intermediate calcs only); `label` names the snapshot in the UI.';

function defaultLabel(params: TrafficIncidentDetailsByBBoxParams & { bbox: BBox }): string {
    const [minLng, minLat, maxLng, maxLat] = params.bbox;
    const bboxStr = `bbox ${minLng.toFixed(2)},${minLat.toFixed(2)} → ${maxLng.toFixed(2)},${maxLat.toFixed(2)}`;
    const filterParts: string[] = [];
    if (params.categoryFilter?.length) filterParts.push(`filtered: ${params.categoryFilter.join(',')}`);
    if (params.timeValidityFilter?.length) filterParts.push(`when: ${params.timeValidityFilter.join(',')}`);
    return filterParts.length ? `${bboxStr} — ${filterParts.join('; ')}` : bboxStr;
}

/** Standalone execute for ToolEntry format. */
export const executeGetTrafficIncidents = async (
    params: z.infer<typeof getTrafficIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof getTrafficIncidentsOutputSchema>> => {
    const { bbox, categoryFilter, timeValidityFilter, label, silent = false, fitBounds = true } = params;

    // No bbox → fall back to the current map viewport so the agent can answer
    // "the network / right now / this area" without a separate getViewport round-trip.
    let effectiveBbox: BBox | undefined = bbox as BBox | undefined;
    if (!effectiveBbox) {
        try {
            effectiveBbox = state.baseMap.ttMap.getBBox() as BBox;
        } catch (error) {
            return {
                error: `No bbox provided and viewport fallback failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }

    const filters = {
        ...(categoryFilter && { categoryFilter }),
        ...(timeValidityFilter && { timeValidityFilter }),
    };

    try {
        const result = await trafficIncidentDetails({ ...filters, bbox: effectiveBbox });

        if (!result.features.length) {
            return { count: 0, entries: entriesSummary(state) };
        }

        const entryParams: TrafficIncidentDetailsByBBoxParams & { bbox: BBox } = {
            bbox: effectiveBbox,
            ...filters,
        };
        const entryId = state.trafficIncidents.addIncidentsEntry(
            result.features,
            entryParams,
            label ?? defaultLabel(entryParams),
            Date.now(),
        );

        if (!silent) {
            await state.trafficIncidents.showEntry(entryId, fitBounds);
        }

        return {
            count: result.features.length,
            entryId,
            entries: entriesSummary(state),
        };
    } catch (error) {
        return {
            error: `Failed to get traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
