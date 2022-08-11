import { FeatureCollection, Point, Polygon } from "geojson";
import { AddressProperties, DataSources, HasLngLat, LocationType, View } from "core";
import { CommonServiceParams, ServiceTemplate } from "../shared/ServiceTypes";
import { EntityType, MapcodeType } from "../revgeo/ReverseGeocodingParams";
import { Summary, LatLon, EntryPoint, IndexTypesAbbreviation } from "../shared/types/APIResponseTypes";

export type GeocodingIndexTypesAbbreviation = Exclude<IndexTypesAbbreviation, "POI">;

export type GeocodingParams = CommonServiceParams & {
    /**
     * Query string. Must be properly URL encoded (mandatory).
     */
    query: string;

    /**
     * If the typeahead flag is set, the query will be interpreted as a partial input,
     * and the search will enter predictive mode.
     * @default false
     */
    typeahead?: boolean;

    /**
     * The maximum number of responses that will be returned.
     * @default 10
     * Maximum value: 100
     */
    limit?: number;

    /**
     * The starting offset of the returned results within the full result set.
     * The total number of results can be no more than 2000
     * If you want to receive all the results, you need to limit the number of results by using for example the radius parameter.
     * @default 0
     * Maximum value: 1900
     */
    offset?: number;

    /**
     * Position where results should be biased.
     * Note: supplying a lat/lon without a radius will bias the search results to that area.
     */
    position?: HasLngLat;

    /**
     * Country code or List of country codes in ISO 3166-1 alpha-2 or alpha-3 code formats
     * This will limit the search to the specified countries.
     * The choice of view may restrict which countries are available.
     * Visit the Search API Market Coverage page for a list of all the countries supported by the Search engine.
     */
    countrySet?: string[];

    /**
     * If radius and position are set, the results will be constrained to the defined area.
     * The radius parameter is specified in meters.
     */
    radius?: number;

    /**
     * Top-left position of the bounding box.
     *
     * Important note: Point-Radius parameters and Bounding Box parameters are mutually exclusive.
     * Point-Radius parameters take precedence when both are passed.
     */
    boundingBox?: Polygon;

    /**
     * Indexes for which extended postal codes should be included in the results.
     * Available values are described in Additional Information indexes abbreviation values section.
     * By default, extended postal codes are included for all indexes except Geo.
     * Extended postal code lists for geographies can be quite long, so they have to be explicitly requested when needed.
     * Ex. extendedPostalCodesFor=[PAD, Addr, POI]
     */
    extendedPostalCodesFor?: GeocodingIndexTypesAbbreviation[];

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
     * A list of entity types which can be used to restrict the result to the Geography result of a specific entity type.
     * If entityTypeSet is specified, only a Geography result with a proper entity type will be returned.
     */
    entityTypeSet?: EntityType[];
};

type MapCodes = {
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

type Viewport = {
    /**
     * Top-left corner of the rectangle
     */
    topLeftPoint: LatLon;
    /**
     * Bottom-right corner of the rectangle
     */
    btmRightPoint: LatLon;
};

export type BoundingBox = Viewport;

type AddressRanges = {
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
    from: LatLon;
    /**
     * The end point of a street segment: Latitude, Longitude
     */
    to: LatLon;
};

type GeocodingLocationType = Exclude<LocationType, "POI">;

export type GeocodingAPIResult = {
    /**
     * Type of result.
     */
    type: GeocodingLocationType;
    /**
     * the non-stable unique id for this result.
     */
    id: string;
    /**
     * The score of the result.
     * A larger score means there is a probability that a result meeting the query criteria is higher.
     */
    score: number;
    /**
     The confidence of the result`s textual match with the query.
     */
    matchConfidence: { score: number };
    /**
     * Unit: meters. This is the distance to an object if geobias was provided.
     */
    dist?: number;
    /**
     * The structured address for the result.
     */
    address: AddressProperties;
    /**
     * The position of the result: Latitude, Longitude.
     */
    position: LatLon;
    /**
     * List of mapcode objects.
     */
    mapcodes?: MapCodes[];
    /**
     * A viewport which can be used to display the result on a map.
     */
    viewport: Viewport;
    /**
     * Optional section. Only present if type == Geography.
     * A bounding box which can be used to display the result on a map defined by minimum and maximum longitudes and latitudes.
     */
    boundingBox?: BoundingBox;
    /**
     * A list of entry points of the POI (Points of Interest).
     */
    entrypoints?: EntryPoint[];
    /**
     * The address ranges on a street segment. Available only for results where the result type is equal to Address Range.
     */
    addressRanges?: AddressRanges;
    /**
     * An optional section. These are unique reference ids for use with the Additional Data service.
     */
    dataSources?: DataSources;
};

export type GeocodingAPIResponse = {
    /**
     * Summary information about the search that was performed.
     */
    summary: Summary;
    /**
     * The result list, sorted in descending order by score.
     */
    results: GeocodingAPIResult[];
};

export type GeocodingSDKResult = Omit<GeocodingAPIResult, "dist" | "position" | "boundingBox" | "viewport"> & {
    position?: number[];
    distance?: number;
    boundingBox?: Polygon;
    viewport: Polygon;
};

export type GeocodingResponse = FeatureCollection<Point, GeocodingSDKResult>;

/**
 * Geocoding service template type.
 */
export type GeocodingTemplate = ServiceTemplate<GeocodingParams, URL, GeocodingResponse | unknown>;
