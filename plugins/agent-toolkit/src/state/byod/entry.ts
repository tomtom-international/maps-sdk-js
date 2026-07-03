/**
 * @module agent-toolkit-state
 */

import type { CustomGeoJSONLayerSpec, CustomGeoJSONModule } from '@tomtom-org/maps-sdk/map';
import type { FeatureCollection } from 'geojson';
import type { BaseEntry } from '../entry';
import type { BYODDataProfile } from './profile';

/**
 * Where a BYOD entry came from.
 * - `integrator`: seeded programmatically by the embedding app (e.g. user-uploaded file).
 * - `url`: fetched from a URL via `addByodSource`.
 * - `inline`: passed as inline GeoJSON via `addByodSource`.
 *
 * @group Agent Toolkit
 *
 * @ignore
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
 *
 * @ignore
 */
export type BYODEntry = BaseEntry<FeatureCollection> & {
    /** Provenance for the data — used by recall tools and the UI. */
    source: BYODSource;
    /**
     * Runtime-inferred shape of `data` — geometry types and a per-property
     * profile. Derived once at `addEntry` time (see `profileFeatureCollection`)
     * so recall / ingest tools can describe the data to the model without
     * shipping the full FeatureCollection.
     */
    profile: BYODDataProfile;
    /**
     * MapLibre layer specs the slice renders this entry under. Always explicit —
     * empty until set via `setByodLayers` (the agent path) or by passing `layers`
     * to `addEntry`. An entry with no layers renders nothing.
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
