/**
 * @module agent-toolkit-state
 */

import type { EntryAnalysis } from '../analyses';

/**
 * A single analysis result attached to a places entry. Alias of the shared {@link EntryAnalysis} —
 * every entry kind uses the same result shape; kept as a named export for back-compat.
 *
 * @group Agent Toolkit
 */
export type PlacesAnalysis = EntryAnalysis;
