/**
 * @module agent-toolkit-state
 */

import type { AnalysisOutputFormat } from '../../tools/shared';

/**
 * A single analysis result attached to a BYOD entry. Produced by `analyseData`
 * when the entry is passed via `byodEntryIDs`; `data` is whatever the dynamic
 * code returned. Structurally identical to the other slices' analysis records
 * so the shared attach helper treats every slice uniformly.
 *
 * @group Agent Toolkit
 */
export type BYODAnalysis = {
    /** Unique name within the parent entry (used as a key for the UI). */
    name: string;
    timestamp: number;
    /** Optional human-readable description of what the analysis computed. */
    description?: string;
    /** How `data` should be interpreted — plain JSON or a Chart.js configuration. */
    outputFormat: AnalysisOutputFormat;
    /** Arbitrary analysis result returned by the dynamic code. */
    data: unknown;
};
