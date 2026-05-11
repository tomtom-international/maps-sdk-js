import type {
    CommonPlaceProps,
    Place,
    PolygonFeature,
    PolygonFeatures,
    Routes,
    WaypointLike,
} from '@tomtom-org/maps-sdk/core';
import type { GeometriesModule, PlaceConnectionDisplay, PlacesModule, RoutingModule } from '@tomtom-org/maps-sdk/map';
import type { ReachableRangeBudget } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import type { CustomGeometriesAnalysis } from '../state/custom-geometries/analysis';
import type { PlacesAnalysis } from '../state/places/analysis';
import type { RoutesAnalysis } from '../state/routing/analysis';
import { type GeometriesId } from '../tools/shared';

/**
 * Common interface for state slices. Implement `reset()` to participate
 * in cleanup when `destroy()` is called on the agent.
 *
 * All built-in state classes implement this. Custom slices can optionally
 * implement it to get automatic cleanup.
 *
 * @group Agent Toolkit
 */
export interface StateSlice {
    reset(): void;
}

export type { CustomGeometriesAnalysis, PlacesAnalysis, RoutesAnalysis };

/**
 * A single entry in the place search history.
 *
 * @group Agent Toolkit
 */
export type PlacesEntry = {
    id: string;
    timestamp: number;
    label: string;
    places: Place[];
    /** Connections (lines between places) produced alongside this entry, rendered via PlacesModule.showConnections. */
    connections?: PlaceConnectionDisplay[];
    /**
     * Boundary polygons attached to this entry. One feature per place that has a geometry data
     * source (populated lazily via PlacesState.fetchPlaceGeometry), or a standalone result list
     * produced by tools like processGeometries. Each feature's `id` is the geometry-data-source id
     * (`place.properties.dataSources.geometry.id`), matching the response shape of `geometryData`.
     */
    geometries?: PolygonFeature<CommonPlaceProps>[];
    /** Accumulated analysis results linked to this entry. */
    _analysis?: PlacesAnalysis[];
    /** Lazy place-id → Place index, built on first ID lookup through PlacesState.findPlaceById. */
    _byId?: Record<string, Place>;
    /** Lazy place-id → boundary polygon index, built on first lookup through PlacesState.getGeometryForPlace. */
    _geometryByPlaceId?: Record<string, PolygonFeature<CommonPlaceProps>>;
    /**
     * Per-entry display modules. Each entry owns its own PlacesModule per marker theme and a
     * dedicated GeometriesModule, so display state lives on the entry rather than on a shared
     * slice-level module. Lazy-initialised via PlacesState helpers — undefined until first show.
     */
    _modules?: {
        pin?: PlacesModule;
        baseMap?: PlacesModule;
        pinClustered?: PlacesModule;
        geometries?: GeometriesModule;
    };
    /** The marker theme currently rendering this entry, or undefined when hidden. */
    _shownAs?: 'pin' | 'base-map' | 'pin-clustered';
};

/**
 * Route planning parameters stored in routing state.
 * Consumed by setRoute, addWaypointsToRoute, removeWaypointsFromRoute, and replaceWaypointInRoute.
 *
 * @group Agent Toolkit
 */
export type RouteParams = {
    maxAlternatives?: number;
    costModel?: {
        routeType?: string;
        traffic?: 'live' | 'historical';
        avoid?: string[];
        avoidAreas?: Array<number[]>;
    };
    when?: { option: 'departAt' | 'arriveBy'; date: string };
};

/**
 * A single entry in the route calculation history.
 *
 * @group Agent Toolkit
 */
export type RoutesEntry = {
    id: string;
    timestamp: number;
    label: string;
    data: Routes;
    waypoints: WaypointLike[];
    params: RouteParams;
    /** Accumulated analysis results linked to this entry. */
    _analysis?: RoutesAnalysis[];
    /**
     * Per-entry RoutingModule. Each entry owns its own module so display state (which route
     * variant is selected, which waypoints are shown, layer theme) lives on the entry instead
     * of a shared slice-level module. Lazy-initialised via RoutingState helpers — undefined
     * until first show.
     */
    _module?: RoutingModule;
    /** True while this entry's `_module` is rendering routes/waypoints on the map. */
    _shown?: boolean;
};

/**
 * A single reachable area, scoped to one origin and one set of budgets.
 * One {@link RangesEntry} bundles one or more of these — useful for comparing
 * coverage from several origins under the same query.
 *
 * @group Agent Toolkit
 */
export type ReachableRange = {
    origin: { query?: string; position: Position };
    budgets: ReachableRangeBudget[];
    /** Raw polygon result for use in subsequent geometry searches. Not exposed to the agent. */
    polygon?: PolygonFeatures;
};

/**
 * Provenance metadata for a custom-geometries entry — captures every input
 * source that fed the polygon-producing operation. `sourceIds` holds tagged
 * ids in the same form `geometriesEntryIDs` accepts: `{ kind: 'place' }` for
 * a single place footprint, `{ kind: 'places' }` for every footprint in a
 * places entry, `{ kind: 'ranges' }` for an isochrone entry,
 * `{ kind: 'custom' }` for a derived entry. `operation` is a short label for
 * the kind of computation that produced the entry (e.g. `'union'`, `'buffer'`,
 * `'h3-coverage'`).
 *
 * @group Agent Toolkit
 */
export type GeometryProvenance = {
    /** Short label for the operation that produced this entry (free-form). */
    operation?: string;
    /** Tagged source ids that fed the producing operation. */
    sourceIds: readonly GeometriesId[];
};

/**
 * A single entry in the custom-geometries history — output of
 * processGeometries (and any future polygon-producing tool that doesn't
 * naturally belong to places or ranges).
 *
 * @group Agent Toolkit
 */
export type CustomGeometriesEntry = {
    id: string;
    timestamp: number;
    label: string;
    /** The polygons stored on this entry (Polygon / MultiPolygon GeoJSON Features). */
    features: PolygonFeature[];
    /** Inputs and operation that produced this entry. */
    provenance: GeometryProvenance;
    /** Accumulated analysis results linked to this entry. */
    _analysis?: CustomGeometriesAnalysis[];
    /**
     * Per-entry GeometriesModule. Each entry owns its own module so display state
     * (theme, current features) lives on the entry instead of a shared slice-level
     * module. Lazy-initialised via CustomGeometriesState helpers.
     */
    _module?: GeometriesModule;
    /** Theme that the geometries module is currently configured with. */
    _shownTheme?: 'filled' | 'outline' | 'inverted';
    /** True while this entry's `_module` is rendering on the map. */
    _shown?: boolean;
};

/**
 * A single entry in the reachable range history. Holds one or more
 * {@link ReachableRange} results that were computed together — typically
 * one per origin in a multi-origin call to `findReachableAreas`.
 *
 * @group Agent Toolkit
 */
export type RangesEntry = {
    id: string;
    timestamp: number;
    label: string;
    /** One or more ranges sharing this entry — typically one per origin. */
    ranges: ReachableRange[];
    /**
     * Per-entry display modules. Each entry owns a dedicated GeometriesModule (for the
     * isochrone polygons) and PlacesModule (for the origin pin(s)), so display state lives
     * on the entry instead of a shared slice-level module. Lazy-initialised via RangeState
     * helpers — undefined until first show.
     */
    _modules?: {
        geometries?: GeometriesModule;
        places?: PlacesModule;
    };
    /** Theme that the geometries module is currently configured with. */
    _shownTheme?: 'filled' | 'outline' | 'inverted';
    /** True while any of this entry's modules are rendering on the map. */
    _shown?: boolean;
};
