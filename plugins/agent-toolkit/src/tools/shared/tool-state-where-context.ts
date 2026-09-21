/**
 * @module agent-toolkit-tools
 */

import type { BBox } from '@tomtom-org/maps-sdk/core';
import { geometryData } from '@tomtom-org/maps-sdk/services';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';
import type { ToolExecuteOptions, ToolState } from '../../types';
import { withAgentToolkitHeaders } from './agent-headers';
import { geocodeAreas as geocodeContainingAreas } from './geocode-areas';
import { locatePlaces } from './locate-places';
import type { WhereContext } from './resolve-where';
import { getViewportBias, getViewportBoundingBox } from './viewport-bias';

/** Adapts the live `ToolState` to the narrow `WhereContext` the resolver depends on. Keeping this
 * mapping in one place is what lets resolveAreas stay testable without a ToolState. */
export const toolStateToWhereContext = (state: ToolState, options?: ToolExecuteOptions): WhereContext => ({
    viewport: () => {
        let bbox: BBox | undefined;
        let center: Position | undefined;
        try {
            bbox = getViewportBoundingBox(state.baseMap);
        } catch {
            bbox = undefined;
        }
        try {
            center = getViewportBias(state.baseMap);
        } catch {
            center = undefined;
        }
        return { bbox, center };
    },
    expandEntry: (id) => state.places.geometryPlaceIdsForEntry(id),
    geocodeAreas: (query, queryAs, bias) => {
        if (queryAs)
            return locatePlaces(query, queryAs, { limit: 5, bias: bias ? { position: bias } : undefined }, options);
        return geocodeContainingAreas(query, { bias }, options);
    },
    fetchGeometry: async (place) => {
        if (typeof place === 'string') return state.places.fetchPlaceGeometry(place, options);
        if (!place.properties.dataSources?.geometry?.id) return undefined;
        const requestParams = withAgentToolkitHeaders({
            geometries: [place],
            signal: options?.signal,
        });
        const result = await geometryData(requestParams);
        return result.features[0] as Feature<Polygon | MultiPolygon> | undefined;
    },
    getRoute: (routeId) => {
        const entries = state.routing.entries;
        if (entries.length === 0) {
            return {
                error: 'No routes available yet. Calculate or select a route first (e.g. calculateRoute), then retry.',
            };
        }
        const entry = routeId ? entries.find((e) => e.id === routeId) : entries.at(-1);
        if (!entry) {
            return { error: `Route "${routeId}" not found. Use recallState to list available route IDs.` };
        }
        const features = entry.data.features as Feature[];
        if (features.length === 0) {
            return { error: `Route "${entry.id}" has no geometry. Recompute it via calculateRoute.` };
        }
        return { features, label: entry.label };
    },
});
