// The agent-toolkit can route search through an experimental backend via its `experimentalSearch`
// feature flag. The example receives that flag as a parameter of buildSiteAgentOptions (which passes
// it on to createMapAgent as `featureFlags: { experimentalSearch }` AND stores it here), so the
// toolkit's built-in tools and the example's custom tools always agree on one switch.
//
// This module is the runtime home of the stored flag: executors, panels, the report builder and the
// methodology text all read it through the getters below. Model-facing tool schemas/descriptions
// don't read it from here — they are built per agent by ToolEntryBuilders from the same
// `featureFlags` value at createMapAgent time.
//
// Deliberately dependency-free: pure modules (scoring, methodology, the report builder) read the
// flag without pulling in the SDK service imports that live in households.ts.

let experimentalSearch = false;

/** Set by buildSiteAgentOptions (the example's composition root) before the agent is assembled. */
export const setExperimentalSearch = (on: boolean): void => {
    experimentalSearch = on;
};

export const isExperimentalSearch = (): boolean => experimentalSearch;

// Result cap, matching the active backend's ceiling (mirrors the toolkit's own per-backend limits):
// the default backend maxes out at 100 results, the experimental one at 10 000.
export const searchLimit = (): number => (experimentalSearch ? 10_000 : 100);

// The household ("Reach" / residential-density) signal is an address-point count, and it is only
// meaningful under the experimental backend's 10 000-result ceiling — at the default backend's 100
// it saturates almost immediately and stops differentiating. So households follow the same switch:
// with the flag OFF every household surface disappears entirely (no address lookups, no Reach
// scoring factor, no schema fields, no panel/report rows, no methodology entry); with it ON
// households are counted and used in calculations and the UI.
export const householdsEnabled = (): boolean => experimentalSearch;
