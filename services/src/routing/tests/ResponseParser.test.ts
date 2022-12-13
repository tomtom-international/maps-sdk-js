import apiAndParsedResponses from "./ResponseParser.data.json";
import longAPIResponse from "./ResponseParserPerf.data.json";
import { parseCalculateRouteResponse } from "../ResponseParser";
import { CalculateRouteResponseAPI } from "../types/APITypes";
import { CalculateRouteResponse } from "../CalculateRoute";
import errorResponses from "./ResponseParserError.data.json";
import { parseRoutingResponseError } from "../RoutingResponseErrorParser";
import { ErrorObjAPI, RoutingAPIResponseError } from "../../shared/types/APIResponseErrorTypes";
import { SDKServiceError } from "../../shared/Errors";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";

describe("Calculate Route response parsing functional tests", () => {
    // Functional tests:
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: CalculateRouteResponseAPI, parsedResponse: CalculateRouteResponse) => {
            // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
            // (We reparse the objects to compare them ignoring the order of properties)
            expect(JSON.parse(JSON.stringify(parseCalculateRouteResponse(apiResponse)))).toStrictEqual(
                JSON.parse(JSON.stringify(parsedResponse))
            );
        }
    );
});

describe("Calculate Route response parsing performance tests", () => {
    test(
        "Parsing a very long API response " + "(e.g. Lisbon - Moscow with sections, instructions and alternatives)",
        () => {
            expect(
                assertExecutionTime(
                    () => parseCalculateRouteResponse(longAPIResponse as CalculateRouteResponseAPI),
                    20,
                    50
                )
            ).toBeTruthy();
        }
    );
});

describe("Routing - error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        async (
            _name: string,
            apiResponseError: ErrorObjAPI<RoutingAPIResponseError>,
            expectedSDKError: SDKServiceError
        ) => {
            const sdkRoutingResponseError = parseRoutingResponseError(apiResponseError, "Routing");
            expect(sdkRoutingResponseError).toMatchObject(expectedSDKError);
        }
    );
});
