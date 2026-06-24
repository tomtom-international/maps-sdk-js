/**
 * @module agent-toolkit-tools
 *
 * Area geocoding primitive: resolve a query to a *containing* administrative area (the "where" of
 * `within`-mode scope). Lives in `shared/` so the where-resolution layer (`resolve-where`,
 * `tool-state-where-context`) can depend on it without a `shared → services → shared` cycle.
 * Place-entity ("what") resolution is a separate concern — see `locate-places.ts`.
 */

import { type GeographyType, type Place } from '@tomtom-org/maps-sdk/core';
import { geocode } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';

/**
 * Administrative-AREA geography types accepted when resolving a query to a *containing area*
 * (`within` mode). Restricting the geocode to these (via `entityTypeSet`) is what stops streets and
 * POIs from drowning the area — e.g. "De Pijp" / "Westminster" geocode to Streets at rank 0 without
 * it. Excludes `Country` (too coarse) and `PostalCodeArea` (homonym noise — "A10" → a Kazakh
 * postcode).
 */
export const AREA_GEOGRAPHY_TYPES: GeographyType[] = [
    'CountrySubdivision',
    'CountrySecondarySubdivision',
    'Municipality',
    'MunicipalitySubdivision',
    'Neighbourhood',
];

/**
 * Geocodes `query` restricted to administrative AREA geographies (not streets/POIs), biased toward
 * `bias` (the map centre). Because `geographyTypes` filters to areas, every result carries a
 * `boundingBox`. Callers choose among the candidates (e.g. the one nearest the current view) — a
 * centre bias is used rather than a hard viewport-bbox filter so out-of-view areas still resolve.
 */
export const geocodeAreas = async (query: string, opts: { bias?: Position; limit?: number } = {}): Promise<Place[]> => {
    const result = await geocode({
        query,
        limit: opts.limit ?? 6,
        geographyTypes: AREA_GEOGRAPHY_TYPES,
        ...(opts.bias ? { position: opts.bias } : {}),
    });
    return result.features;
};
