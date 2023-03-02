import {
    AddressProperties,
    Brand,
    Category,
    Classification,
    EntryPoint,
    OpeningHours,
    SearchPlaceProps,
    TimeZone
} from "@anw/go-sdk-js/core";

/**
 * @ignore
 */
export type IndexTypesAbbreviation = "Geo" | "PAD" | "Addr" | "Str" | "XStr" | "POI";

/**
 * @ignore
 */
export type LatLonAPI = {
    /**
     * Latitude. min/max: -90 to +90
     */
    lat: number;
    /**
     * Longitude. min/max: -180 to +180
     */
    lon: number;
};

/**
 * @ignore
 */
export type ViewportAPI = {
    /**
     * Top-left corner of the rectangle
     */
    topLeftPoint: LatLonAPI;
    /**
     * Bottom-right corner of the rectangle
     */
    btmRightPoint: LatLonAPI;
};

/**
 * @ignore
 */
export type BoundingBoxTopLeftAPI = ViewportAPI;

/**
 * @ignore
 */
export type BoundingBoxSouthWestAPI = { southWest: string; northEast: string };

/**
 * @ignore
 */
export type BoundingBoxAPI = BoundingBoxTopLeftAPI | BoundingBoxSouthWestAPI;

/**
 * @ignore
 */
export type EntryPointAPI = Omit<EntryPoint, "position"> & {
    /**
     * Position of the entry point.
     */
    position: LatLonAPI;
};

/**
 * @ignore
 */
export type AddressRangesAPI = {
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
    from: LatLonAPI;
    /**
     * The end point of a street segment: Latitude, Longitude
     */
    to: LatLonAPI;
};

/**
 * @ignore
 */
type SummaryQueryType = "NEARBY" | "NON_NEAR";

/**
 * @ignore
 */
export type SummaryAPI = {
    /**
     * 	The query as interpreted by the search engine.
     */
    query: string;
    /**
     Response type. Can be NEARBY or NON_NEAR.
     */
    queryType: SummaryQueryType;
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
    geoBias?: LatLonAPI;
};

/**
 * @ignore
 * place of interest api type.
 */
export type POIAPI = {
    name: string;
    phone?: string;
    brands?: Brand[];
    url?: string;
    // category ids
    categorySet?: Category[];
    // Example: Array(2) [café/pub, internet café]
    categories?: string[];
    openingHours?: OpeningHours;
    classifications?: Classification[];
    timeZone?: TimeZone;
};

/**
 * @ignore
 */
export type CommonSearchPlaceResultAPI = Omit<
    SearchPlaceProps,
    "distance" | "position" | "addressRanges" | "geographyType" | "entryPoints"
> & {
    id: string;
    position: LatLonAPI;
    dist?: number;
    viewport?: ViewportAPI;
    boundingBox?: BoundingBoxAPI;
    entryPoints?: EntryPointAPI[];
    address?: AddressProperties;
    poi?: POIAPI;
};
