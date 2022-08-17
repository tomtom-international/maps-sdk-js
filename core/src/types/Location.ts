import { Feature, FeatureCollection, Point, Polygon, Position } from "geojson";
import { LocationDataSources } from "./LocationDataSources";
import { HasLngLat } from "./Geometry";

export type GeographyType =
    | "Country"
    | "CountrySubdivision"
    | "CountrySecondarySubdivision"
    | "CountryTertiarySubdivision"
    | "Municipality"
    | "MunicipalitySubdivision"
    | "Neighbourhood"
    | "PostalCodeArea";

export type MapcodeType = "Local" | "International" | "Alternative";

export type MapCodes = {
    /**
     * Type of mapcode
     */
    type: MapcodeType;
    /**
     * The full form of a mapcode (territory + code). It is always unambiguous.
     * The territory element is always in the Latin alphabet.
     * In an International mapcode, the territory part is empty.
     */
    fullMapcode: string;
    /**
     * The territory element of the mapcode. The territory element is always in the Latin alphabet.
     */
    territory: string;
    /**
     * The mapcode without the territory element. It consists of two groups of letters and digits separated by a dot.
     * The code is using the same language and alphabet as the response.
     * The language parameter may be used to modify the language and alphabet of both the response and the code
     * (for example: Cyrillic for the language ru-RU).
     * This field is not returned for the International mapcodes. Use fullMapcode instead.
     */
    code: string;
};

export type AddressRanges = {
    /**
     * An address range on the left side of a street segment (assuming looking from the "from" end toward the "to" end).
     */
    rangeLeft: string;
    /**
     * An address range on the right side of a street segment (assuming looking from the "from" end toward the "to" end).
     */
    rangeRight: string;
    /**
     * The beginning point of a street segment: Latitude, Longitude
     */
    from: HasLngLat;
    /**
     * The end point of a street segment: Latitude, Longitude
     */
    to: HasLngLat;
};

export type EntryPoint = {
    /**
     * The main entry point.
     */
    type: "main" | "minor";
    /**
     * If present, represents the type of access for the POI.
     * Example: FrontDoor
     */
    functions?: string[];
    /**
     * Position of the entry point.
     */
    position: HasLngLat;
};

export type CommonLocationProps = {
    /**
     * Type of result.
     */
    type: LocationType;
    /**
     * The structured address for the result.
     */
    address: AddressProperties;
    /**
     * the non-stable unique id for this result.
     */
    id?: string;
    /**
     * The score of the result.
     * A larger score means there is a probability that a result meeting the query criteria is higher.
     */
    score?: number;
    /**
     * Unit: meters. This is the distance to an object if geobias was provided.
     */
    distance?: number;
    /**
     * Type of geography entity,
     * Available values: Country | CountrySubdivision | CountrySecondarySubdivision | CountryTertiarySubdivision | Municipality | MunicipalitySubdivision | Neighbourhood | PostalCodeArea
     * Only present if type == Geography.
     */
    geographyType?: GeographyType[];
    /**
     * List of mapcode objects.
     */
    mapcodes?: MapCodes[];
    /**
     * A viewport which can be used to display the result on a map.
     */
    viewport?: Polygon;
    /**
     * A list of entry points of the POI (Points of Interest).
     */
    entryPoints?: EntryPoint[];
    /**
     * The address ranges on a street segment. Available only for results where the result type is equal to Address Range.
     */
    addressRanges?: AddressRanges;
    /**
     * A bounding box which can be used to display the result on a map defined by minimum and maximum longitudes and latitudes.
     */
    boundingBox?: Polygon;
    /**
     * An optional section. These are unique reference ids for use with the Additional Data service.
     */
    dataSources?: LocationDataSources;
};

export type RevGeoAddressProps = CommonLocationProps & {
    address: AddressProperties & {
        /**
         * Original lng-lat coordinates of the reverse geocoded location.
         */
        originalPosition: Position;
        /**
         * The offset position coordinates of the location. Might only be returned if number parameter was defined.
         * TODO: clarify behaviour and usage and improve documentation. During tests this doesn't seem an offset but rather absolute coords.
         */
        offsetPosition?: Position;
        /**
         * The left or right side of the street location. This is returned only when the number parameter was defined.
         */
        sideOfStreet?: "L" | "R";
    };
};

export type AddressProperties = {
    /**
     * The building number on the street.
     */
    streetNumber?: string;

    /**
     * The street name.
     */
    streetName?: string;

    /**
     * Sub / Super City
     */
    municipalitySubdivision?: string;

    /**
     * City / Town
     */
    municipality?: string;

    /**
     * County
     */
    countrySecondarySubdivision?: string;

    /**
     * Named Area
     */
    countryTertiarySubdivision?: string;

    /**
     * State or Province
     */
    countrySubdivision?: string;

    /**
     * Postal Code / Zip Code
     */
    postalCode?: string;

    /**
     * Extended postal code (availability dependent on region)
     */
    extendedPostalCode?: string;

    /**
     * Country (Note: This is a two-letter code, not a country name.)
     */
    countryCode?: string;

    /**
     * Country name
     */
    country?: string;

    /**
     * ISO alpha-3 country code
     */
    countryCodeISO3?: string;

    /**
     * An address line formatted according to formatting
     * rules of a result's country of origin, or in case
     * of countries its full country name.
     */
    freeformAddress?: string;

    /**
     * A full name of a first level of country administrative hierarchy.
     * This field appears only in case countrySubdivision is presented in an abbreviated form.
     * Supported only for USA, Canada and Great Britain.
     */
    countrySubdivisionName?: string;

    /**
     * An address component which represents the name of a geographic area or locality that groups a number of addressable objects for addressing purposes, without being an administrative unit.
     */
    localName?: string;
};

export type LocationType = "POI" | "Street" | "Geography" | "Point Address" | "Address Range" | "Cross Street";

export type Location<P extends CommonLocationProps> = Feature<Point, P>;
export type Locations<P extends CommonLocationProps> = FeatureCollection<Point, P>;
