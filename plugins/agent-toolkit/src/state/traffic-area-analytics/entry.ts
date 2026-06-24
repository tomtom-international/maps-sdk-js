/**
 * @module agent-toolkit-state
 */

import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { TrafficAreaAnalyticsConfig, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';

/**
 * Compact provenance metadata for a traffic-area-analytics entry — the request
 * parameters that produced the result. Kept opaque (`Record<string, unknown>`)
 * because the SDK call accepts a wide param shape and we just want to surface
 * enough context for `recall` / `digest` tools.
 *
 * @group Agent Toolkit
 */
export type TrafficAreaAnalyticsParams = Record<string, unknown>;

/**
 * A single entry in the traffic-area-analytics history — output of one
 * `getTrafficAreaAnalytics` call. Mirrors the per-entry model used by
 * `RoutingState` / `CustomGeometriesState`: each entry owns its own
 * `TrafficAreaAnalyticsModule`, lazy-initialised on first show.
 *
 * @group Agent Toolkit
 */
export type TrafficAreaAnalyticsEntry = {
    id: string;
    timestamp: number;
    label: string;
    /** The aggregated FeatureCollection result. */
    data: TrafficAreaAnalytics;
    /** Request parameters that produced this entry — provenance only, opaque to consumers. */
    params: TrafficAreaAnalyticsParams;
    /**
     * Per-entry TrafficAreaAnalyticsModule. Each entry owns its own so two entries can render
     * side-by-side. Lazy-initialised via {@link TrafficAreaAnalyticsState.getEntryModule}.
     */
    _module?: TrafficAreaAnalyticsModule;
    /** Latest viz config reflected from the module (mode / metric / scaleMode / …). */
    _config?: TrafficAreaAnalyticsConfig;
    /** Unsubscribe from this entry's module config-change wiring. Cleared on hide / remove. */
    _configChangeUnsub?: () => void;
    /** True while `_module` is rendering on the map. */
    _shown?: boolean;
};
