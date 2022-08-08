import { AddressProperties, GeometryDataSource } from "core";
import { GeocodingParams } from "./GeocodingParams";
import { MapcodeType } from "../..";
import { FeatureCollection, Point } from "geojson";
import { toPointFeature } from "@anw/go-sdk-js/core";

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

type BoundingBox = Viewport;

type EntryPoint = {
    /**
     * The main entry point.
     */
    type: "main" | "minor";
    /**
     * If present, represents the type of access for the POI.
     * Example: FrontDoor
     */
    functions: [];
    /**
     * Position of the entry point.
     */
    position: LatLon;
};

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

type LatLon = {
    /**
     * Latitude. min/max: -90 to +90
     */
    lat: number;
    /**
     * Longitude. min/max: -180 to +180
     */
    lon: number;
};

type DataSources = {
    /**
     * Information about the geometric shape of the result. Only present if type == Geography.
     */
    geometry: GeometryDataSource;
};

export type GeocodingAPIResult = {
    /**
     * Type of result.
     */
    type: "POI" | "Street" | "Geography" | "Point Address" | "Address Range" | "Cross Street";
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

type Summary = {
    /**
     * 	The query as interpreted by the search engine.
     */
    query: string;
    /**
     Response type. Can be NEARBY or NON_NEAR.
     */
    queryType: string;
    /**
     * Time spent on resolving the query.
     */
    queryTime: number;
    /**
     * The number of results in the response.
     */
    numResults: number;
    /**
     * The starting offset of the returned results within the full result set.
     */
    offset: number;
    /**
     * The total number of results found.
     */
    totalResults: number;
    /**
     * The maximum fuzzy level required to provide results.
     */
    fuzzyLevel: number;
    /**
     * The position used to bias the results: Latitude, Longitude
     */
    geoBias: LatLon;
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

export type GeocodingResponse = FeatureCollection<Point, GeocodingAPIResult>;

export const parseGeocodingResponse = (
    _params: GeocodingParams,
    apiResponse: GeocodingAPIResponse
): GeocodingResponse => {
    const results = apiResponse.results;
    const features = results.map((result) => ({
        ...toPointFeature([result.position.lon, result.position.lat]),
        properties: {
            ...result
        }
    }));
    return {
        type: "FeatureCollection",
        features
    };
};
