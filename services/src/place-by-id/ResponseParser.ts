import { PlaceByIdResponse, PlaceByIdResponseAPI } from "./types";
import { parseSearchAPIResult } from "../shared/SearchResultParsing";

export const parsePlaceByIdResponse = (apiResponse: PlaceByIdResponseAPI): PlaceByIdResponse => {
    const features = apiResponse.results.map((result) => parseSearchAPIResult(result));
    return {
        type: "FeatureCollection",
        features
    };
};
