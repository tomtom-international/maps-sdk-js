/**
 * @module agent-toolkit-state
 */

import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { GeometriesModule, PlacesModule } from '@tomtom-org/maps-sdk/map';
import type { ReachableRangeBudget } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';

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
