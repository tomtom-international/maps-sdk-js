import type { Place, Places, Routes, WaypointLike } from '@tomtom-org/maps-sdk/core';
import { formatDistance, formatDuration } from '@tomtom-org/maps-sdk/core';

/**
 * Optional search context used to enrich a places history label.
 *
 * @ignore
 */
export type PlacesLabelContext = {
    query?: string;
    poiCategories?: string[];
    where?: string;
    /** Route label when results come from an along-route search (e.g. "Amsterdam to Utrecht"). */
    routeLabel?: string;
};

const placeName = (place: Place): string | undefined => place.properties?.poi?.name;

const placeAddress = (place: Place): string | undefined => place.properties?.address?.freeformAddress;

const waypointAddress = (wp: WaypointLike): string | undefined => {
    if (Array.isArray(wp)) return undefined;
    return (wp as any).properties?.address?.freeformAddress;
};

/** Builds a label for a Places FeatureCollection from its count and search context. */
const makeCollectionLabel = (count: number, context?: PlacesLabelContext): string => {
    const parts: string[] = [];

    if (context?.query) parts.push(`"${context.query}"`);
    if (context?.poiCategories?.length) parts.push(context.poiCategories.join(', '));
    if (context?.routeLabel) parts.push(`along ${context.routeLabel}`);
    else if (context?.where) parts.push(`in ${context.where}`);

    const countStr = `${count} ${count === 1 ? 'place' : 'places'}`;
    return parts.length ? `${parts.join(' ')} (${countStr})` : countStr;
};

/**
 * Generate a human-readable label for a places history entry.
 *
 * For a single Place the label is derived from result properties (name / address),
 * falling back to the query when properties are sparse.
 *
 * For a Places collection (FeatureCollection) the label is built from search
 * context (query, categories, location) plus the result count.
 *
 * @ignore
 */
export const makePlacesLabel = (data: Place | Places, context?: PlacesLabelContext): string => {
    if ('features' in data) return makeCollectionLabel(data.features.length, context);

    const name = placeName(data);
    const address = placeAddress(data);

    if (name && address) return `${name}, ${address}`;
    if (name) return name;
    if (address) return address;
    if (context?.query) return context.query;
    return 'Place';
};

/**
 * Generate a human-readable label for a routes history entry.
 *
 * @ignore
 */
export const makeRoutesLabel = (routes: Routes, waypoints: WaypointLike[]): string => {
    const summary = routes.features[0]?.properties?.summary;
    const duration = summary ? formatDuration(summary.travelTimeInSeconds) : undefined;
    const distance = summary ? formatDistance(summary.lengthInMeters) : undefined;
    const timeDistParts = [duration, distance].filter(Boolean);
    const timeDist = timeDistParts.length ? ` (${timeDistParts.join(', ')})` : '';

    const addresses = waypoints.map(waypointAddress).filter(Boolean) as string[];

    if (addresses.length >= 2) {
        const origin = addresses[0];
        const destination = addresses.at(-1);
        const vias = addresses.slice(1, -1);
        const path =
            vias.length > 0 ? `${origin} via ${vias.join(', ')} to ${destination}` : `${origin} to ${destination}`;
        return `${path}${timeDist}`;
    }

    return `Route${timeDist}`;
};

/** Budget type → display unit suffix. */
const RANGE_BUDGET_UNITS: Record<string, string> = {
    timeMinutes: 'min',
    distanceKM: 'km',
    remainingChargeCPT: '% remaining',
    spentChargePCT: '% spent',
    spentFuelLiters: 'L',
};

/**
 * Generate a human-readable label for a ranges history entry.
 * e.g. "10/20/30 min from Amsterdam" (one origin),
 *      "30 min from Amsterdam, Rotterdam" (two origins),
 *      "30 min from 3 origins" (more than two).
 *
 * @ignore
 */
export const makeRangesLabel = (budgets: Array<{ type: string; value: number }>, originNames: string[]): string => {
    const sorted = [...budgets].sort((a, b) => a.value - b.value);
    const budgetStr = sorted.map((b) => `${b.value} ${RANGE_BUDGET_UNITS[b.type] ?? b.type}`).join('/');
    const originStr =
        originNames.length === 1
            ? originNames[0]
            : originNames.length === 2
              ? originNames.join(', ')
              : `${originNames.length} origins`;
    return `${budgetStr} from ${originStr}`;
};
