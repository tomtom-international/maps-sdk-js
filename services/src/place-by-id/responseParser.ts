import { PlaceByIdResponse, PlaceByIdResponseAPI } from "./types";
import { parseSearchAPIResult } from "../shared/searchResultParsing";

/**
 * Default method for parsing place by id response.
 * @param apiResponse The place by id response.
 */
export const parsePlaceByIdResponse = (apiResponse: PlaceByIdResponseAPI): PlaceByIdResponse => {
    const features = apiResponse.results.map((result) => parseSearchAPIResult(result));
    return {
        type: "FeatureCollection",
        features
    };
};
