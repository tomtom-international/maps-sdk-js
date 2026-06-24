/**
 * @module agent-toolkit-tools
 *
 * `monitorAnalysis` — the recurring half of the analysis pair, expressed as a pure toggle. It carries
 * no code and no sandbox surface: `analyseData` defines *what to compute* and returns an `analysisId`;
 * this tool only flips *whether it stays live*. Enabling makes the analysis recompute on every change
 * to its source entries (incidents monitor ticks, re-searched places, recalculated routes, …);
 * disabling stops it. The work lives in `analyses-runtime.ts`.
 *
 * This replaces the incidents-only `monitorIncidentsAnalysis`: monitoring is now generic across every
 * analyseData input kind, and the focus side-effect is intentionally left out of the core — compose
 * with `focusIncidents` for live highlighting.
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';
import { ensureStandingWired, setStandingEnabled } from './analyses-runtime';

/** Structured output of `monitorAnalysis`: the toggled analysis id and its new monitoring state. */
export const monitorAnalysisOutputSchema = z.union([
    z.object({
        analysisId: z.string(),
        enabled: z
            .boolean()
            .describe('The analysis is now recomputed on every source-entry change (true) or not (false).'),
    }),
    toolErrorSchema,
]);

/** Input schema for `monitorAnalysis` — the `analysisId` to toggle and whether to monitor it. */
export const monitorAnalysisSchema = z.object({
    analysisId: z
        .string()
        .describe('The `analysisId` returned by `analyseData` for the analysis to start or stop monitoring.'),
    enabled: z
        .boolean()
        .describe(
            'true → recompute this analysis on every change to its source entries; false → stop monitoring it. ' +
                'The latest result stays attached either way.',
        ),
});

/** Classifier-facing description of `monitorAnalysis` (the recurring toggle over an analyseData analysis). */
export const monitorAnalysisDescription =
    'Start or stop MONITORING an existing analysis (one created by `analyseData`, referenced by its `analysisId`). ' +
    'When enabled, the analysis recomputes on every change to its source entries — incidents monitor ticks, ' +
    're-searched places, recalculated routes, refreshed BYOD/area-analytics — keeping its attached result live ' +
    '(use `previous` / `now` in the code for trend reads). Pick for "keep this updated / tell me when it changes / ' +
    'stop tracking it". This is a pure on/off switch: define the computation with `analyseData` first. For a ' +
    'one-off highlight of incidents use `focusIncidents`.';

/** Toggle monitoring on the referenced analysis; errors when the `analysisId` is unknown. */
export const executeMonitorAnalysis = async (
    params: z.infer<typeof monitorAnalysisSchema>,
    state: ToolState,
): Promise<z.infer<typeof monitorAnalysisOutputSchema>> => {
    ensureStandingWired(state);
    const ok = setStandingEnabled(state, params.analysisId, params.enabled);
    if (!ok) {
        return {
            error: `No analysis with id "${params.analysisId}". Run analyseData first and pass the analysisId it returns.`,
        };
    }
    return { analysisId: params.analysisId, enabled: params.enabled };
};
