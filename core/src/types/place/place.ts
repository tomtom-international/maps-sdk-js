import type { Feature, Point, Position } from 'geojson';
import type { BBox, ChargingPark, FeatureCollectionWithProperties, PlaceDataSources, POI, RelatedPOI } from '../';

/**
 * @group Place
 */
export const geographyTypes = [
    'Country',
    'CountrySubdivision',
    'CountrySecondarySubdivision',
    'CountryTertiarySubdivision',
    'Municipality',
    'MunicipalitySubdivision',
    'Neighbourhood',
    'PostalCodeArea',
] as const;

/**
 * Type of geographic administrative entity.
 *
 * Defines the hierarchical level of an administrative area or postal region.
 *
 * @remarks
 * Geographic hierarchy from largest to smallest:
 * - `Country`: Sovereign nation
 * - `CountrySubdivision`: State, province, or first-level admin division
 * - `CountrySecondarySubdivision`: County or second-level admin division
 * - `CountryTertiarySubdivision`: Third-level admin division
 * - `Municipality`: City or town
 * - `MunicipalitySubdivision`: District within a city
 * - `Neighbourhood`: Named neighborhood or area within a city
 * - `PostalCodeArea`: Area defined by postal/ZIP code
 *
 * @example
 * ```typescript
 * const geographyType: GeographyType = 'Municipality';  // City level
 * ```
 *
 * @group Place
 */
export type GeographyType = (typeof geographyTypes)[number];

/**
 * Type of mapcode.
 *
 * Mapcodes are short location codes that can be used as an alternative to coordinates.
 *
 * @remarks
 * - `Local`: Shortest mapcode, requires territory context (e.g., "4J.P2" for Eiffel Tower in FRA)
 * - `International`: Unambiguous worldwide, no territory needed but longer
 * - `Alternative`: Alternative local encoding pointing to slightly different coordinates
 *
 * @see [Mapcode documentation](https://www.mapcode.com)
 *
 * @group Place
 */
export type MapcodeType = 'Local' | 'International' | 'Alternative';

/**
 * Mapcode representation of a location.
 *
 * A mapcode is a short, memorable code representing a geographic location,
 * designed as an alternative to coordinates.
 *
 * @example
 * ```typescript
 * // Local mapcode (requires territory)
 * const localMapcode: Mapcode = {
 *   type: 'Local',
 *   fullMapcode: 'NLD 4J.P2',
 *   territory: 'NLD',
 *   code: '4J.P2'
 * };
 *
 * // International mapcode (no territory needed)
 * const intlMapcode: Mapcode = {
 *   type: 'International',
 *   fullMapcode: 'VHXGB.4J9W',
 *   code: 'VHXGB.4J9W'
 * };
 * ```
 *
 * @group Place
 */
export type Mapcode = {
    /**
     * The type of mapcode (Local, International, or Alternative).
     */
    type: MapcodeType;
    /**
     * Complete mapcode including territory if applicable.
     *
     * Always unambiguous. Format: "TERRITORY CODE" for local, just "CODE" for international.
     */
    fullMapcode: string;
    /**
     * Territory code for local mapcodes.
     *
     * Present only for Local and Alternative mapcodes. Uses Latin alphabet.
     * Not present for International mapcodes.
     */
    territory?: string;
    /**
     * The mapcode without territory.
     *
     * Two groups of letters/digits separated by a dot (e.g., "4J.P2").
     * Uses the response language/alphabet. Not present for International mapcodes.
     */
    code?: string;
};

/**
 * Address range information for a street segment.
 *
 * Used for Address Range type results to indicate ranges of addresses
 * along a street segment.
 *
 * @group Place
 */
export type AddressRanges = {
    /**
     * Address range on the left side of the street.
     *
     * Looking from the 'from' point toward the 'to' point.
     */
    rangeLeft: string;
    /**
     * Address range on the right side of the street.
     *
     * Looking from the 'from' point toward the 'to' point.
     */
    rangeRight: string;
    /**
     * Starting coordinates of the street segment [longitude, latitude].
     */
    from: Position;
    /**
     * Ending coordinates of the street segment [longitude, latitude].
     */
    to: Position;
};

/**
 * Type of entry point for a place.
 *
 * @remarks
 * - `main`: Primary entrance (at most one per place)
 * - `minor`: Secondary or alternative entrance (can have multiple)
 *
 * @group Place
 */
export type EntryPointType = 'main' | 'minor';

/**
 * Entry point (entrance) for a place.
 *
 * Represents a physical access point to a building or facility,
 * useful for routing to ensure users are directed to the correct entrance.
 *
 * @example
 * ```typescript
 * const entryPoint: EntryPoint = {
 *   type: 'main',
 *   functions: ['FrontDoor'],
 *   position: [4.9041, 52.3676]
 * };
 * ```
 *
 * @group Place
 */
export type EntryPoint = {
    /**
     * Type of entry point (main or minor).
     */
    type: EntryPointType;
    /**
     * Functional description of the entry point.
     *
     * Examples: 'FrontDoor', 'ServiceEntrance', 'ParkingGarage'
     */
    functions?: string[];
    /**
     * Geographic coordinates of the entry point [longitude, latitude].
     */
    position: Position;
};

/**
 * @group Place
 */
export const placeTypes = ['POI', 'Street', 'Geography', 'Point Address', 'Address Range', 'Cross Street'] as const;

/**
 * Type of place result.
 *
 * Categorizes the kind of location returned by search or geocoding services.
 *
 * @remarks
 * - `POI`: Point of Interest (business, landmark, facility)
 * - `Street`: A named street
 * - `Geography`: Administrative area (city, state, country, etc.)
 * - `Point Address`: Specific street address with building number
 * - `Address Range`: Range of addresses along a street segment
 * - `Cross Street`: Intersection of two streets
 *
 * @example
 * ```typescript
 * const placeType: PlaceType = 'POI';
 * ```
 *
 * @group Place
 */
export type PlaceType = (typeof placeTypes)[number];

/**
 * Structured address components for a place.
 *
 * Provides hierarchical address information from building number up to country level.
 * Not all components are present for every place; availability depends on the location
 * and data coverage.
 *
 * @example
 * ```typescript
 * const address: AddressProperties = {
 *   freeformAddress: '1600 Pennsylvania Avenue NW, Washington, DC 20500, USA',
 *   streetNumber: '1600',
 *   streetName: 'Pennsylvania Avenue NW',
 *   municipality: 'Washington',
 *   countrySubdivision: 'DC',
 *   postalCode: '20500',
 *   countryCode: 'US',
 *   country: 'United States',
 *   countryCodeISO3: 'USA'
 * };
 * ```
 *
 * @group Place
 */
export type AddressProperties = {
    /**
     * Complete formatted address string.
     *
     * Follows the formatting conventions of the result's country of origin.
     * For countries, this is the full country name.
     */
    freeformAddress: string;

    /**
     * Building or house number on the street.
     */
    streetNumber?: string;

    /**
     * Street name without the building number.
     */
    streetName?: string;

    /**
     * Subdivision of a municipality (sub-city or super-city area).
     */
    municipalitySubdivision?: string;

    /**
     * City or town name.
     */
    municipality?: string;

    /**
     * County or second-level administrative subdivision.
     */
    countrySecondarySubdivision?: string;

    /**
     * Named area or third-level administrative subdivision.
     */
    countryTertiarySubdivision?: string;

    /**
     * State or province (first-level administrative subdivision).
     */
    countrySubdivision?: string;

    /**
     * Postal code or ZIP code.
     */
    postalCode?: string;

    /**
     * Extended postal code.
     *
     * Availability depends on region. More precise than standard postal code.
     */
    extendedPostalCode?: string;

    /**
     * Two-letter ISO 3166-1 alpha-2 country code.
     *
     * Examples: 'US', 'GB', 'NL', 'DE'
     */
    countryCode?: string;

    /**
     * Full country name.
     */
    country?: string;

    /**
     * Three-letter ISO 3166-1 alpha-3 country code.
     *
     * Examples: 'USA', 'GBR', 'NLD', 'DEU'
     *
     * @see [ISO 3166-1 alpha-3 codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
     */
    countryCodeISO3?: string;

    /**
     * Full name of the first-level administrative subdivision.
     *
     * Present when countrySubdivision is abbreviated. Supported for USA, Canada, and Great Britain.
     * Example: "California" when countrySubdivision is "CA"
     */
    countrySubdivisionName?: string;

    /**
     * Local area or locality name.
     *
     * Represents a named geographic area that groups addressable objects
     * without being an official administrative unit.
     */
    localName?: string;
};

/**
 * Common properties shared by all place types.
 *
 * Provides the base structure for place information including address,
 * entry points, POI details, and data source references.
 *
 * @group Place
 */
export type CommonPlaceProps = {
    /**
     * Type classification of this place.
     */
    type: PlaceType;
    /**
     * Structured address components.
     */
    address: AddressProperties;
    /**
     * Geographic entity type(s).
     *
     * Present only when type === 'Geography'.
     * Array can contain multiple types for areas with multiple administrative roles.
     */
    geographyType?: GeographyType[];
    /**
     * Mapcode representations of this location.
     *
     * Alternative location codes that can be used instead of coordinates.
     */
    mapcodes?: Mapcode[];
    /**
     * Physical entry points (entrances) to the place.
     *
     * Useful for navigation to direct users to the correct entrance.
     */
    entryPoints?: EntryPoint[];
    /**
     * Address ranges along a street segment.
     *
     * Present only when type === 'Address Range'.
     */
    addressRanges?: AddressRanges;
    /**
     * Point of Interest information.
     *
     * Present only when type === 'POI'. Contains business details, categories, hours, etc.
     */
    poi?: POI;
    /**
     * Related Points of Interest.
     *
     * Parent or child POIs (e.g., stores within a mall, a mall containing stores).
     */
    relatedPois?: RelatedPOI[];
    /**
     * EV charging infrastructure information.
     *
     * Present only for Electric Vehicle charging station POIs.
     */
    chargingPark?: ChargingPark;
    /**
     * References to additional data sources.
     *
     * IDs for fetching more detailed information from other services
     * (geometry, availability, POI details).
     */
    dataSources?: PlaceDataSources;
};

/**
 * Side of the street indicator.
 *
 * @remarks
 * - `L`: Left side
 * - `R`: Right side
 *
 * @group Place
 */
export type SideOfStreet = 'L' | 'R';

/**
 * Properties for reverse geocoded places.
 *
 * Extends common place properties with reverse geocoding-specific information
 * like the original query position and address interpolation details.
 *
 * @group Place
 */
export type RevGeoAddressProps = CommonPlaceProps & {
    /**
     * Original coordinates used in the reverse geocoding query [longitude, latitude].
     */
    originalPosition: Position;
    /**
     * Offset position coordinates for address interpolation.
     *
     * Present when a street number was specified in the query.
     * Represents the interpolated position of the specific address number.
     */
    offsetPosition?: Position;
    /**
     * Which side of the street the address is located on.
     *
     * Present only when a street number was specified in the query.
     */
    sideOfStreet?: SideOfStreet;
};

/**
 * Properties for search result places.
 *
 * Extends common place properties with search-specific information
 * like relevance scores and distances.
 *
 * @group Place
 */
export type SearchPlaceProps = CommonPlaceProps & {
    /**
     * Information about the original data source.
     *
     * Attribution or source identification for the result.
     */
    info?: string;
    /**
     * Relevance score for this search result.
     *
     * Higher scores indicate better match to the query criteria.
     * Used for ranking search results.
     */
    score?: number;
    /**
     * Distance in meters to this result from the bias position.
     *
     * Present only when geoBias (position bias) was provided in the search.
     */
    distance?: number;
};

/**
 * GeoJSON Feature representing a place.
 *
 * A place is a Point feature with comprehensive location information
 * including address, coordinates, and metadata.
 *
 * @typeParam P - Type of the place properties (defaults to CommonPlaceProps)
 *
 * @example
 * ```typescript
 * const place: Place<SearchPlaceProps> = {
 *   type: 'Feature',
 *   id: 'place-123',
 *   geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
 *   properties: {
 *     type: 'POI',
 *     address: { freeformAddress: 'Dam, Amsterdam', ... },
 *     poi: { name: 'Dam Square', ... },
 *     score: 0.95
 *   }
 * };
 * ```
 *
 * @group Place
 */
export type Place<P extends CommonPlaceProps = CommonPlaceProps> = Omit<Feature<Point, P>, 'id' | 'bbox'> & {
    /**
     * Unique identifier for this place.
     *
     * Required string ID (stricter than GeoJSON Feature's optional id).
     */
    id: string;

    /**
     * Bounding box that contains the place.
     *
     * * Typically significant for places covering wider areas.
     */
    bbox?: BBox;
};

/**
 * GeoJSON FeatureCollection containing multiple places.
 *
 * Collection of place results from search or geocoding operations.
 *
 * @typeParam P - Type of individual place properties (defaults to CommonPlaceProps)
 * @typeParam FeatureCollectionProps - Type of collection-level properties
 *
 * @example
 * ```typescript
 * const places: Places<SearchPlaceProps> = {
 *   type: 'FeatureCollection',
 *   features: [
 *     { id: '1', type: 'Feature', geometry: {...}, properties: {...} },
 *     { id: '2', type: 'Feature', geometry: {...}, properties: {...} }
 *   ]
 * };
 * ```
 *
 * @group Place
 */
export type Places<P extends CommonPlaceProps = CommonPlaceProps, FeatureCollectionProps = unknown> = Omit<
    FeatureCollectionWithProperties<Point, P, FeatureCollectionProps>,
    'features' | 'bbox'
> & {
    /**
     * Array of place features.
     * * Each place has a required string ID.
     */
    features: Place<P>[];

    /**
     * Bounding box that contains all the places, including their bounding boxes.
     * * Only included if any places are present.
     */
    bbox?: BBox;
};
