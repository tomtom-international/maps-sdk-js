/**
 * @module agent-toolkit-state
 */

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { StateSlice, ToolState } from '../types';
import { BaseMapState } from './base-map';
import { CustomGeometriesState } from './custom-geometries';
import { MapPOIsState } from './map-pois';
import { PlacesState } from './places';
import { RangeState } from './range';
import { RoutingState } from './routing';
import { TrafficAreaAnalyticsState } from './traffic-area-analytics';
import { TrafficIncidentsState } from './traffic-incidents';
import { TrafficTilesState } from './traffic-tiles';

export { BaseMapState } from './base-map';
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
    };
    if (customSlices) Object.assign(base, customSlices);
    return base as ToolState & T;
};
