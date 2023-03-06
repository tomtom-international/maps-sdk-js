import { parseFuzzySearchResponse } from "./ResponseParser";
import { buildFuzzySearchRequest } from "./RequestBuilder";
import { get } from "../shared/Fetch";
import { ServiceTemplate } from "../shared";
import { FuzzySearchParams, FuzzySearchResponse, FuzzySearchResponseAPI } from "./types";
import { fuzzySearchRequestSchema } from "./FuzzySearchRequestSchema";

/**
 * Fuzzy search service template type.
 */
export type FuzzySearchTemplate = ServiceTemplate<FuzzySearchParams, URL, FuzzySearchResponseAPI, FuzzySearchResponse>;

/**
 * Fuzzy search service template main implementation.
 */
export const fuzzySearchTemplate: FuzzySearchTemplate = {
    requestValidation: { schema: fuzzySearchRequestSchema },
    buildRequest: buildFuzzySearchRequest,
    sendRequest: get,
    parseResponse: parseFuzzySearchResponse
};
