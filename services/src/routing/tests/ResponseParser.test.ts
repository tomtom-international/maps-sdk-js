import { Routes } from "@anw/go-sdk-js/core";
import apiAndParsedResponses from "./ResponseParser.data.json";
import longAPIResponse from "./ResponseParserPerf.data.json";
import { parseCalculateRouteResponse } from "../ResponseParser";
import { CalculateRouteResponseAPI } from "../types/APITypes";
import errorResponses from "./ResponseParserError.data.json";
import { parseRoutingResponseError } from "../RoutingResponseErrorParser";
import { ErrorObjAPI, RoutingAPIResponseError } from "../../shared/types/APIResponseErrorTypes";
import { SDKServiceError } from "../../shared";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import perfConfig from "services/perfConfig.json";

describe("Calculate Route response parsing functional tests", () => {
    // Functional tests:
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: CalculateRouteResponseAPI, parsedResponse: Routes) => {
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
                bestExecutionTimeMS(() => parseCalculateRouteResponse(longAPIResponse as CalculateRouteResponseAPI), 20)
            ).toBeLessThan(perfConfig.routing.responseParsing);
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
