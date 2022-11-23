import { GeometrySearchParams, GeometrySearchResponseAPI } from "../../types";
import { buildGeometrySearchRequest } from "../../RequestBuilder";
import geometrySearchReqObjects from "../performance/RequestBuilderForPerf.data.json";
import geometrySearchResponses from "../performance/ResponseParserForPerf.data.json";
import { parseGeometrySearchResponse } from "../../ResponseParser";
import { assertExecutionTime } from "../../../shared/tests/PerformanceTestUtils";

describe("Geometry Search request URL builder performance tests", () => {
    test.each(geometrySearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (params: GeometrySearchParams) => {
            expect(assertExecutionTime(() => buildGeometrySearchRequest(params), 10, 2)).toBeTruthy();
        }
    );
});

describe("Geometry Search response parser performance tests", () => {
    test.each(geometrySearchResponses)(
        "'%s'",
        // @ts-ignore
        (_name: title, apiResponse: GeometrySearchResponseAPI) => {
            expect(assertExecutionTime(() => parseGeometrySearchResponse(apiResponse), 10, 5)).toBeTruthy();
        }
    );
});
