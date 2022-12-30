import apiAndParsedResponses from "../../place-by-id/tests/ResponseParser.data.json";
import apiResponseForPerfTesting from "../../place-by-id/tests/ResponseParserPerf.data.json";
import { PlaceByIdResponse, PlaceByIdResponseAPI } from "../types";
import { parsePlaceByIdResponse } from "../ResponseParser";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

describe("Place By Id response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: PlaceByIdResponseAPI, parsedResponse: PlaceByIdResponse) => {
            expect(parsePlaceByIdResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});

describe("Place By Id response parser performance tests", () => {
    test("Place By Id response parser performance test", () => {
        expect(
            bestExecutionTimeMS(() => parsePlaceByIdResponse(apiResponseForPerfTesting as PlaceByIdResponseAPI), 3)
        ).toBeLessThan(MAX_EXEC_TIMES_MS.placeById.responseParsing);
    });
});
