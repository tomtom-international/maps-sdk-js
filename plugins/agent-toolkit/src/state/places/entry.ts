/**
 * @module agent-toolkit-state
 */

import type { CommonPlaceProps, Place, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { GeometriesModule, PlaceConnectionDisplay, PlacesModule } from '@tomtom-org/maps-sdk/map';
import type { PlacesAnalysis } from './analysis';

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
