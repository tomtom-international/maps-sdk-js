import { getPosition, type POICategory } from '@tomtom-org/maps-sdk/core';
import { search } from '@tomtom-org/maps-sdk/services';
import type { MultiPolygon, Polygon } from 'geojson';
import type { Counted } from '../results/results-store';
import { householdsEnabled, searchLimit } from './experimental-search';

// The example's own search queries. The household ("Reach" / residential-density) address lookup
// needed a 10 000-result ceiling to differentiate and the backend that provided it has been removed,
// so countHouseholds / searchAddresses report null / an empty sample and callers hide every
// household surface. See experimental-search.ts.

// Re-exported so the tools keep one import site for the search plumbing.
export { householdsEnabled, searchLimit };

type AreaGeometry = Polygon | MultiPolygon;
export type SearchFeature = Awaited<ReturnType<typeof search>>['features'][number];

const runSearch = (request: {
    geometries: AreaGeometry[];
    limit: number;
    poiCategories?: POICategory[];
    query?: string;
}) => search(request);

/**
 * Address (≈household) count within the catchment. Always `count: null` — the household signal has
 * no backend. Callers gate their UI on {@link householdsEnabled}, not on this null.
 */
export const countHouseholds = async (_geometry: AreaGeometry): Promise<Counted> => ({
    count: null,
    capped: false,
});

/**
 * Address (≈household) POINTS within an area, for per-cell residential-density counting in a
 * whitespace scan. Always empty — the household signal has no backend.
 */
export const searchAddresses = async (
    _geometry: AreaGeometry,
): Promise<{ features: SearchFeature[]; capped: boolean }> => ({ features: [], capped: false });

/**
 * POI search inside a geometry, capped at {@link searchLimit}. Category search when codes resolve;
 * free-text fallback otherwise. Returns [] on failure.
 */
export const searchInGeometry = async (
    geometry: AreaGeometry,
    options: { poiCategories?: POICategory[]; query?: string; limit?: number },
): Promise<SearchFeature[]> => {
    const limit = options.limit ?? searchLimit();
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

// The category can arrive as a raw code ("FITNESS_CLUB_CENTER") or as a friendly name. Title-case
// codes for display, leave friendly names alone.
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
