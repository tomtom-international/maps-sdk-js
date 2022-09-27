import { GeometrySearchResponse, GeometrySearchResponseAPI } from "../types";
import apiAndParsedResponses from "../../geometry-search/tests/ResponseParser.data.json";
import { parseGeometrySearchResponse } from "../ResponseParser";
import errorResponses from "../../geometry-search/tests/ResponseParserError.data.json";
import { DefaultAPIResponseError, ErrorObjAPI } from "../../shared/types/APIResponseErrorTypes";
import { defaultResponseParserError } from "../../shared/Errors";

describe("Geometry Search response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: GeometrySearchResponseAPI, parsedResponse: GeometrySearchResponse) => {
            expect(parseGeometrySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});

describe("Geometry Search - error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        async (_name: string, apiResponseError: ErrorObjAPI<DefaultAPIResponseError>, expectedSDKError: string) => {
            const sdkGeometrySearchResponseError = defaultResponseParserError(apiResponseError, "GeometrySearch");
            expect(sdkGeometrySearchResponseError).toMatchObject(expectedSDKError);
        }
    );
});
