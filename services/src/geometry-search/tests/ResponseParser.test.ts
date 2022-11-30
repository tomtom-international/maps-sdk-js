import { GeometrySearchResponse, GeometrySearchResponseAPI } from "../types";
import apiAndParsedResponses from "../../geometry-search/tests/ResponseParser.data.json";
import apiResponses from "../../geometry-search/tests/ResponseParserPerf.data.json";
import { parseGeometrySearchResponse } from "../ResponseParser";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";

describe("Geometry Search response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: GeometrySearchResponseAPI, parsedResponse: GeometrySearchResponse) => {
            expect(parseGeometrySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});

describe("Geometry Search response parser performance tests", () => {
    test.each(apiResponses)(
        "'%s'",
        // @ts-ignore
        (_title: string, apiResponse: GeometrySearchResponseAPI) => {
            expect(assertExecutionTime(() => parseGeometrySearchResponse(apiResponse), 10, 5)).toBeTruthy();
        }
    );
});
