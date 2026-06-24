/**
 * @module agent-toolkit-tools
 */

import { geometryData } from '@tomtom-org/maps-sdk/services';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { ToolState } from '../../types';
import { geocodeAreas } from './geocode-areas';
import { locatePlaces, type QueryAs } from './locate-places';
import type { WhereContext } from './resolve-where';
import { getViewportBias, getViewportBoundingBox } from './viewport-bias';

/** Adapts the live `ToolState` to the narrow `WhereContext` the resolver depends on. Keeping this
 * mapping in one place is what lets resolveAreas stay testable without a ToolState. */
export const toolStateToWhereContext = (state: ToolState): WhereContext => ({
    viewportBBox: () => {
        try {
            return getViewportBoundingBox(state.baseMap);
        } catch {
            return undefined;
        }
    },
    viewportCenter: () => {
        try {
            return getViewportBias(state.baseMap);
        } catch {
            return undefined;
        }
    },
    findPlaceById: (id) => state.places.findPlaceById(id)?.place,
    fetchPlaceGeometry: (id) => state.places.fetchPlaceGeometry(id),
    geocodeArea: (query, queryAs: QueryAs, bias) =>
        locatePlaces(query, queryAs, { limit: 5, bias: bias ? { position: bias } : undefined }),
    geocodeAreas: (query, bias) => geocodeAreas(query, { bias }),
    fetchAreaPolygon: async (place) => {
        if (!place.properties.dataSources?.geometry?.id) return undefined;
        const result = await geometryData({ geometries: [place] });
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
