import type { Position } from "geojson";

type SummaryQueryType = "NEARBY" | "NON_NEAR";

/**
 * Common summary object returned from Search API calls.
 */
export type SearchSummary = {
    /**
     *  The query as interpreted by the search engine.
     */
    query: string;
    /**
     * Response type. Can be NEARBY or NON_NEAR.
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
     * The position used to bias the results.
     */
    geoBias?: Position;
};
