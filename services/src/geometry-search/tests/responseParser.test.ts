import type { GeometrySearchResponse, GeometrySearchResponseAPI } from "../types";
import apiAndParsedResponses from "../../geometry-search/tests/responseParser.data.json";
import apiResponses from "../../geometry-search/tests/responseParserPerf.data.json";
import { parseGeometrySearchResponse } from "../responseParser";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";

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
            expect(bestExecutionTimeMS(() => parseGeometrySearchResponse(apiResponse), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.search.geometrySearch.responseParsing
            );
        }
    );
});
