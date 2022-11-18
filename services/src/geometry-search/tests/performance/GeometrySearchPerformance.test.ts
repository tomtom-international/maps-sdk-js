import { GeometrySearchParams, GeometrySearchResponseAPI } from "../../types";
import { buildGeometrySearchRequest } from "../../RequestBuilder";
import geometrySearchReqObjects from "../performance/RequestBuilderForPerf.data.json";
import geometrySearchResponses from "../performance/ResponseParserForPerf.data.json";
import { parseGeometrySearchResponse } from "../../ResponseParser";

describe("Geometry Search request URL builder performance tests", () => {
    const REFERENCE_KPI = 2; //1ms - needs to be agreed
    test.each(geometrySearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (params: GeometrySearchParams) => {
            const t0 = performance.now();
            buildGeometrySearchRequest(params);
            const t1 = performance.now();
            expect(Number(`${t1 - t0}`)).toBeLessThanOrEqual(REFERENCE_KPI);
        }
    );
});

describe("Geometry Search response parser performance tests", () => {
    const REFERENCE_KPI = 7; //3ms - needs to be agreed
    test.each(geometrySearchResponses)(
        "'%s'",
        // @ts-ignore
        (_name: title, apiResponse: GeometrySearchResponseAPI) => {
            const t0 = performance.now();
            parseGeometrySearchResponse(apiResponse);
            const t1 = performance.now();
            expect(Number(`${t1 - t0}`)).toBeLessThanOrEqual(REFERENCE_KPI);
        }
    );
});
