/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import { toByodSafeProfile } from '../../state/byod';
import type { ToolState } from '../../types';
import { byodDataProfileSchema, toolErrorSchema } from '../shared-output-schemas';

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
    propertyNames: z
        .array(z.string())
        .describe(
            'Feature-property keys seen in the data, highest-coverage first and capped — wide datasets may omit ' +
                'low-coverage keys. Pass `id` for the full per-property profile (types/coverage/numeric examples) ' +
                'plus any `propertiesOmitted` count.',
        ),
    source: sourceSchema,
    shown: z.boolean(),
});

const detailSchema = refSchema.extend({
    profile: byodDataProfileSchema.describe(
        'Runtime-inferred shape of the data (per-property types/coverage; numeric/boolean examples only — ' +
            'string example values are withheld). To compute over the actual feature values, pass this entry ' +
            'to `analyseData` / `processData`; the raw GeoJSON is never returned to the model.',
    ),
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
    'programmatic seeding by the embedding app OR from `addByodSource` calls. Call this BEFORE passing ids ' +
    'to `byodEntryIDs` on `analyseData` / `processData` / `updateByodDisplay` — never guess. ' +
    'No args → index (id, label, featureCount, geometryTypes, propertyNames, source, shown); ' +
    'pass `id` → full data profile (the raw GeoJSON is never returned — use analyseData / processData to ' +
    'compute over the feature values).';

export const executeRecallByod = async (
    params: z.infer<typeof recallByodSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallByodOutputSchema>> => {
    if (!params.id) {
        const entries = state.byod.entries.map((entry) => ({
            id: entry.id,
            label: entry.label,
            timestamp: entry.timestamp,
            featureCount: entry.profile.featureCount,
            geometryTypes: entry.profile.geometryTypes,
            propertyNames: entry.profile.properties.map((property) => property.name),
            source: entry.source,
            shown: !!entry._shown,
        }));
        return { entries, entryMode: state.byod.entryMode };
    }
    const entry = state.byod.findById(params.id);
    if (!entry) {
        return {
            error: `No BYOD entry with id "${params.id}". Call recallState({ kind: "byod" }) to list available IDs.`,
        };
    }
    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        featureCount: entry.profile.featureCount,
        geometryTypes: entry.profile.geometryTypes,
        propertyNames: entry.profile.properties.map((property) => property.name),
        // Strip customer-supplied string example values, and never echo the raw GeoJSON back to
        // the model (untrusted free text + violates the "summarize, never return full GeoJSON"
        // contract). The full data stays in state for the host and for analyseData / processData.
        profile: toByodSafeProfile(entry.profile),
        source: entry.source,
        shown: !!entry._shown,
    };
};
