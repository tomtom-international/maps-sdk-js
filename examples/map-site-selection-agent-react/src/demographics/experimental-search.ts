// The household ("Reach" / residential-density) signal used to run on an experimental places
// backend reached through the agent-toolkit's `experimentalSearch` feature flag. That backend and
// that flag have both been removed from the SDK, so the signal has no data source any more.
//
// This module keeps the two getters the rest of the example reads — executors, panels, the report
// builder and the methodology text all go through them — so the feature switches off in one place
// rather than in every caller.
//
// Deliberately dependency-free: pure modules (scoring, methodology, the report builder) read the
// switch without pulling in the SDK service imports that live in households.ts.

/**
 * Result cap for the example's own searches. The default places backend maxes out at 100 results.
 */
export const searchLimit = (): number => 100;

/**
 * Whether the household ("Reach" / residential-density) signal is available.
 *
 * Always `false`: the signal is an address-point count, and it only differentiates under the
 * 10,000-result ceiling the removed experimental backend provided. At the default backend's 100 it
 * saturates almost immediately. With it off, every household surface disappears — no address
 * lookups, no Reach scoring factor, no schema fields, no panel/report rows, no methodology entry.
 */
export const householdsEnabled = (): boolean => false;
