/**
 * @module agent-toolkit-tools
 *
 * Shared executor primitives for `analyseData` and `processData`.
 *
 * Both tools follow the same skeleton:
 *
 *   1. resolve entries by id (with a "last entry" default)
 *   2. assemble a merged FeatureCollection + per-entry view
 *   3. run sandboxed code
 *   4. validate the result
 *   5. attach the analysis (`analyseData` only) to each contributing entry
 *
 * These helpers cover steps 1–2 and step 5 generically. The sandbox call
 * itself stays in {@link runSandboxedFn} / {@link validateAnalysisResult}
 * because the per-tool param names and arg lists are too specific to wrap
 * usefully.
 */

import { type AnalysisOutputFormat } from './sandbox-code';

/** Minimal shape required by {@link resolveEntriesByIds}. */
type SliceWithEntries<E> = { entries: readonly E[] };

/**
 * Resolve entries by id with the standard "no ids → last entry" fallback and
 * uniform missing-entry errors. Pulls the inline `ids?.length ? map(find) :
 * [last]` pattern out of every analyse/process executor.
 *
 * @ignore
 */
export const resolveEntriesByIds = <E extends { id: string }>(
    ids: readonly string[] | undefined,
    slice: SliceWithEntries<E>,
    hints: { missingId: (id: string) => string; emptySlice: string },
): { value: E[] } | { error: string } => {
    if (ids?.length) {
        const resolved: E[] = [];
        for (const id of ids) {
            const found = slice.entries.find((entry) => entry.id === id);
            if (!found) return { error: hints.missingId(id) };
            resolved.push(found);
        }
        return { value: resolved };
    }
    const last = slice.entries.at(-1);
    if (!last) return { error: hints.emptySlice };
    return { value: [last] };
};

/**
 * Build a merged FeatureCollection plus a per-entry view from a list of
 * resolved entries. `extractFeatures` adapts each entry's feature-bearing
 * field name (`places`, `data.features`, …) to a uniform shape so the sandbox
 * receives the same inputs regardless of which slice the entries came from.
 *
 * @ignore
 */
export const buildFeatureViews = <E extends { id: string }, F>(
    entries: readonly E[],
    extractFeatures: (entry: E) => readonly F[],
): {
    merged: { type: 'FeatureCollection'; features: F[] };
    byEntry: Record<string, { type: 'FeatureCollection'; features: F[] }>;
} => ({
    merged: { type: 'FeatureCollection', features: entries.flatMap((entry) => [...extractFeatures(entry)]) },
    byEntry: Object.fromEntries(
        entries.map((entry) => [
            entry.id,
            { type: 'FeatureCollection' as const, features: [...extractFeatures(entry)] },
        ]),
    ),
});

/** Minimal shape required by {@link attachAnalysisToEntries}. Every state */
/** slice's `addAnalysisToEntry` matches this — the per-slice `Analysis` */
/** type is structurally identical across places/routes/incidents/custom. */
type AnalysisSink<E extends { id: string }> = {
    addAnalysisToEntry: (entryId: E['id'], analysis: AnalysisRecord) => boolean;
};

type AnalysisRecord = {
    name: string;
    timestamp: number;
    description?: string;
    outputFormat: AnalysisOutputFormat;
    data: unknown;
};

/**
 * Attach an analysis to every entry in `entries` on `slice`. Shares the
 * timestamp across the batch so the agent UI can correlate per-slice updates
 * that originated from the same call.
 *
 * @ignore
 */
export const attachAnalysisToEntries = <E extends { id: string }>(
    slice: AnalysisSink<E>,
    entries: readonly E[],
    payload: {
        name: string;
        description?: string;
        outputFormat: AnalysisOutputFormat;
        analysis: unknown;
        timestamp?: number;
    },
): void => {
    const timestamp = payload.timestamp ?? Date.now();
    for (const entry of entries) {
        slice.addAnalysisToEntry(entry.id, {
            name: payload.name,
            timestamp,
            ...(payload.description && { description: payload.description }),
            outputFormat: payload.outputFormat,
            data: payload.analysis,
        });
    }
};
