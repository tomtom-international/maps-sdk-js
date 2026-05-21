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

// `Array.prototype.sort` without a comparator falls back to UTF-16 code-unit order — fine for
// ASCII-only ids but unreliable once a localised label leaks in. Centralise the locale-aware
// comparator so every digest field gets the same predictable order.
const compareIds = (a: string, b: string): number => a.localeCompare(b);
const sortIds = (ids: Iterable<string>): string[] => [...ids].sort(compareIds);

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
        /** Traffic-area-analytics entry ids currently rendered on the map, sorted ascending. */
        shown: string[];
        /** Display policy in force on the slice — `multiple` (default) or `single`. */
        entryMode: EntryMode;
        /** Total traffic-area-analytics entries in history (shown + hidden). */
        entryCount: number;
    };
    incidents: {
        /** Traffic-incidents entry ids currently rendered on the map, sorted ascending. */
        shown: string[];
        /** Entry ids currently being polled by the per-entry network monitor, sorted ascending. */
        monitored: string[];
        /** Display policy in force on the slice — `multiple` (default) or `single`. */
        entryMode: EntryMode;
    };
    customGeometries: {
        /** Custom-geometries entry ids currently rendered on the map, sorted ascending. */
        shown: string[];
        /** Display policy in force on the slice — `multiple` (default) or `single`. */
        entryMode: EntryMode;
        /** Total custom-geometries entries in history (shown + hidden). */
        entryCount: number;
    };
    byod: {
        /** BYOD entry ids currently rendered on the map, sorted ascending. */
        shown: string[];
        /** Display policy in force on the slice — `multiple` (default) or `single`. */
        entryMode: EntryMode;
        /** Total BYOD entries in history (shown + hidden). */
        entryCount: number;
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
        shownAsPin: sortIds(state.places.shownAsPinIds),
        shownAsBaseMap: sortIds(state.places.shownAsBaseMapIds),
        entryMode: state.places.entryMode,
    },
    routes: { shown: sortIds(state.routing.shownEntryIds), entryMode: state.routing.entryMode },
    ranges: { shown: sortIds(state.ranges.shownEntryIds), entryMode: state.ranges.entryMode },
    traffic: {
        shown: sortIds(state.trafficAreaAnalytics.shownEntryIds),
        entryMode: state.trafficAreaAnalytics.entryMode,
        entryCount: state.trafficAreaAnalytics.entries.length,
    },
    incidents: {
        shown: sortIds(state.trafficIncidents.shownEntryIds),
        monitored: sortIds(
            state.trafficIncidents.entries
                .filter((entry) => entry._monitor?.status === 'running')
                .map((entry) => entry.id),
        ),
        entryMode: state.trafficIncidents.entryMode,
    },
    customGeometries: {
        shown: sortIds(state.customGeometries.shownEntryIds),
        entryMode: state.customGeometries.entryMode,
        entryCount: state.customGeometries.entries.length,
    },
    byod: {
        shown: sortIds(state.byod.shownEntryIds),
        entryMode: state.byod.entryMode,
        entryCount: state.byod.entries.length,
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

    const trafficAnalyticsFragment = formatShownSetDiff('traffic analytics', prev.traffic.shown, next.traffic.shown);
    if (trafficAnalyticsFragment) fragments.push(trafficAnalyticsFragment);

    const incidentsShownFragment = formatShownSetDiff('incidents', prev.incidents.shown, next.incidents.shown);
    if (incidentsShownFragment) fragments.push(incidentsShownFragment);

    const monitoredFragment = formatShownSetDiff(
        'incidents monitor',
        prev.incidents.monitored,
        next.incidents.monitored,
    );
    if (monitoredFragment) fragments.push(monitoredFragment);

    const customGeometriesFragment = formatShownSetDiff(
        'custom geometries',
        prev.customGeometries.shown,
        next.customGeometries.shown,
    );
    if (customGeometriesFragment) fragments.push(customGeometriesFragment);

    const byodFragment = formatShownSetDiff('byod', prev.byod.shown, next.byod.shown);
    if (byodFragment) fragments.push(byodFragment);

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
    if (prev.customGeometries.entryMode !== next.customGeometries.entryMode) {
        fragments.push(`custom geometries entryMode → ${next.customGeometries.entryMode}`);
    }
    if (prev.byod.entryMode !== next.byod.entryMode) {
        fragments.push(`byod entryMode → ${next.byod.entryMode}`);
    }

    if (fragments.length === 0) return null;
    return `[map state changed since last response: ${fragments.join('; ')}]`;
};
