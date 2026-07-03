import type { StateSlice, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Session-level preferences for the Site Selection agent — the values that used to be hardcoded
// constants spread across profileSite / rankSites / findWhitespace (catchment size, scoring weights,
// demand anchors). Holding them on a state slice makes them runtime-mutable and shared: tools and the
// processData / analyseData sandbox read the live preferences instead of baking thresholds into code,
// so the methodology stops being a compile-time decision. See the PR description.

/** How a catchment is measured: a walking radius or a drive-time isochrone. */
export type SiteTravelMode = 'walk' | 'drive';

/**
 * Relative importance of the four site-ranking factors. They need not sum to 1 — the scorer
 * normalises them — so the user can say "weight competition twice as much" without re-balancing.
 */
export type SiteScoringWeights = {
    reach: number;
    demand: number;
    competition: number;
    accessibility: number;
};

/** The full set of session preferences a request can override and later analyses inherit. */
export type SiteSelectionPreferences = {
    /** Default retail/service concept (e.g. "specialty coffee"). Undefined until the user states one. */
    concept?: string;
    travelMode: SiteTravelMode;
    /** Walk-catchment radius in metres (used when travelMode === 'walk'). */
    walkReachMeters: number;
    /** Drive-catchment budget in minutes (used when travelMode === 'drive'). */
    driveMinutes: number;
    scoringWeights: SiteScoringWeights;
    /** POI category terms that stand in for "demand" when scanning an area for whitespace. */
    demandAnchors: string[];
};

/**
 * A partial update to the preferences. `scoringWeights` is itself partial so the user can nudge a
 * single factor ("weight competition higher") without restating the other three.
 */
export type SiteSelectionPatch = Partial<Omit<SiteSelectionPreferences, 'scoringWeights'>> & {
    scoringWeights?: Partial<SiteScoringWeights>;
};

/** The shipped starting point — mirrors the constants the tools previously baked in. */
export const DEFAULT_SITE_SELECTION_PREFERENCES: SiteSelectionPreferences = {
    travelMode: 'walk',
    walkReachMeters: 800,
    driveMinutes: 10,
    scoringWeights: { reach: 0.3, demand: 0.3, competition: 0.25, accessibility: 0.15 },
    demandAnchors: ['restaurant', 'cafe', 'supermarket', 'convenience store'],
};

// Merge a partial patch over a base: scoringWeights merges field-by-field (so "bump competition" keeps
// the other three), demandAnchors and scalars replace wholesale. Always returns a fresh object with
// freshly cloned nested members so callers can never alias the slice's internals.
const mergePreferences = (base: SiteSelectionPreferences, patch?: SiteSelectionPatch): SiteSelectionPreferences => ({
    ...base,
    ...patch,
    scoringWeights: { ...base.scoringWeights, ...patch?.scoringWeights },
    demandAnchors: patch?.demandAnchors ? [...patch.demandAnchors] : [...base.demandAnchors],
});

/**
 * Custom {@link StateSlice} holding the agent's session preferences. Registered under
 * `state.siteSelection` via `createMapAgent`'s `state` option; the toolkit calls {@link reset} on
 * `agent.destroy()` because the slice implements `StateSlice`.
 */
export class SiteSelectionState implements StateSlice {
    private _preferences: SiteSelectionPreferences;

    constructor(initial?: Partial<SiteSelectionPreferences>) {
        this._preferences = mergePreferences(DEFAULT_SITE_SELECTION_PREFERENCES, initial);
    }

    /** Live preferences snapshot. Treat as read-only — mutate through {@link update}. */
    get preferences(): SiteSelectionPreferences {
        return this._preferences;
    }

    /** Apply a partial patch and return the updated snapshot. */
    update(patch: SiteSelectionPatch): SiteSelectionPreferences {
        this._preferences = mergePreferences(this._preferences, patch);
        return this._preferences;
    }

    // Restore the shipped defaults; invoked by the toolkit on agent.destroy().
    reset(): void {
        this._preferences = mergePreferences(DEFAULT_SITE_SELECTION_PREFERENCES);
    }
}

/** Built-in {@link ToolState} extended with this agent's session-preferences slice. */
export type SiteToolState = ToolState & { siteSelection: SiteSelectionState };

// The slice is always registered (via createMapAgent's `state` option), so the cast is safe at
// runtime. Tools receive the base `ToolState` type, so this is the one spot that narrows it.
export const getSitePreferences = (state: ToolState): SiteSelectionPreferences =>
    (state as SiteToolState).siteSelection.preferences;

// Catchment parameters after layering a request's explicit values over the session preferences.
type ResolvedCatchment = { walking: boolean; walkReachMeters: number; driveMinutes: number };

/**
 * Resolve the effective catchment for an analysis: each field falls back to the session preference
 * when the request omits it. The tool schemas leave these optional so a bare request inherits the
 * user's standing choices (e.g. "always use a 12-minute drive") without restating them every turn.
 */
export const resolveCatchment = (
    state: ToolState,
    params: { travelMode?: 'walking' | 'driving'; walkReachMeters?: number; driveMinutes?: number },
): ResolvedCatchment => {
    const prefs = getSitePreferences(state);
    const mode = params.travelMode ?? (prefs.travelMode === 'walk' ? 'walking' : 'driving');
    return {
        walking: mode === 'walking',
        walkReachMeters: params.walkReachMeters ?? prefs.walkReachMeters,
        driveMinutes: params.driveMinutes ?? prefs.driveMinutes,
    };
};
