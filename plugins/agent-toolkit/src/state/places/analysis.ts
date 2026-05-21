/**
 * @module agent-toolkit-state
 */

import type { AnalysisOutputFormat } from '../../tools/shared';

/**
 * A single aggregation/analysis result attached to a places entry.
 * Produced by `analyseData`; `data` is whatever the dynamic code returned.
 *
 * @group Agent Toolkit
 */
export type PlacesAnalysis = {
    /** Unique name within the parent entry (used as a key for future UI). */
    name: string;
    timestamp: number;
    /** Optional human-readable description of what the analysis computed. */
    description?: string;
    /** How `data` should be interpreted — plain JSON or a Chart.js configuration. */
    outputFormat: AnalysisOutputFormat;
    /** Arbitrary aggregation result returned by the dynamic code. */
    data: unknown;
};
