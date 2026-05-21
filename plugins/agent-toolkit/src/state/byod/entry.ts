/**
 * @module agent-toolkit-state
 */

import type { CustomGeoJSONLayerSpec, CustomGeoJSONModule } from '@tomtom-org/maps-sdk/map';
import type { FeatureCollection } from 'geojson';

/**
 * Where a BYOD entry came from.
 * - `integrator`: seeded programmatically by the embedding app (e.g. user-uploaded file).
 * - `url`: fetched from a URL via `addByodLayer`.
 * - `inline`: passed as inline GeoJSON via `addByodLayer`.
 *
 * @group Agent Toolkit
 */
export type BYODSource =
    | { kind: 'integrator'; description?: string }
    | { kind: 'url'; url: string }
    | { kind: 'inline'; description?: string };

/**
 * A single entry in the BYOD (bring-your-own-data) GeoJSON history. Each entry
 * is a customer-authored layer the agent can read, render, query, or pipe
 * through analyseData / processData.
 *
 * @group Agent Toolkit
 */
export type BYODEntry = {
    id: string;
    timestamp: number;
    label: string;
    data: FeatureCollection;
    /** Provenance for the data — used by recall tools and the UI. */
    source: BYODSource;
    /**
     * MapLibre layer specs the slice will render this entry under. When omitted
     * at `addEntry` time the slice fills this in with sensible defaults based
     * on the entry's geometry types (Point → circle, Line → line, Polygon → fill).
     */
    layers: CustomGeoJSONLayerSpec[];
    /**
     * Per-entry CustomGeoJSONModule. Each entry owns its own module so display state
     * (currently-rendered feature set, visibility) lives on the entry instead of a
     * shared slice-level module. Lazy-initialised via BYODState helpers.
     */
    _module?: CustomGeoJSONModule;
    /** True while this entry's `_module` is rendering on the map. */
    _shown?: boolean;
};
