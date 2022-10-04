import {
    AddressProperties,
    Brand,
    Category,
    Classification,
    CommonPlaceProps,
    EntryPoint,
    OpeningHours,
    PlaceType,
    TimeZone
} from "@anw/go-sdk-js/core";

/**
 * @group Shared
 * @category Types
 */
export type IndexTypesAbbreviation = "Geo" | "PAD" | "Addr" | "Str" | "XStr" | "POI";
/**
 * @group Shared
 * @category Types
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
 * @group Shared
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
 * @group Shared
 */
export type BoundingBoxTopLeftAPI = ViewportAPI;
/**
 * @group Shared
 */
export type BoundingBoxSouthWestAPI = { southWest: string; northEast: string };

/**
 * @group Shared
 */
export type BoundingBoxAPI = BoundingBoxTopLeftAPI | BoundingBoxSouthWestAPI;

/**
 * @group Shared
 */
export type EntryPointAPI = Omit<EntryPoint, "position"> & {
    /**
     * Position of the entry point.
     */
    position: LatLonAPI;
};

/**
 * @group Shared
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

type SummaryQueryType = "NEARBY" | "NON_NEAR";

/**
 * @group Shared
 */
export type Summary = {
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
 * @group Geometry-Search
 * @category Types
 */
export type CommonPlaceResultAPI = Omit<
    CommonPlaceProps,
    "distance" | "position" | "viewport" | "addressRanges" | "geographyType" | "entryPoints"
> & {
    id: string;
    type: PlaceType;
    matchConfidence: { score: number };
    position: LatLonAPI;
    viewport?: ViewportAPI;
    entryPoints?: EntryPointAPI[];
    address?: AddressProperties;
    info?: string;
    poi?: POIAPI;
};
