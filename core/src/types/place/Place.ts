import { Feature, FeatureCollection, Point, Position } from "geojson";
import { PlaceDataSources } from "./PlaceDataSources";
import { HasLngLat } from "../Geometry";
import { POI, RelatedPOI } from "./poi/POI";
import { Connector } from "./poi/Connector";

/**
 * @group Place
 * @category Types
 */
export type GeographyType =
    | "Country"
    | "CountrySubdivision"
    | "CountrySecondarySubdivision"
    | "CountryTertiarySubdivision"
    | "Municipality"
    | "MunicipalitySubdivision"
    | "Neighbourhood"
    | "PostalCodeArea";

/**
 * Type of mapcode. Possible values:
 *
 * * Local: The shortest possible (and easiest to remember) mapcode.
 * Local mapcodes are especially useful when the user knows what territory the mapcode is in
 * (for example, when an application is designed to be used inside just one European country or US state).
 * Note that the code element of a Local mapcode is ambiguous when used without the territory element
 * e.g.,: the "4J.P2" mapcode can mean the Eiffel Tower location (48.858380, 2.294440)
 * (with the territory set to FRA), but also some place in Amsterdam-Noord, Netherlands (52.382184, 4.911021)
 * (with the territory set to NLD).
 * * International:
 * This mapcode is unambiguous. It is also the longest.
 * * Alternative:
 * Alternatives to Local mapcodes. Each Alternative mapcode points to slightly different coordinates
 * due to the way mapcodes are computed (see the mapcode documentation).
 * For example: the position from a response can be encoded as "5DM.WC" (51.759244, 19.448316) and the "VHJ.036"
 * (51.759245, 19.448264), which are close to each other, but not exactly the same place.
 * @group Place
 * @category Types
 */
export type MapcodeType = "Local" | "International" | "Alternative";
/**
 * @group Place
 * @category Types
 */
export type Mapcode = {
    /**
     * The type of the Mapcode.
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
     *
     * This field is not returned for an International mapcode.
     */
    territory?: string;
    /**
     * The mapcode without the territory element. It consists of two groups of letters and digits separated by a dot.
     * The code is using the same language and alphabet as the response.
     * The language parameter may be used to modify the language and alphabet of both the response and the code
     * (for example: Cyrillic for the language ru-RU).
     *
     * This field is not returned for the International mapcodes. Use fullMapcode instead.
     */
    code?: string;
};

/**
 * @group Place
 * @category Types
 */
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
     * The beginning lng-lat point of a street segment.
     */
    from: Position;
    /**
     * The end lng-lat point of a street segment.
     */
    to: Position;
};

/**
 * @group Place
 * @category Types
 */
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

/**
 * @group Place
 * @category Types
 */
export type PlaceType = "POI" | "Street" | "Geography" | "Point Address" | "Address Range" | "Cross Street";

/**
 * @group Place
 * @category Types
 */
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
     * {@link https://gist.github.com/tadast/8827699 ISO 3166-1 alpha-3} country code
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

/**
 * @group Place
 * @category Types
 */
export type CommonPlaceProps = {
    /**
     * Type of this place.
     */
    type: PlaceType;
    /**
     * The structured address for the result.
     */
    address: AddressProperties;
    /**
     * Type of geography entity,
     * Available values: Country | CountrySubdivision | CountrySecondarySubdivision | CountryTertiarySubdivision | Municipality | MunicipalitySubdivision | Neighbourhood | PostalCodeArea
     * Only present if type == Geography.
     */
    geographyType?: GeographyType[];
    /**
     * List of mapcode objects.
     */
    mapcodes?: Mapcode[];
    /**
     * A list of entry points of the POI (Points of Interest).
     */
    entryPoints?: EntryPoint[];
    /**
     * The address ranges on a street segment. Available only for results where the result type is equal to Address Range.
     */
    addressRanges?: AddressRanges;
    /**
     * Information about the Points of Interest in the result. Optional section. Only present if CommonPlaceProps.type == POI
     */
    poi?: POI;
    /**
     * List of related Points Of Interest.
     */
    relatedPois?: RelatedPOI[];
    /**
     * A list of chargingPark objects. Present only when the Points of Interest are of the Electric Vehicle Station type.
     */
    chargingPark?: {
        connectors: Connector[];
    };
    /**
     * An optional section. These are unique reference ids for use with the Additional Data service.
     */
    dataSources?: PlaceDataSources;
};

/**
 * @group Place
 * @category Types
 */
export type SideOfStreet = "L" | "R";

/**
 * @group Place
 * @category Types
 */
export type RevGeoAddressProps = CommonPlaceProps & {
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
    sideOfStreet?: SideOfStreet;
};

/**
 * @group Place
 * @category Types
 */
export type SearchPlaceProps = CommonPlaceProps & {
    /**
     * Information about the original data source of the result
     */
    info: string;
    /**
     * The score of the result.
     * A larger score means there is a probability that a result meeting the query criteria is higher.
     */
    score: number;
    /**
     * Unit: meters. This is the distance to an object if geobias was provided.
     */
    distance?: number;
};

/**
 * @group Place
 * @category Types
 */
export type Place<P extends CommonPlaceProps> = Omit<Feature<Point, P>, "id"> & {
    /**
     * Identifier for this place.
     * https://tools.ietf.org/html/rfc7946#section-3.2.
     */
    id: string;
};

/**
 * @group Place
 * @category Types
 */
export type Places<P extends CommonPlaceProps> = FeatureCollection<Point, P>;
