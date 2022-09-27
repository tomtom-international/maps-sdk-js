import {GeometrySearchResponse, GeometrySearchResponseAPI} from "../types";
import apiAndParsedResponses from "../../geometry-search/tests/ResponseParser.data.json";
import {parseGeometrySearchResponse} from "../ResponseParser";
import errorResponses from "../../routing/tests/ResponseParserError.data.json";
import {ErrorObjAPI, RoutingAPIResponseError} from "../../shared/types/APIResponseErrorTypes";
import {routingResponseErrorParser} from "../../routing/RoutingResponseErrorParser";

describe("Geometry Search response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: GeometrySearchResponseAPI, parsedResponse: GeometrySearchResponse) => {
            expect(parseGeometrySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});

describe("Routing - error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        // async (_name: string, apiResponseError: ErrorObjAPI<RoutingAPIResponseError>, expectedSDKError: string) => {
        //     const sdkRoutingResponseError = routingResponseErrorParser(apiResponseError, "Routing");
        //     expect(sdkRoutingResponseError).toMatchObject(expectedSDKError);
        // }
        async (_name: string, apiResponseError: ErrorObjAPI<RoutingAPIResponseError>) => {
            const sdkRoutingResponseError = routingResponseErrorParser(apiResponseError, "GeometrySearch");
            console.log(JSON.stringify(sdkRoutingResponseError));
        }
    );
});
