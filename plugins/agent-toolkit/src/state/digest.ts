/**
 * @module agent-toolkit-state
 *
 * Compact snapshots of user-visible state, used to inform the LLM about changes that happened
 * outside the conversation (e.g. the user clicked a recents shortcut in the demo's UI).
 *
 * Pattern of use:
 *   1. After every assistant turn, call `getStateDigest(state)` and stash the result.
 *   2. Before sending the next user prompt, call `getStateDigest` again and pass both into
 *      `formatStateDigestDiff`. If a non-empty string comes back, prepend it to the prompt so
 *      the LLM sees what changed since its last response.
 *
 * Attribution is implicit: anything the LLM's tool calls did happens during the assistant turn
 * (so it's already reflected in the post-turn snapshot). Anything that changes between turns is,
 * by construction, UI-driven.
 */

import type { ToolState } from '../types';
import type { EntryMode } from './state';

/**
 * Compact snapshot of the user-visible parts of `ToolState`. Designed to be diffable: every field
 * is serialisable to JSON and stable for `===` comparison when the underlying state hasn't changed.
 *
 * @group Agent Toolkit
 */
export type StateDigest = {
    places: {
        /** Entry ids currently rendered as individual pins, sorted ascending. */
        shownAsPin: string[];
        /** Entry ids currently rendered as base-map POIs, sorted ascending. */
        shownAsBaseMap: string[];
        /** Display policy in force on the slice — `multiple` (default) or `single`. */
        entryMode: EntryMode;
    };
    routes: {
        /** Routes-entry ids currently drawn on the map, sorted ascending. */
        shown: string[];
        /** Display policy in force on the slice — `multiple` (default) or `single`. */
        entryMode: EntryMode;
    };
    ranges: {
        /** Range-entry ids currently drawn on the map, sorted ascending. */
        shown: string[];
        /** Display policy in force on the slice — `multiple` (default) or `single`. */
        entryMode: EntryMode;
    };
    traffic: {
        /** Whether a TrafficAreaAnalytics visualization is active. */
        analyticsActive: boolean;
    };
    incidents: {
        /** Traffic-incidents entry ids currently rendered on the map, sorted ascending. */
        shown: string[];
        /** Entry ids currently being polled by the per-entry network monitor, sorted ascending. */
        monitored: string[];
        /** Display policy in force on the slice — `multiple` (default) or `single`. */
        entryMode: EntryMode;
    };
};

/**
 * Snapshot the user-visible state surface. Call after every assistant turn (to record the
 * "agent-known" baseline) and again before each user prompt (to detect what changed since).
 *
 * @group Agent Toolkit
 */
export const getStateDigest = (state: ToolState): StateDigest => ({
    places: {
        shownAsPin: [...state.places.shownAsPinIds].sort(),
        shownAsBaseMap: [...state.places.shownAsBaseMapIds].sort(),
        entryMode: state.places.entryMode,
    },
    routes: { shown: [...state.routing.shownEntryIds].sort(), entryMode: state.routing.entryMode },
    ranges: { shown: [...state.ranges.shownEntryIds].sort(), entryMode: state.ranges.entryMode },
    traffic: { analyticsActive: state.trafficAreaAnalytics.lastAreaAnalytics !== undefined },
    incidents: {
        shown: [...state.trafficIncidents.shownEntryIds].sort(),
        monitored: state.trafficIncidents.entries
            .filter((e) => e._monitor?.status === 'running')
            .map((e) => e.id)
            .sort(),
        entryMode: state.trafficIncidents.entryMode,
    },
});

const arraysEqual = (a: readonly string[], b: readonly string[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
};

const formatPlacesDiff = (prev: StateDigest['places'], next: StateDigest['places']): string | undefined => {
    const fragments: string[] = [];
    if (!arraysEqual(prev.shownAsPin, next.shownAsPin)) {
        fragments.push(
            next.shownAsPin.length === 0
                ? 'no places shown as pins'
                : `places shown as pins: ${next.shownAsPin.map((id) => `"${id}"`).join(', ')}`,
        );
    }
    if (!arraysEqual(prev.shownAsBaseMap, next.shownAsBaseMap)) {
        fragments.push(
            next.shownAsBaseMap.length === 0
                ? 'no places shown as base-map POIs'
                : `places shown as base-map POIs: ${next.shownAsBaseMap.map((id) => `"${id}"`).join(', ')}`,
        );
    }
    return fragments.length ? fragments.join('; ') : undefined;
};

// Diffs a sorted-array snapshot of "currently shown" entry ids and produces a one-line
// summary. Used for routes / ranges where multiple entries can be on the map under
// `multiple` mode — the digest can't be a scalar anymore.
const formatShownSetDiff = (label: string, prev: readonly string[], next: readonly string[]): string | undefined => {
    if (arraysEqual(prev, next)) return undefined;
    if (next.length === 0) return `${label} cleared`;
    return `${label} shown: ${next.map((id) => `"${id}"`).join(', ')}`;
};

/**
 * Produce a compact, LLM-readable summary of the differences between two digests, or `null` when
 * nothing changed. The output is short enough to prepend to a user prompt without bloating the
 * conversation; longer per-field diffs are deliberately omitted.
 *
 * @example
 * ```ts
 * const prev = getStateDigest(state);
 * // ... user clicks around in the UI ...
 * const diff = formatStateDigestDiff(prev, getStateDigest(state));
 * // → '[map state changed since last response: places shown as pins: "amsterdam-cinemas"; route now "routes-2"]'
 * ```
 *
 * @group Agent Toolkit
 */
export const formatStateDigestDiff = (prev: StateDigest, next: StateDigest): string | null => {
    const fragments: string[] = [];

    const placesFragment = formatPlacesDiff(prev.places, next.places);
    if (placesFragment) fragments.push(placesFragment);

    const routeFragment = formatShownSetDiff('routes', prev.routes.shown, next.routes.shown);
    if (routeFragment) fragments.push(routeFragment);

    const rangeFragment = formatShownSetDiff('ranges', prev.ranges.shown, next.ranges.shown);
    if (rangeFragment) fragments.push(rangeFragment);

    if (prev.traffic.analyticsActive !== next.traffic.analyticsActive) {
        fragments.push(next.traffic.analyticsActive ? 'traffic analytics now active' : 'traffic analytics cleared');
    }

    const incidentsShownFragment = formatShownSetDiff('incidents', prev.incidents.shown, next.incidents.shown);
    if (incidentsShownFragment) fragments.push(incidentsShownFragment);

    const monitoredFragment = formatShownSetDiff(
        'incidents monitor',
        prev.incidents.monitored,
        next.incidents.monitored,
    );
    if (monitoredFragment) fragments.push(monitoredFragment);

    // Entry-mode flips are surfaced last so the LLM sees them as policy
    // changes, separate from "what's on the map right now".
    if (prev.places.entryMode !== next.places.entryMode) {
        fragments.push(`places entryMode → ${next.places.entryMode}`);
    }
    if (prev.routes.entryMode !== next.routes.entryMode) {
        fragments.push(`routes entryMode → ${next.routes.entryMode}`);
    }
    if (prev.ranges.entryMode !== next.ranges.entryMode) {
        fragments.push(`ranges entryMode → ${next.ranges.entryMode}`);
    }
    if (prev.incidents.entryMode !== next.incidents.entryMode) {
        fragments.push(`incidents entryMode → ${next.incidents.entryMode}`);
    }

    if (fragments.length === 0) return null;
    return `[map state changed since last response: ${fragments.join('; ')}]`;
};
