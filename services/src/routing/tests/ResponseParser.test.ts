import apiAndParsedResponses from "./ResponseParser.data.json";
import longAPIResponse from "./LongRouteAPIResponse.data.json";
import { parseCalculateRouteResponse } from "../ResponseParser";
import { CalculateRouteResponseAPI } from "../types/APITypes";
import { CalculateRouteResponse } from "../CalculateRoute";
import errorResponses from "./ResponseParserError.data.json";
import { routingResponseErrorParser } from "../../routing/RoutingResponseErrorParser";
import { RoutingAPIResponseError } from "../../shared/types/APIResponseErrorTypes";

describe("Calculate Route response parsing functional tests", () => {
    // Functional tests:
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: CalculateRouteResponseAPI, parsedResponse: CalculateRouteResponse) => {
            expect(JSON.stringify(parseCalculateRouteResponse(apiResponse))).toStrictEqual(
                JSON.stringify(parsedResponse)
            );
        }
    );
});

describe("Calculate Route response parsing performance tests", () => {
    test(
        "Parsing a very long API response " + "(e.g. Lisbon - Moscow with sections, instructions and alternatives)",
        async () => {
            const numExecutions = 20;
            const accExecTimes = [];
            for (let i = 0; i < numExecutions; i++) {
                const start = performance.now();
                parseCalculateRouteResponse(longAPIResponse as CalculateRouteResponseAPI);
                accExecTimes.push(performance.now() - start);
            }
            expect(Math.min.apply(null, accExecTimes)).toBeLessThan(50);
        }
    );
});

describe("Routing - error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        (errorCode: number, errorDesc: string, apiErrorResponse: RoutingAPIResponseError) => {
            const apiError = {
                status: errorCode,
                message: errorDesc,
                data: apiErrorResponse
            };
            const sdkError = routingResponseErrorParser(apiError, "Routing");
            expect(sdkError.message).toEqual(apiErrorResponse.detailedError.message);
        }
    );
});
