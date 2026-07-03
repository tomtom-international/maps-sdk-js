/**
 * @module agent-toolkit-tools/maplibre
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { formatSandboxExecutionError } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const sourceDiffSchema = z.object({
    added: z.array(z.string()).describe('Source IDs added by the executed code.'),
    removed: z.array(z.string()).describe('Source IDs removed by the executed code.'),
    updated: z.array(z.string()).describe('Source IDs whose definition changed.'),
});

const layerDiffSchema = z.object({
    added: z.array(z.string()).describe('Layer IDs added by the executed code.'),
    removed: z.array(z.string()).describe('Layer IDs removed by the executed code.'),
    updated: z.array(z.string()).describe('Layer IDs whose properties changed.'),
});

/** Input schema for the executeMaplibreCode tool. */
export const executeMaplibreCodeSchema = z.object({
    code: z
        .string()
        .describe(
            'Async JavaScript code executed in an environment where `map` is the live MapLibre Map instance. ' +
                'Full JS is supported: variables, loops, conditionals, helper functions, top-level `await`. ' +
                'Example: await a map event with `await new Promise(r => map.once("idle", r))`. ' +
                'Return a value with `return` to include it in the result.',
        ),
});

/** Output schema for the executeMaplibreCode tool. */
export const executeMaplibreCodeOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        result: z.unknown().optional().describe('Return value of the executed code, if any.'),
        sources: sourceDiffSchema,
        layers: layerDiffSchema,
    }),
    toolErrorSchema,
]);

export const executeMaplibreCodeDescription =
    'Run arbitrary MapLibre JS against the live `map` — the escape hatch for operations no dedicated tool covers ' +
    '(custom sources/layers, style mutations, animations, event sequences). If another tool already performs the ' +
    'operation, prefer that tool. Full JS (loops, helpers, top-level `await`). Returns added/removed/updated sources & layers.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Snapshot = Map<string, string>;

const snapshotSources = (mapLibreMap: MapLibreMap): Snapshot => {
    const sources = mapLibreMap.getStyle()?.sources ?? {};
    const snapshot: Snapshot = new Map();

    for (const [sourceId, source] of Object.entries(sources)) {
        snapshot.set(sourceId, JSON.stringify(source));
    }

    return snapshot;
};

const snapshotLayers = (mapLibreMap: MapLibreMap): Snapshot => {
    const layers = mapLibreMap.getStyle()?.layers ?? [];
    const snapshot: Snapshot = new Map();

    for (const layer of layers) {
        snapshot.set(layer.id, JSON.stringify(layer));
    }

    return snapshot;
};

const diffSnapshots = (
    before: Snapshot,
    after: Snapshot,
): { added: string[]; removed: string[]; updated: string[] } => {
    const added: string[] = [];
    const removed: string[] = [];
    const updated: string[] = [];

    for (const [identifier, afterJson] of after) {
        const beforeJson = before.get(identifier);

        if (beforeJson === undefined) {
            added.push(identifier);
        } else if (beforeJson !== afterJson) {
            updated.push(identifier);
        }
    }

    for (const identifier of before.keys()) {
        if (!after.has(identifier)) {
            removed.push(identifier);
        }
    }

    return { added, removed, updated };
};

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/** Execute function for executeMaplibreCode — usable with ToolEntry format. */
export const executeExecuteMaplibreCode = async (
    params: z.infer<typeof executeMaplibreCodeSchema>,
    state: ToolState,
) => {
    const { code } = params;
    try {
        const mapLibreMap = state.baseMap.mapLibreMap;
        const beforeSources = snapshotSources(mapLibreMap);
        const beforeLayers = snapshotLayers(mapLibreMap);

        // eslint-disable-next-line no-new-func
        const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
            ...args: string[]
        ) => (map: MapLibreMap) => Promise<unknown>;
        const userFunction = new AsyncFunction('map', code);
        const result = await userFunction(mapLibreMap);

        const sources = diffSnapshots(beforeSources, snapshotSources(mapLibreMap));
        const layers = diffSnapshots(beforeLayers, snapshotLayers(mapLibreMap));

        return { success: true, result: result ?? undefined, sources, layers };
    } catch (error) {
        return { error: formatSandboxExecutionError('Code', error) };
    }
};
