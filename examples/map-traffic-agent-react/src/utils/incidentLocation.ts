import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';

export type Coord = GeoJSON.Position;
export type IncidentAddress = { from?: string; to?: string };

/** The slice of a reverse-geocode result this module reads. */
export type AddressedPlace = { properties: { address: { streetName?: string; freeformAddress: string } } };
export type ReverseGeocodeFn = (params: { position: Coord }) => Promise<AddressedPlace>;

/** An incident already has a usable label when it carries a road number or a "from" street. */
export const incidentNeedsAddress = (incident: TrafficIncident): boolean => {
    const p = incident.properties;
    return !p.roadNumbers?.[0] && !p.from;
};

/** Start (and, for a line, end) coordinate of an incident geometry. */
export const incidentEndpoints = (geometry: TrafficIncident['geometry']): { start?: Coord; end?: Coord } => {
    if (geometry.type === 'Point') return { start: geometry.coordinates };
    if (geometry.type === 'LineString') {
        const coords = geometry.coordinates;
        return { start: coords[0], end: coords.length > 1 ? coords[coords.length - 1] : undefined };
    }
    return {};
};

/** Cache/dedupe key for a coordinate, rounded to ~11 m so near-identical points share a lookup. */
export const coordKey = (coord: Coord): string => `${coord[0].toFixed(4)},${coord[1].toFixed(4)}`;

/** Prefer the street name; fall back to the full formatted address. */
export const addressLabel = (place: AddressedPlace): string =>
    place.properties.address.streetName ?? place.properties.address.freeformAddress;

/**
 * Human label for an incident's extent. Collapses identical endpoints to a single name
 * ("Ringweg-West → Ringweg-West" → "Ringweg-West") and degrades to "—" when nothing is known.
 */
export const formatEndpoints = (from?: string, to?: string): string => {
    if (from && to) return from === to ? from : `${from} → ${to}`;
    return from ?? to ?? '—';
};

/**
 * Builds a coordinate → label resolver backed by the given reverse-geocoder, memoising each
 * rounded coordinate (including failures) so repeated/nearby lookups hit the cache. The
 * reverse-geocoder is injected so the resolver is unit-testable without the network.
 */
export const createCoordResolver = (
    reverseGeocode: ReverseGeocodeFn,
): ((coord?: Coord) => Promise<string | undefined>) => {
    const cache = new Map<string, string | null>();
    return async (coord) => {
        if (!coord) return undefined;
        const key = coordKey(coord);
        const cached = cache.get(key);
        if (cached !== undefined) return cached ?? undefined;
        try {
            const label = addressLabel(await reverseGeocode({ position: coord }));
            cache.set(key, label ?? null);
            return label ?? undefined;
        } catch {
            cache.set(key, null);
            return undefined;
        }
    };
};
