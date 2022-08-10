export type IndexTypesAbbreviation = "Geo" | "PAD" | "Addr" | "Str" | "XStr" | "POI";

export type LatLon = {
    /**
     * Latitude. min/max: -90 to +90
     */
    lat: number;
    /**
     * Longitude. min/max: -180 to +180
     */
    lon: number;
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
    functions: string[];
    /**
     * Position of the entry point.
     */
    position: LatLon;
};

type SummaryQueryType = "NEARBY" | "NON_NEAR";

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
    geoBias: LatLon;
};
