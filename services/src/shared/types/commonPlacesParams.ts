import type { GeographyType, HasLngLat, MapcodeType, View } from '@cet/maps-sdk-js/core';
import type { CommonServiceParams } from '../serviceTypes';

/**
 * Index representing the type of data to be searched.
 */
export type SearchIndexType = 'Geo' | 'PAD' | 'Addr' | 'Str' | 'XStr' | 'POI';

/**
 * Common parameters to services related to places services (search, geocoding, reverse geocoding).
 */
export type CommonPlacesParams<ApiRequest, ApiResponse> = CommonServiceParams<ApiRequest, ApiResponse> & {
    /**
     * Query string. Must be properly URL encoded (mandatory).
     */
    query: string;

    /**
     * Position where results should be biased.
     * Note: supplying a lat/lon without a radius will bias the search results to that area.
     * Latitude Values: min/max: -90 to +90
     * Longitude Values: min/max: -180 to +180
     */
    position?: HasLngLat;

    /**
     * The maximum number of responses that will be returned.
     * @default 10
     * Maximum value: 100
     */
    limit?: number;

    /**
     * Indexes for which extended postal codes should be included in the results.
     * Available values are described in Additional Information indexes abbreviation values section.
     * By default, extended postal codes are included for all indexes except Geo.
     * Extended postal code lists for geographies can be quite long, so they have to be explicitly requested when needed.
     * Ex. extendedPostalCodesFor=[PAD, Addr, POI]
     */
    extendedPostalCodesFor?: SearchIndexType[];

    /**
     * Enables the return of a comma-separated mapcodes list.
     * It can also filter the response to only show selected mapcode types. See Mapcodes in the response.
     * Values: One or more of:
     * * `Local`
     * * `International`
     * * `Alternative`
     *
     * A mapcode represents a specific location, to within a few meters.
     * Every location on Earth can be represented by a mapcode. Mapcodes are designed to be short,
     * easy to recognize, remember, and communicate. Visit the Mapcode project website for more information.
     */
    mapcodes?: MapcodeType[];

    /**
     * Geopolitical View. The context used to resolve the handling of disputed territories.
     *
     * Sets or returns the view option value to be used in the calls.
     * Can be one of "Unified", "AR", "IN", "PK", "IL, "MA", "RU", "TR" and "CN".
     * Legend:
     * Unified - International view
     * AR - Argentina
     * IN - India
     * PK - Pakistan
     * IL - Israel
     * MA - Morocco
     * RU - Russia
     * TR - Turkey
     * CN - China
     * @default None
     */
    view?: View;

    /**
     * A list of geography types which can be used to restrict the result to the Geography result of a specific type.
     * If geographyTypeSet is specified, only a Geography result with a proper entity type will be returned.
     * Available values: Country | CountrySubdivision | CountrySecondarySubdivision | CountryTertiarySubdivision | Municipality | MunicipalitySubdivision | Neighbourhood | PostalCodeArea
     */
    geographyTypes?: GeographyType[];
};
