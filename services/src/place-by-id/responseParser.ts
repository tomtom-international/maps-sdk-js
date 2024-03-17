import type { PlaceByIdResponse, PlaceByIdResponseAPI } from "./types";
import { parseSearchAPIResult } from "../shared/searchResultParsing";

/**
 * Default method for parsing place by id response.
 * @param apiResponse The place by id response.
 */
export const parsePlaceByIdResponse = (apiResponse: PlaceByIdResponseAPI): PlaceByIdResponse =>
    apiResponse.results?.length ? parseSearchAPIResult(apiResponse.results[0]) : undefined;
