/**
 * @module agent-toolkit-state
 */

import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { GeometriesModule } from '@tomtom-org/maps-sdk/map';
import type { GeometriesId } from '../../tools/shared';
import type { BaseEntry } from '../entry';

/**
 * Provenance metadata for a custom-geometries entry — captures every input
 * source that fed the polygon-producing operation. `sourceIds` holds tagged
 * ids in the same form `geometriesEntryIDs` accepts: `{ kind: 'place' }` for
 * a single place footprint, `{ kind: 'places' }` for every footprint in a
 * places entry, `{ kind: 'ranges' }` for an isochrone entry,
 * `{ kind: 'customGeometries' }` for a derived entry. `operation` is a short label for
 * the kind of computation that produced the entry (e.g. `'union'`, `'buffer'`,
 * `'h3-coverage'`).
 *
 * @group Agent Toolkit
 *
 * @ignore
 */
export type GeometryProvenance = {
    /** Short label for the operation that produced this entry (free-form). */
    operation?: string;
    /** Tagged source ids that fed the producing operation. */
    sourceIds: readonly GeometriesId[];
};

/**
 * A single entry in the custom-geometries history — output of `processData`
 * (and any future polygon-producing tool that doesn't naturally belong to
 * places or ranges).
 *
 * @group Agent Toolkit
 *
 * @ignore
 */
export type CustomGeometriesEntry = BaseEntry<PolygonFeature[]> & {
    /** Inputs and operation that produced this entry. */
    provenance: GeometryProvenance;
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
