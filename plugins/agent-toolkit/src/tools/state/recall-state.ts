/**
 * @module agent-toolkit-tools
 */

import type { StyleInput } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const idLabelSchema = z.object({
    id: z.string(),
    label: z.string(),
});

const entryModeSchema = z.enum(['single', 'multiple']);

/** Output schema for recall-state. */
export const recallStateOutputSchema = z.union([
    z.object({
        places: z.array(idLabelSchema).describe('Places history entries — newest first.'),
        routes: z.array(idLabelSchema).describe('Routes history entries — newest first.'),
        ranges: z.array(idLabelSchema).describe('Reachable-range history entries — newest first.'),
        entryModes: z
            .object({ places: entryModeSchema, routes: entryModeSchema, ranges: entryModeSchema })
            .describe(
                'Per-slice display policy. `multiple` (default) lets several entries render at once; ' +
                    '`single` keeps only the latest entry — set via setEntryMode tools.',
            ),
        mapStyle: z
            .object({
                id: z.string().optional().describe('Standard style id (e.g. "standardLight").'),
            })
            .nullable()
            .describe('Current map style. `null` when the map has no style assigned yet.'),
        mapPOIs: z
            .object({
                visible: z.boolean().optional(),
                filterMode: z.enum(['only', 'all_except']).optional(),
                categories: z.array(z.string()).optional(),
            })
            .nullable()
            .describe(
                'Built-in POI overlay config. `null` when the POIsModule has not been initialised in this session.',
            ),
        traffic: z
            .object({
                flow: z
                    .object({ visible: z.boolean().optional() })
                    .nullable()
                    .describe('Traffic-flow layer config. `null` when the module is uninitialised.'),
                incidents: z
                    .object({ visible: z.boolean().optional() })
                    .nullable()
                    .describe('Traffic-incidents layer config. `null` when the module is uninitialised.'),
            })
            .describe('Real-time traffic visualization configs.'),
    }),
    toolErrorSchema,
]);

/** Tool schema for recall-state. */
export const recallStateSchema = z.object({});

export const recallStateDescription =
    'Single-shot session snapshot: places / routes / ranges entries (id+label) + per-slice `entryMode` + ' +
    'active map style + POIs / traffic visualization configs. Read-only. Use as orientation before making ' +
    'decisions that depend on what is already loaded.';

// Pulls the standard style id out of whatever `TomTomMap.getStyle()` returns:
// a bare string id or a `StandardStyle` object with `{ id, ... }`. Anything
// else (custom style) is reported as id-less.
const readStyleId = (style: StyleInput | undefined): string | undefined => {
    if (typeof style === 'string') return style;
    if (style && typeof style === 'object' && 'id' in style) {
        return (style as { id?: string }).id;
    }
    return undefined;
};

export const executeRecallState = async (
    _params: z.infer<typeof recallStateSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallStateOutputSchema>> => {
    // Newest-first across each history. Same ordering recallPlaces / recallRoutes
    // / recallRanges already use, so the LLM doesn't have to re-sort.
    const byNewest = <T extends { timestamp: number }>(arr: readonly T[]): T[] =>
        [...arr].sort((a, b) => b.timestamp - a.timestamp);

    const places = byNewest(state.places.entries).map(({ id, label }) => ({ id, label }));
    const routes = byNewest(state.routing.entries).map(({ id, label }) => ({ id, label }));
    const ranges = byNewest(state.ranges.entries).map(({ id, label }) => ({ id, label }));

    const styleId = readStyleId(state.baseMap.ttMap.getStyle());
    const mapStyle = styleId === undefined ? null : { id: styleId };

    // Read POIs / traffic configs through the cached module accessors so we
    // don't lazy-init modules the user never touched (an uninitialised
    // module reports as `null`, which the LLM should read as "default state,
    // nothing modified").
    const poisModule = state.mapPOIs.poisModule;
    const poisConfig = poisModule?.getConfig();
    const mapPOIs = poisConfig
        ? {
              ...(typeof poisConfig.visible === 'boolean' && { visible: poisConfig.visible }),
              ...(poisConfig.filters?.categories?.show && {
                  filterMode: poisConfig.filters.categories.show,
              }),
              ...(poisConfig.filters?.categories?.values && {
                  categories: [...poisConfig.filters.categories.values],
              }),
          }
        : null;

    const flowConfig = state.trafficTiles.trafficFlowModule?.getConfig();
    const incidentsConfig = state.trafficTiles.trafficIncidentsModule?.getConfig();
    const traffic = {
        flow: flowConfig ? { ...(typeof flowConfig.visible === 'boolean' && { visible: flowConfig.visible }) } : null,
        incidents: incidentsConfig
            ? { ...(typeof incidentsConfig.visible === 'boolean' && { visible: incidentsConfig.visible }) }
            : null,
    };

    const entryModes = {
        places: state.places.entryMode,
        routes: state.routing.entryMode,
        ranges: state.ranges.entryMode,
    };

    return { places, routes, ranges, entryModes, mapStyle, mapPOIs, traffic };
};
