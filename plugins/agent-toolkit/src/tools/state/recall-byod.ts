/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const sourceSchema = z.union([
    z.object({ kind: z.literal('integrator'), description: z.string().optional() }),
    z.object({ kind: z.literal('url'), url: z.string() }),
    z.object({ kind: z.literal('inline'), description: z.string().optional() }),
]);

const refSchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    featureCount: z.number(),
    geometryTypes: z.array(z.string()),
    source: sourceSchema,
    shown: z.boolean(),
});

const detailSchema = refSchema.extend({
    features: z.unknown().describe("GeoJSON FeatureCollection of the entry's features."),
});

export const recallByodOutputSchema = z.union([
    z.object({ entries: z.array(refSchema), entryMode: z.enum(['single', 'multiple']) }),
    detailSchema,
    toolErrorSchema,
]);

export const recallByodSchema = z.object({
    id: z
        .string()
        .optional()
        .describe('BYOD entry id to inspect in detail. Omit to list every BYOD entry currently in session state.'),
});

export const recallByodDescription =
    'List or inspect BYOD (bring-your-own-data) GeoJSON layers in session state. These come from either ' +
    'programmatic seeding by the embedding app OR from `addByodLayer` calls. Call this BEFORE passing ids ' +
    'to `byodEntryIDs` on `analyseData` / `processData` / `updateByodDisplay` — never guess. ' +
    'No args → index (id, label, featureCount, geometryTypes, source, shown); pass `id` → full FeatureCollection.';

const collectGeometryTypes = (data: { features: Array<{ geometry?: { type?: string } | null }> }): string[] => {
    const types = new Set<string>();
    for (const feature of data.features) {
        const t = feature.geometry?.type;
        if (t) types.add(t);
    }
    return [...types];
};

export const executeRecallByod = async (
    params: z.infer<typeof recallByodSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallByodOutputSchema>> => {
    if (!params.id) {
        const entries = state.byod.entries.map((entry) => ({
            id: entry.id,
            label: entry.label,
            timestamp: entry.timestamp,
            featureCount: entry.data.features.length,
            geometryTypes: collectGeometryTypes(entry.data),
            source: entry.source,
            shown: !!entry._shown,
        }));
        return { entries, entryMode: state.byod.entryMode };
    }
    const entry = state.byod.findById(params.id);
    if (!entry) {
        return { error: `No BYOD entry with id "${params.id}". Call recallByod with no args to list available IDs.` };
    }
    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        featureCount: entry.data.features.length,
        geometryTypes: collectGeometryTypes(entry.data),
        source: entry.source,
        shown: !!entry._shown,
        features: entry.data,
    };
};
