import type { Point } from 'geojson';

/** Orbis Reverse Geocoding v2 top-level result type.
 * (geocode v2 also has `'intersection'`; reverse geocoding does not.)
 * @ignore
 */
export type ReverseGeocodingResultTypeAPI = 'address' | 'street' | 'area';

/** Orbis Reverse Geocoding v2 area sub-type.
 * @ignore
 */
export type ReverseGeocodingAreaTypeAPI =
    | 'country'
    | 'countrySubdivision'
    | 'countrySecondarySubdivision'
    | 'countryTertiarySubdivision'
    | 'municipality'
    | 'municipalitySubdivision'
    | 'municipalitySecondarySubdivision'
    | 'neighborhood'
    | 'postalCode';

/**
 * Address object as returned by the Orbis Reverse Geocoding v2 API.
 * @ignore
 */
export type ReverseGeocodingAddressAPI = {
    houseNumber?: string;
    street?: string;
    municipalitySubdivision?: string;
    municipalitySecondarySubdivision?: string;
    neighborhood?: string;
    municipality?: string;
    countrySecondarySubdivision?: string;
    countryTertiarySubdivision?: string;
    countrySubdivision?: string;
    countrySubdivisionCodeIso?: string;
    postalCode?: string;
    postalName?: string;
    extendedPostalCode?: string;
    countryCodeIso2?: string;
    country?: string;
    /** Road numbers of the street (reverse geocoding only; not returned by geocode v2). */
    routeNumbers?: string[];
};

/**
 * A single result element from the Orbis Reverse Geocoding v2 API.
 * @ignore
 */
export type ReverseGeocodingResultAPI = {
    /** Unique identifier of the result. It can change between new data releases. */
    id: string;
    /** Type of result: `address`, `street`, or `area`. */
    type: ReverseGeocodingResultTypeAPI;
    /** Localized display title for the result. */
    title: string;
    /** Sub-type of an `area` result; present only when `type` is `area`. */
    areaType?: ReverseGeocodingAreaTypeAPI;
    /** The structured address for the result. */
    address: ReverseGeocodingAddressAPI;
    /** The position of the result, in GeoJSON format. */
    position: Point;
    /** List of access points (e.g. building entrances) of the location, in GeoJSON format. */
    accessPoints?: Array<{ position: Point }>;
};

/**
 * @ignore
 */
export type ReverseGeocodingResponseAPI = {
    results: ReverseGeocodingResultAPI[];
};
