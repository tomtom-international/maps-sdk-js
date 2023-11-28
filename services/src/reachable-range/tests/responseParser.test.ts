import { PolygonFeature } from "@anw/maps-sdk-js/core";
import { parseReachableRangeResponse } from "../responseParser";
import apiAndParsedResponses from "./responseParser.data.json";
import { ReachableRangeResponseAPI } from "../types/apiResponseTypes";
import { ReachableRangeParams } from "../types/reachableRangeParams";

describe.skip("Calculate Route response parsing functional tests", () => {
    // Functional tests:
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponse: ReachableRangeResponseAPI,
            params: ReachableRangeParams,
            parsedResponse: PolygonFeature<ReachableRangeParams>
        ) => expect(parseReachableRangeResponse(apiResponse, params)).toEqual(parsedResponse)
    );
});
