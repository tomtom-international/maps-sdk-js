import { parseFuzzySearchResponse } from "./ResponseParser";
import { buildFuzzySearchRequest } from "./RequestBuilder";
import { getJson } from "../shared/Fetch";
import { ServiceTemplate } from "../shared";
import { FuzzySearchParams, FuzzySearchResponse, FuzzySearchResponseAPI } from "./types";
import { fuzzySearchRequestSchema } from "./FuzzySearchRequestSchema";

/**
 * Fuzzy search service template type.
 * @group Fuzzy Search
 * @category Types
 */
export type FuzzySearchTemplate = ServiceTemplate<FuzzySearchParams, URL, FuzzySearchResponseAPI, FuzzySearchResponse>;

/**
 * Fuzzy search service template main implementation.
 * @group Fuzzy Search
 * @category Variables
 */
export const fuzzySearchTemplate: FuzzySearchTemplate = {
    validateRequestSchema: fuzzySearchRequestSchema,
    buildRequest: buildFuzzySearchRequest,
    sendRequest: getJson,
    parseResponse: parseFuzzySearchResponse
};
