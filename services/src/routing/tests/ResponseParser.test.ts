import apiAndParsedResponses from "./ResponseParser.data.json";
import longAPIResponse from "./LongRouteAPIResponse.data.json";
import { parseCalculateRouteResponse } from "../ResponseParser";
import { CalculateRouteResponseAPI } from "../types/APITypes";
import { CalculateRouteResponse } from "../CalculateRoute";

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
            let accExecTimes = 0;
            for (let i = 0; i < numExecutions; i++) {
                const start = performance.now();
                parseCalculateRouteResponse(longAPIResponse as CalculateRouteResponseAPI);
                accExecTimes += performance.now() - start;
            }
            const averageExecTime = accExecTimes / numExecutions;
            expect(averageExecTime).toBeLessThan(50);
        }
    );
});
