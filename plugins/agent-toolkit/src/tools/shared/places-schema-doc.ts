/**
 * @module agent-toolkit-tools
 *
 * Compact TypeScript-like schema documentation for the `Place` / `Places`
 * shape, reused by every tool whose LLM-authored code reads or returns a
 * Places FeatureCollection (e.g. processPlaces, analysePlaces). Keep it
 * terse: it becomes part of the tool description prompt on every call.
 */

import type { FeatureFlags } from '../../types';

const EXPERIMENTAL_AREA_FIELDS_DOC =
    '    // Experimental — populated only when `experimentalSearch` is on and the place came from\n' +
    '    // the exploration-search backend (DE / NL / FR area-tag pipeline).\n' +
    '    areaId?: string;       // id of the surrounding municipality polygon\n' +
    '    areaCountry?: string;  // ISO2 country of the municipality polygon\n' +
    '    areaTags?: string[];   // e.g. "coastal", "walkable", "transit_connected"\n';

/**
 * Build the Place/Places schema doc embedded in tool descriptions for sandboxed
 * code. When `experimentalSearch` is true, the documented shape also includes
 * the exploration-search-only `areaId` / `areaCountry` / `areaTags` fields.
 *
 * @ignore
 */
export const buildPlacesSchemaDoc = (flags: FeatureFlags): string =>
    'Schema (the full `Place` / `Places` shape you can rely on):\n' +
    '```ts\n' +
    'type Places = { type: "FeatureCollection"; features: Place[]; bbox?: [minLng, minLat, maxLng, maxLat] };\n' +
    'type Place = {\n' +
    '  type: "Feature";\n' +
    '  id: string;\n' +
    '  geometry: { type: "Point"; coordinates: [lng, lat] };\n' +
    '  bbox?: [minLng, minLat, maxLng, maxLat]; // present for areas (Street, Geography, ...)\n' +
    '  properties: {\n' +
    '    type: "POI" | "Street" | "Geography" | "Point Address" | "Address Range" | "Cross Street";\n' +
    '    address: {\n' +
    '      freeformAddress: string;\n' +
    '      streetNumber?: string; streetName?: string;\n' +
    '      municipality?: string; municipalitySubdivision?: string;\n' +
    '      countrySubdivision?: string; countrySubdivisionName?: string;\n' +
    '      countrySecondarySubdivision?: string; countryTertiarySubdivision?: string;\n' +
    '      postalCode?: string; extendedPostalCode?: string;\n' +
    '      countryCode?: string; countryCodeISO3?: string; country?: string;\n' +
    '      localName?: string;\n' +
    '    };\n' +
    '    poi?: { // present when type === "POI"\n' +
    '      name: string; phone?: string; url?: string;\n' +
    '      brands?: string[];\n' +
    '      categories: string[]; // POICategory enum values, e.g. "RESTAURANT", "CAFE_PUB", "GAS_STATION", "HOTEL_MOTEL", "ELECTRIC_VEHICLE_STATION"\n' +
    '      localizedCategories: string[]; // human-readable, language-sensitive\n' +
    '      openingHours?: { mode: string; timeRanges: Array<{ startTime: {date,hour,minute}, endTime: {date,hour,minute} }>; alwaysOpenThisPeriod: boolean };\n' +
    '      timeZone?: { name: string };\n' +
    '    };\n' +
    '    // Search results also carry:\n' +
    '    score?: number;     // relevance score (higher = better)\n' +
    '    distance?: number;  // meters from geoBias, when one was provided\n' +
    '    info?: string;\n' +
    '    // Geography results also carry:\n' +
    '    geographyType?: Array<"Country"|"CountrySubdivision"|"CountrySecondarySubdivision"|"CountryTertiarySubdivision"|"Municipality"|"MunicipalitySubdivision"|"Neighbourhood"|"PostalCodeArea">;\n' +
    (flags.experimentalSearch ? EXPERIMENTAL_AREA_FIELDS_DOC : '') +
    '    // Misc optional fields: mapcodes, entryPoints, addressRanges, relatedPois, chargingPark, dataSources.\n' +
    '  };\n' +
    '};\n' +
    '```\n' +
    'Notes: coordinates are always [lng, lat] (GeoJSON order); fields marked `?` may be undefined — guard with optional chaining before use.';

/**
 * Default-flag (`experimentalSearch: false`) Places schema doc — preserved as a
 * named constant so non-flag-aware tools keep working.
 *
 * @ignore
 */
export const PLACES_SCHEMA_DOC = buildPlacesSchemaDoc({});
