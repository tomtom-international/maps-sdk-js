import { getPosition, type POICategory } from '@tomtom-org/maps-sdk/core';
import { discoverPlaces, type TimeZoneRequest } from '@tomtom-org/maps-sdk/services';
import type { MultiPolygon, Polygon } from 'geojson';
import type { Counted } from '../results/results-store';
import { householdsEnabled, searchLimit } from './experimental-search';

// The example's own search queries. The household ("Reach" / residential-density) address lookup
// needed a 10 000-result ceiling to differentiate and the backend that provided it has been removed,
// so countHouseholds / searchAddresses report null / an empty sample and callers hide every
// household surface. See experimental-search.ts.

// Re-exported so the tools keep one import site for the search plumbing.
export { householdsEnabled, searchLimit };

// The Places API rejects a request whose categorySet holds more IDs than this.
export const MAX_CATEGORY_CODES = 10;

type AreaGeometry = Polygon | MultiPolygon;
export type SearchFeature = Awaited<ReturnType<typeof discoverPlaces>>['features'][number];

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

const toBatches = <T>(items: readonly T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

/**
 * POI search inside a geometry, each request capped at {@link searchLimit}. Category search when codes
 * resolve, in parallel batches of {@link MAX_CATEGORY_CODES} merged by POI id; free-text fallback
 * otherwise. Every batch is kept, so the nearest place survives however full the others are, and
 * `capped` is set when any request filled its limit. Rejects when any request fails, so a failure never
 * reads as zero places.
 */
export const searchInGeometry = async (
    geometry: AreaGeometry,
    options: { poiCategories?: POICategory[]; query?: string; limit?: number; timeZone?: TimeZoneRequest },
): Promise<{ features: SearchFeature[]; capped: boolean }> => {
    const { poiCategories = [], query = '', limit = searchLimit(), timeZone } = options;
    const results = await Promise.all(
        poiCategories.length === 0
            ? [discoverPlaces({ query, geometries: [geometry], limit, timeZone })]
            : toBatches(poiCategories, MAX_CATEGORY_CODES).map((batch) =>
                  discoverPlaces({ filters: { poiCategories: batch }, geometries: [geometry], limit, timeZone }),
              ),
    );
    const byId = new Map(results.flatMap((result) => result.features).map((feature) => [feature.id, feature]));
    return {
        features: [...byId.values()],
        capped: results.some((result) => result.features.length >= limit),
    };
};

// The category can arrive as a raw code ("FITNESS_CLUB_AND_CENTER") or as a friendly name. Title-case
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
