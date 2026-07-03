/**
 * @module agent-toolkit-tools
 *
 * Compact schema documentation for the `Place` properties shape, reused by
 * every tool whose LLM-authored code reads or returns a Places
 * FeatureCollection (`processData`, `analyseData`) — injected per entry as
 * `placesByEntry[id]`. Only the non-obvious
 * (non-GeoJSON-standard) bits are spelled out — the wrapping `Feature` /
 * `FeatureCollection` shape is assumed known.
 */

import type { FeatureFlags } from '../../types';

const EXPERIMENTAL_AREA_FIELDS_DOC =
    '  // Experimental — populated only when `experimentalSearch` is on and the place came from\n' +
    '  // the exploration-search backend (DE / NL / FR area-tag pipeline).\n' +
    '  areaId?: string;       // id of the surrounding small-area polygon (few km², not a whole municipality)\n' +
    '  areaCountry?: string;  // ISO2 country of the area polygon\n' +
    '  areaTags?: string[];   // e.g. "coastal", "walkable", "transit_connected"\n';

/**
 * Build the Place properties schema doc embedded in tool descriptions for
 * sandboxed code. `Places` is a FeatureCollection of Point Features; only the
 * `properties` shape (the TomTom-specific bit) is documented here.
 *
 * @ignore
 */
export const buildPlacesSchemaDoc = (flags: FeatureFlags): string =>
    'Each `placesByEntry[id]` is a FeatureCollection of Point Features. `Place.properties` shape:\n' +
    '```ts\n' +
    'type PlaceProperties = {\n' +
    '  type: "POI" | "Street" | "Geography" | "Point Address" | "Address Range" | "Cross Street";\n' +
    '  address: {\n' +
    '    freeformAddress: string;\n' +
    '    streetNumber?: string; streetName?: string;\n' +
    '    municipality?: string; municipalitySubdivision?: string;\n' +
    '    countrySubdivision?: string; countrySubdivisionName?: string;\n' +
    '    countrySecondarySubdivision?: string; countryTertiarySubdivision?: string;\n' +
    '    postalCode?: string; extendedPostalCode?: string;\n' +
    '    countryCode?: string; countryCodeISO3?: string; country?: string;\n' +
    '    localName?: string;\n' +
    '  };\n' +
    '  poi?: { // when type === "POI"\n' +
    '    name: string; phone?: string; url?: string;\n' +
    '    brands?: string[];\n' +
    '    categories: string[];           // POICategory enum, e.g. "RESTAURANT", "CAFE_PUB", "GAS_STATION", "HOTEL_MOTEL", "ELECTRIC_VEHICLE_STATION"\n' +
    '    localizedCategories: string[];  // language-sensitive\n' +
    '    openingHours?: { mode: string; timeRanges: Array<{ startTime: {date,hour,minute}, endTime: {date,hour,minute} }>; alwaysOpenThisPeriod: boolean };\n' +
    '    timeZone?: { name: string };\n' +
    '  };\n' +
    '  // Search hits also carry:\n' +
    '  score?: number;     // relevance (higher = better)\n' +
    '  distance?: number;  // meters from geoBias, when provided\n' +
    '  info?: string;\n' +
    '  // Geography hits also carry:\n' +
    '  geographyType?: Array<"Country"|"CountrySubdivision"|"CountrySecondarySubdivision"|"CountryTertiarySubdivision"|"Municipality"|"MunicipalitySubdivision"|"Neighbourhood"|"PostalCodeArea">;\n' +
    (flags.experimentalSearch ? EXPERIMENTAL_AREA_FIELDS_DOC : '') +
    '  // Optional: mapcodes, entryPoints, addressRanges, relatedPois, chargingPark, dataSources.\n' +
    '};\n' +
    '```\n' +
    'Areas (Street, Geography, …) also carry `feature.bbox`. Coordinates are `[lng, lat]`; guard `?` fields with `?.` / `??`. ' +
    'The fields above describe places you READ from input. When your output is a filter / subset / merge of the input places, ' +
    'return the source features as-is (spread them: `{ ...place }`, or `{ ...place, properties: { ...place.properties } }` when editing) ' +
    'so their `id` and all their fields ride through — carrying real fields forward is NOT the same as inventing them, keep them. ' +
    'Only when you RETURN a freshly computed point (one with no source place behind it) are just `type`, a display name at the schema path ' +
    'for that type (`poi.name` for POIs, `address.freeformAddress` for streets / intersections (`Cross Street`) / addresses), and Point ' +
    'coordinates required. For those computed points do NOT invent a flat `properties.name` (it is dropped, so the name would be lost), and ' +
    'do NOT fabricate the search / POI extras (`categories`, `localizedCategories`, `score`, `distance`, `info`, …) — a computed point has no ' +
    'such data behind it.';

/**
 * Default-flag (`experimentalSearch: false`) Places schema doc — preserved as a
 * named constant so non-flag-aware tools keep working.
 *
 * @ignore
 */
export const PLACES_SCHEMA_DOC = buildPlacesSchemaDoc({});
