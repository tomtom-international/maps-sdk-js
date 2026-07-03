import { getPosition, type POICategory } from '@tomtom-org/maps-sdk/core';
import { explorationSearch, search } from '@tomtom-org/maps-sdk/services';
import type { MultiPolygon, Polygon } from 'geojson';
import type { Counted } from '../results/results-store';

// The agent-toolkit can route search through an experimental backend via its `experimentalSearch` feature
// flag; this module mirrors that single switch for the example's own searches. Both backends do
// everything this example needs — POI/category search AND enumerating address points (the household
// "Reach" / residential-density signal): the experimental backend filters addresses with `placeTypes`,
// the default one with the `PAD` (point-address) index. The only practical difference is the result
// ceiling (SEARCH_LIMIT) — the default backend maxes out at 100, so in a populated area Reach saturates
// and reads as a coarse relative signal (never a true household total); the experimental backend's higher
// ceiling differentiates further.
//
// Hardcoded OFF for now — the default search is enough and we are not exposing the experimental backend
// yet. To enable it later, flip this one constant AND pass `featureFlags: { experimentalSearch: true }` to
// createMapAgent so the toolkit and this example agree. Typed `boolean` so both branches stay live.
const EXPERIMENTAL_SEARCH: boolean = false;

type AreaGeometry = Polygon | MultiPolygon;
// A feature can come from either backend, so the shared type is the union of both result shapes.
export type SearchFeature =
    | Awaited<ReturnType<typeof search>>['features'][number]
    | Awaited<ReturnType<typeof explorationSearch>>['features'][number];

// Result cap, matching the active backend's ceiling (mirrors the toolkit's own per-backend limits).
export const SEARCH_LIMIT = EXPERIMENTAL_SEARCH ? 10_000 : 100;

// The two places the search backend is chosen, driven by the toolkit's feature flag. Both backends
// accept the same core request (query / poiCategories / geometries / limit) for POI search...
const runSearch = (request: {
    geometries: AreaGeometry[];
    limit: number;
    poiCategories?: POICategory[];
    query?: string;
}) => (EXPERIMENTAL_SEARCH ? explorationSearch(request) : search(request));

// ...and both can enumerate address points within a geometry, via the filter each backend exposes.
const searchAddressPoints = (geometry: AreaGeometry) =>
    EXPERIMENTAL_SEARCH
        ? explorationSearch({ placeTypes: ['PointAddress'], geometries: [geometry], limit: SEARCH_LIMIT })
        : search({ indexes: ['PAD'], geometries: [geometry], limit: SEARCH_LIMIT });

/** Address (≈household) count within the catchment. `count: null` = the address search failed. */
export const countHouseholds = async (geometry: AreaGeometry): Promise<Counted> => {
    try {
        const result = await searchAddressPoints(geometry);
        const count = result.features.length;
        return { count, capped: count >= SEARCH_LIMIT };
    } catch {
        return { count: null, capped: false };
    }
};

/**
 * Address (≈household) POINTS within an area, for per-cell residential-density counting in a whitespace
 * scan. Caps at {@link SEARCH_LIMIT}; on the default backend (100) the sample saturates almost
 * immediately, so the result is a coarse relative signal, not a true total — callers should surface
 * `capped`.
 */
export const searchAddresses = async (
    geometry: AreaGeometry,
): Promise<{ features: SearchFeature[]; capped: boolean }> => {
    try {
        const result = await searchAddressPoints(geometry);
        return { features: result.features, capped: result.features.length >= SEARCH_LIMIT };
    } catch {
        return { features: [], capped: false };
    }
};

/**
 * POI search inside a geometry, capped at {@link SEARCH_LIMIT}. Category search when codes resolve;
 * free-text fallback otherwise. Routes through the active search backend. Returns [] on failure.
 */
export const searchInGeometry = async (
    geometry: AreaGeometry,
    options: { poiCategories?: POICategory[]; query?: string; limit?: number },
): Promise<SearchFeature[]> => {
    const limit = options.limit ?? SEARCH_LIMIT;
    try {
        const result = await runSearch(
            options.poiCategories && options.poiCategories.length > 0
                ? { poiCategories: options.poiCategories, geometries: [geometry], limit }
                : { query: options.query ?? '', geometries: [geometry], limit },
        );
        return result.features;
    } catch {
        return [];
    }
};

// One backend returns the category as a raw code ("FITNESS_CLUB_CENTER"); the other may return a friendly
// name. Title-case codes for display, leave friendly names alone.
const prettifyCategory = (value: string): string =>
    /^[A-Z0-9_]+$/.test(value)
        ? value
              .toLowerCase()
              .split('_')
              .filter(Boolean)
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
        : value;

/** A POI's display name + primary category, for click popups + legends. Defensive — shapes vary. */
export const placeInfo = (feature: SearchFeature): { name: string; category: string } => {
    const props = (feature.properties ?? {}) as {
        poi?: { name?: string; categories?: string[] };
        address?: { freeformAddress?: string };
    };
    return {
        name: props.poi?.name ?? props.address?.freeformAddress ?? 'Unnamed place',
        category: prettifyCategory(props.poi?.categories?.[0] ?? ''),
    };
};

/** Nearest feature distance (metres) from a point, or null when none. */
export const nearestMeters = (
    centre: [number, number],
    features: readonly SearchFeature[],
): { meters: number | null; feature: SearchFeature | null } => {
    let nearest = Number.POSITIVE_INFINITY;
    let nearestFeature: SearchFeature | null = null;
    for (const feature of features) {
        const position = getPosition(feature);
        if (!position) continue;
        const meters = haversineMeters(centre, [position[0], position[1]]);
        if (meters < nearest) {
            nearest = meters;
            nearestFeature = feature;
        }
    }
    return { meters: Number.isFinite(nearest) ? Math.round(nearest) : null, feature: nearestFeature };
};

// Small local haversine so this module doesn't depend on turf (the tools already use turf for areas).
const haversineMeters = (a: [number, number], b: [number, number]): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b[1] - a[1]);
    const dLng = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};
