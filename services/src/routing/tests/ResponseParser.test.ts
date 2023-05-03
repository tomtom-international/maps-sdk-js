import { Routes } from "@anw/maps-sdk-js/core";
import { CalculateRouteParams } from "..";
import apiAndParsedResponses from "./ResponseParser.data.json";
import longAPIResponse from "./ResponseParserPerf.data.json";
import { parseCalculateRouteResponse } from "../ResponseParser";
import { CalculateRouteResponseAPI } from "../types/APIResponseTypes";
import errorResponses from "./ResponseParserError.data.json";
import { parseRoutingResponseError } from "../RoutingResponseErrorParser";
import { ErrorObjAPI, RoutingAPIResponseError } from "../../shared/types/APIResponseErrorTypes";
import { SDKServiceError } from "../../shared";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

describe("Calculate Route response parsing functional tests", () => {
    // Functional tests:
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponse: CalculateRouteResponseAPI,
            params: CalculateRouteParams,
            parsedResponse: Routes
        ) => {
            // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
            // (We reparse the objects to compare them ignoring the order of properties)
            expect(JSON.parse(JSON.stringify(parseCalculateRouteResponse(apiResponse, params)))).toMatchObject(
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
                bestExecutionTimeMS(
                    () => parseCalculateRouteResponse(longAPIResponse as CalculateRouteResponseAPI, {} as never),
                    20
                )
            ).toBeLessThan(MAX_EXEC_TIMES_MS.routing.responseParsing);
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

describe("Routing - invalid response", () => {
    test("Not throw when route has no section", async () => {
        const apiRoute = apiAndParsedResponses[0][1] as unknown as CalculateRouteResponseAPI;

        for (const route of apiRoute.routes) {
            if (route.sections) {
                // @ts-ignore
                route.sections = undefined;
            }
        }

        expect(() => parseCalculateRouteResponse(apiRoute, {} as never)).not.toThrow();
    });
});
