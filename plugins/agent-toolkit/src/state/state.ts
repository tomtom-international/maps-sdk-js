/**
 * @module agent-toolkit-state
 */

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { StateSlice, ToolState } from '../types';
import { BaseMapState } from './base-map';
import { BYODState } from './byod';
import { CustomGeometriesState } from './custom-geometries';
import { MapPOIsState } from './map-pois';
import { PlacesState } from './places';
import { RangeState } from './range';
import { RoutingState } from './routing';
import { TrafficAreaAnalyticsState } from './traffic-area-analytics';
import { TrafficIncidentsState } from './traffic-incidents';
import { TrafficTilesState } from './traffic-tiles';

export { BaseMapState } from './base-map';
export { type BYODEntry, type BYODSource, BYODState, type BYODStateEvents } from './byod';
export { CustomGeometriesState, type CustomGeometriesStateEvents } from './custom-geometries/state';
export { MapPOIsState } from './map-pois';
export { type PlacesMarkerType, PlacesState, type PlacesStateEvents } from './places/state';
export { RangeState, type RangeStateEvents } from './range/state';
export { RoutingState, type RoutingStateEvents } from './routing/state';
export { TrafficAreaAnalyticsState, type TrafficAreaAnalyticsStateEvents } from './traffic-area-analytics/state';
export { type IncidentMonitorDeps } from './traffic-incidents/monitor/monitor';
export {
    type IncidentFocus,
    type IncidentsAnalysis,
    TrafficIncidentsState,
    type TrafficIncidentsStateEvents,
} from './traffic-incidents/state';
export { TrafficTilesState } from './traffic-tiles/state';

TomTomConfig.instance.put({ language: 'en-GB' });

/**
 * Per-slice display policy. With `multiple` (default) several history entries can be on the
 * map at once; with `single` only the most recent one stays. Switching from `multiple` to
 * `single` automatically drops every entry except the latest (and clears their modules) so
 * the map matches the new policy immediately.
 *
 * @group Agent Toolkit
 */
export type EntryMode = 'single' | 'multiple';

/**
 * State slice that owns a history of entries and can be driven into `single` or `multiple`
 * mode. Every {@link ToolState} slice with `setEntryMode` implements this shape, which lets
 * callers (the `setEntryMode` tool, `createMapAgent`'s `dataEntries` option, …) handle the
 * whole family uniformly without listing slice names.
 *
 * @group Agent Toolkit
 */
export interface EntryModeSlice {
    readonly entryMode: EntryMode;
    readonly entries: readonly { readonly id: string }[];
    setEntryMode(mode: EntryMode): Promise<void>;
}

/**
 * Data-entry kind names — the vocabulary used by `dataEntries` on `createMapAgent`. Superset
 * of the analyse/process input kinds (`EntryDataKind`) — adds `ranges`, which has its own
 * entry-mode-supporting slice but is not a top-level input kind for those tools.
 *
 * The kind names are LLM-facing (`routes`, `incidents`) rather than slice names (`routing`,
 * `trafficIncidents`); the slice mapping is internal — see {@link DATA_ENTRY_KIND_TO_SLICE}.
 *
 * @group Agent Toolkit
 */
export type DataEntryKind =
    | 'places'
    | 'routes'
    | 'incidents'
    | 'customGeometries'
    | 'trafficAreaAnalytics'
    | 'byod'
    | 'ranges';

/**
 * Per-kind configuration accepted by `createMapAgent`'s `dataEntries` option.
 *
 * @group Agent Toolkit
 */
export type DataEntryConfig = {
    /**
     * When `false`, the kind is removed from the agent's tool surface entirely:
     * - the kind disappears from `analyseData` / `processData` scope and input fields;
     * - related recall / display / fetch tools are dropped from the registry
     *   (see {@link TOOLS_BY_DATA_ENTRY_KIND}).
     *
     * Default: `true`.
     */
    enabled?: boolean;
    /**
     * Initial entry-display policy for the underlying slice. `single` keeps only the latest
     * entry on the map (others auto-hide); `multiple` (default) lets several coexist.
     */
    entryMode?: EntryMode;
};

/**
 * Mapping from {@link DataEntryKind} (LLM-facing name) to the {@link ToolState} slice key
 * that owns the entries for that kind. Used by `createMapAgent` to apply `entryMode` from
 * `dataEntries[kind].entryMode` to the right slice.
 *
 * @group Agent Toolkit
 */
export const DATA_ENTRY_KIND_TO_SLICE = {
    places: 'places',
    routes: 'routing',
    incidents: 'trafficIncidents',
    customGeometries: 'customGeometries',
    trafficAreaAnalytics: 'trafficAreaAnalytics',
    byod: 'byod',
    ranges: 'ranges',
} as const satisfies Record<DataEntryKind, EntryModeSliceName>;

/**
 * Compile-time union of {@link ToolState} keys whose slice supports {@link EntryMode}.
 * Names match the {@link ToolState} keys exactly — `routing` (not `routes`),
 * `customGeometries` (not `geometries`) — so the slice name in the tool API never drifts
 * from the property on `state`.
 *
 * Auto-grows when a new slice implements `setEntryMode`: the union picks up the new key,
 * and the runtime list {@link ENTRY_MODE_SLICE_NAMES} fails to type-check until the key
 * is added there too.
 *
 * @group Agent Toolkit
 */
export type EntryModeSliceName = {
    [K in keyof ToolState]: ToolState[K] extends EntryModeSlice ? K : never;
}[keyof ToolState];

/**
 * Runtime enumeration of slice names that support entry mode. The `satisfies` clause
 * makes drift a compile error: when a new {@link ToolState} slice gains `setEntryMode`,
 * this constant has to be updated before the package will build.
 *
 * @group Agent Toolkit
 */
export const ENTRY_MODE_SLICE_NAMES = Object.keys({
    places: true,
    routing: true,
    ranges: true,
    customGeometries: true,
    byod: true,
    trafficAreaAnalytics: true,
    trafficIncidents: true,
} satisfies Record<EntryModeSliceName, true>) as readonly EntryModeSliceName[];

/**
 * State slice that owns a set of "entries" (routes, ranges) where each entry can be hidden
 * individually by id and the slice exposes the currently-shown set. Implemented by
 * {@link RoutingState} and {@link RangeState}; consumed by helpers that need to hide
 * previously-shown entries before rendering a new one (see `hidePreviousShownEntries`).
 *
 * Not implemented by {@link PlacesState}, which uses a wider per-entry marker-type model
 * (`removeShownEntries(ids)` rather than `hideEntry(id)`).
 *
 * @group Agent Toolkit
 */
export interface ShownEntriesSlice extends StateSlice {
    readonly entryMode: EntryMode;
    readonly shownEntryIds: ReadonlySet<string>;
    hideEntry(entryId: string): Promise<void>;
}

/**
 * State slice that renders something on the map and can hide ALL of it in one call. The
 * {@link clearMap} tool walks every slice that implements this interface so adding a new
 * slice (e.g. a future overlay) auto-grows the tool's surface — no hand-edits required.
 *
 * `clearShown` is map-only: it hides what's currently rendered but leaves the slice's
 * history (`entries`) intact. Use the slice's `reset()` for a full wipe.
 *
 * @group Agent Toolkit
 */
export interface ClearableMapSlice {
    clearShown(): Promise<void>;
}

/**
 * Compile-time union of {@link ToolState} keys whose slice implements {@link ClearableMapSlice}.
 * Same pattern as {@link EntryModeSliceName}: the union auto-grows when a slice gains
 * `clearShown`, and the runtime list {@link CLEARABLE_SLICE_NAMES} fails to type-check until
 * the key is added there too.
 *
 * @group Agent Toolkit
 */
export type ClearableSliceName = {
    [K in keyof ToolState]: ToolState[K] extends ClearableMapSlice ? K : never;
}[keyof ToolState];

/**
 * Runtime enumeration of slice names that support `clearShown`. The `satisfies` clause
 * makes drift a compile error: when a new {@link ToolState} slice implements
 * {@link ClearableMapSlice}, this constant has to be updated before the package will build.
 *
 * @group Agent Toolkit
 */
export const CLEARABLE_SLICE_NAMES = Object.keys({
    places: true,
    routing: true,
    ranges: true,
    customGeometries: true,
    byod: true,
    trafficAreaAnalytics: true,
    trafficIncidents: true,
} satisfies Record<ClearableSliceName, true>) as readonly ClearableSliceName[];

/**
 * Factory that creates a fully initialized ToolState from a TomTomMap instance.
 * Optionally merges custom state slices alongside built-in state.
 *
 * @param map - TomTomMap instance for module initialization
 * @param customSlices - Additional state slices accessible by custom tools
 *
 * @group Agent Toolkit
 */
export const createToolState = <T extends Record<string, unknown> = Record<string, never>>(
    map: TomTomMap,
    customSlices?: T,
): ToolState & T => {
    const base: ToolState = {
        places: new PlacesState(map),
        mapPOIs: new MapPOIsState(map),
        routing: new RoutingState(map),
        baseMap: new BaseMapState(map),
        trafficTiles: new TrafficTilesState(map),
        trafficAreaAnalytics: new TrafficAreaAnalyticsState(map),
        trafficIncidents: new TrafficIncidentsState(map),
        ranges: new RangeState(map),
        customGeometries: new CustomGeometriesState(map),
        byod: new BYODState(map),
    };
    if (customSlices) Object.assign(base, customSlices);
    return base as ToolState & T;
};
