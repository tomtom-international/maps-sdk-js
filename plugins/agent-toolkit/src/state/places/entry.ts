/**
 * @module agent-toolkit-state
 */

import type { CommonPlaceProps, Place, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { GeometriesModule, PlaceConnectionDisplay, PlacesModule } from '@tomtom-org/maps-sdk/map';
import type { BaseEntry } from '../entry';

/**
 * A single entry in the place search history.
 *
 * @group Agent Toolkit
 *
 * @ignore
 */
export type PlacesEntry = BaseEntry<Place[]> & {
    /** Connections (lines between places) produced alongside this entry, rendered via PlacesModule.showConnections. */
    connections?: PlaceConnectionDisplay[];
    /**
     * Boundary polygons attached to this entry. One feature per place that has a geometry data
     * source (populated lazily via PlacesState.fetchPlaceGeometry), or a standalone result list
     * produced by tools like `processData`. Each feature's `id` is the geometry-data-source id
     * (`place.properties.dataSources.geometry.id`), matching the response shape of `geometryData`.
     */
    geometries?: PolygonFeature<CommonPlaceProps>[];
    /** Lazy place-id → Place index, built on first ID lookup through PlacesState.findPlaceById. */
    _byId?: Record<string, Place>;
    /** Lazy place-id → boundary polygon index, built on first lookup through PlacesState.getGeometryForPlace. */
    _geometryByPlaceId?: Record<string, PolygonFeature<CommonPlaceProps>>;
    /**
     * Per-entry display modules. An entry is rendered under at most one marker theme at a time,
     * so a single PlacesModule covers all themes — `_showEntryAs` rethemes it via `applyTheme`.
     * A dedicated GeometriesModule renders the entry's boundary polygons.
     * Lazy-initialised via PlacesState helpers — undefined until first show.
     */
    _modules?: {
        places?: PlacesModule;
        geometries?: GeometriesModule;
    };
    /** The marker theme currently rendering this entry, or undefined when hidden. */
    _shownAs?: 'pin' | 'base-map' | 'pin-clustered';
};
